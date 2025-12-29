from flask import Flask, render_template, request, jsonify
import sqlite3
import os
import hashlib

from crypto_utils import encrypt_text, decrypt_text, fingerprint, semantic_similarity
from trace_utils import create_trace, verify_trace

app = Flask(__name__)
DB = "storage.db"

# --------------------------------------------------
# DATABASE CONNECTION (SAFE)
# --------------------------------------------------
def get_db():
    conn = sqlite3.connect(DB, timeout=30, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn

# --------------------------------------------------
# INITIALIZE DATABASE
# --------------------------------------------------
def init_db():
    conn = get_db()
    c = conn.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS users(
        email TEXT PRIMARY KEY,
        password_hash TEXT
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS documents(
        name TEXT PRIMARY KEY,
        content BLOB,
        fingerprint TEXT
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS traces(
        action TEXT,
        document TEXT,
        fingerprint TEXT,
        user TEXT,
        timestamp REAL,
        proof TEXT
    )
    """)

    conn.commit()
    conn.close()

init_db()

# --------------------------------------------------
# UTILS
# --------------------------------------------------
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# --------------------------------------------------
# UI
# --------------------------------------------------
@app.route("/")
def dashboard():
    return render_template("dashboard.html")

# --------------------------------------------------
# AUTH
# --------------------------------------------------
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    try:
        conn = get_db()
        conn.execute(
            "INSERT INTO users VALUES (?,?)",
            (data["email"], hash_password(data["password"]))
        )
        conn.commit()
        return jsonify({"status": "registered"})
    except sqlite3.IntegrityError:
        return jsonify({"error": "User already exists"}), 400
    finally:
        conn.close()

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    conn = get_db()
    cur = conn.execute(
        "SELECT * FROM users WHERE email=? AND password_hash=?",
        (data["email"], hash_password(data["password"]))
    )
    user = cur.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({"status": "login_success", "user": data["email"]})

# --------------------------------------------------
# STATS
# --------------------------------------------------
@app.route("/stats")
def stats():
    conn = get_db()
    stats = {
        "documents": conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0],
        "accesses": conn.execute("SELECT COUNT(*) FROM traces WHERE action='ACCESS'").fetchone()[0],
        "reuse_events": conn.execute("SELECT COUNT(*) FROM traces WHERE action='REUSE_DETECTED'").fetchone()[0],
        "audit_logs": conn.execute("SELECT COUNT(*) FROM traces").fetchone()[0]
    }
    conn.close()
    return jsonify(stats)

# --------------------------------------------------
# DOCUMENT LIST
# --------------------------------------------------
@app.route("/documents")
def documents():
    conn = get_db()
    rows = conn.execute("SELECT name, fingerprint FROM documents").fetchall()
    conn.close()

    return jsonify([
        {"name": r["name"], "fingerprint": r["fingerprint"][:12] + "..."}
        for r in rows
    ])

# --------------------------------------------------
# UPLOAD
# --------------------------------------------------
@app.route("/upload", methods=["POST"])
def upload():
    data = request.json
    user = data.get("user")

    enc = encrypt_text(data["text"])
    fp = fingerprint(data["text"])

    conn = get_db()
    conn.execute(
        "INSERT OR REPLACE INTO documents VALUES (?,?,?)",
        (data["name"], enc, fp)
    )
    conn.commit()
    conn.close()

    save_trace(create_trace("UPLOAD", data["name"], fp, user))
    return jsonify({"status": "stored", "fingerprint": fp})

# --------------------------------------------------
# ACCESS
# --------------------------------------------------
@app.route("/access", methods=["POST"])
def access():
    data = request.json
    user = data.get("user")

    conn = get_db()
    row = conn.execute(
        "SELECT fingerprint FROM documents WHERE name=?",
        (data["name"],)
    ).fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Document not found"}), 404

    save_trace(create_trace("ACCESS", data["name"], row["fingerprint"], user))
    return jsonify({"status": "access recorded"})

# --------------------------------------------------
# REUSE CHECK
# --------------------------------------------------
@app.route("/reuse_check", methods=["POST"])
def reuse_check():
    data = request.json
    user = data.get("user")

    conn = get_db()
    rows = conn.execute("SELECT name, content FROM documents").fetchall()
    conn.close()

    matches = []

    for r in rows:
        score = semantic_similarity(data["text"], decrypt_text(r["content"]))
        if score >= 0.6:
            matches.append({
                "document": r["name"],
                "similarity": round(score * 100, 2)
            })
            save_trace(create_trace(
                "REUSE_DETECTED",
                r["name"],
                fingerprint(data["text"]),
                user
            ))

    return jsonify({"matches": matches})

# --------------------------------------------------
# AUDIT
# --------------------------------------------------
@app.route("/audit")
def audit():
    conn = get_db()
    rows = conn.execute("SELECT * FROM traces ORDER BY timestamp DESC").fetchall()
    conn.close()

    logs = []
    for r in rows:
        trace = dict(r)
        trace["verified"] = verify_trace(trace)
        logs.append(trace)

    return jsonify(logs)

# --------------------------------------------------
# TRACE SAVE
# --------------------------------------------------
def save_trace(trace):
    conn = get_db()
    conn.execute(
        "INSERT INTO traces VALUES (?,?,?,?,?,?)",
        (
            trace["action"],
            trace["document"],
            trace["fingerprint"],
            trace["user"],
            trace["timestamp"],
            trace["proof"]
        )
    )
    conn.commit()
    conn.close()

# --------------------------------------------------
# RUN
# --------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
