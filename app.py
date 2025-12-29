from flask import Flask, render_template, request, jsonify
import sqlite3
import os
import hashlib

from crypto_utils import encrypt_text, decrypt_text, fingerprint, semantic_similarity
from trace_utils import create_trace, verify_trace

app = Flask(__name__)
DB = "storage.db"

# --------------------------------------------------
# DATABASE INITIALIZATION
# --------------------------------------------------
def init_db():
    conn = sqlite3.connect(DB)
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
# HELPERS
# --------------------------------------------------
def hash_password(password: str) -> str:
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
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing credentials"}), 400

    try:
        conn = sqlite3.connect(DB)
        c = conn.cursor()
        c.execute(
            "INSERT INTO users VALUES (?,?)",
            (email, hash_password(password))
        )
        conn.commit()
        conn.close()
        return jsonify({"status": "registered"})
    except sqlite3.IntegrityError:
        return jsonify({"error": "User already exists"}), 400

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute(
        "SELECT * FROM users WHERE email=? AND password_hash=?",
        (email, hash_password(password))
    )
    user = c.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({"status": "login_success", "user": email})

# --------------------------------------------------
# STATS
# --------------------------------------------------
@app.route("/stats")
def stats():
    conn = sqlite3.connect(DB)
    c = conn.cursor()

    c.execute("SELECT COUNT(*) FROM documents")
    docs = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM traces WHERE action='ACCESS'")
    accesses = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM traces WHERE action='REUSE_DETECTED'")
    reuse_events = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM traces")
    logs = c.fetchone()[0]

    conn.close()

    return jsonify({
        "documents": docs,
        "accesses": accesses,
        "reuse_events": reuse_events,
        "audit_logs": logs
    })

# --------------------------------------------------
# DOCUMENT VAULT
# --------------------------------------------------
@app.route("/documents")
def documents():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT name, fingerprint FROM documents")
    rows = c.fetchall()
    conn.close()

    return jsonify([
        {
            "name": r[0],
            "fingerprint": r[1][:12] + "..."
        } for r in rows
    ])

# --------------------------------------------------
# UPLOAD
# --------------------------------------------------
@app.route("/upload", methods=["POST"])
def upload():
    data = request.json
    name = data.get("name")
    text = data.get("text")
    user = data.get("user")

    if not all([name, text, user]):
        return jsonify({"error": "Missing data"}), 400

    enc = encrypt_text(text)
    fp = fingerprint(text)

    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute(
        "INSERT OR REPLACE INTO documents VALUES (?,?,?)",
        (name, enc, fp)
    )
    conn.commit()
    conn.close()

    save_trace(create_trace("UPLOAD", name, fp, user))

    return jsonify({"status": "stored", "fingerprint": fp})

# --------------------------------------------------
# ACCESS
# --------------------------------------------------
@app.route("/access", methods=["POST"])
def access():
    data = request.json
    name = data.get("name")
    user = data.get("user")

    if not name or not user:
        return jsonify({"error": "Missing data"}), 400

    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT fingerprint FROM documents WHERE name=?", (name,))
    row = c.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Document not found"}), 404

    save_trace(create_trace("ACCESS", name, row[0], user))
    return jsonify({"status": "access recorded"})

# --------------------------------------------------
# REUSE CHECK
# --------------------------------------------------
@app.route("/reuse_check", methods=["POST"])
def reuse_check():
    data = request.json
    text = data.get("text")
    user = data.get("user")

    if not text or not user:
        return jsonify({"error": "Missing data"}), 400

    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT name, content FROM documents")
    rows = c.fetchall()
    conn.close()

    matches = []

    for name, enc in rows:
        original = decrypt_text(enc)
        score = semantic_similarity(text, original)

        if score >= 0.6:
            matches.append({
                "document": name,
                "similarity": round(score * 100, 2)
            })
            save_trace(
                create_trace(
                    "REUSE_DETECTED",
                    name,
                    fingerprint(text),
                    user
                )
            )

    return jsonify({
        "method": "TF-IDF Semantic Similarity",
        "matches": matches
    })

# --------------------------------------------------
# AUDIT
# --------------------------------------------------
@app.route("/audit")
def audit():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT * FROM traces ORDER BY timestamp DESC")
    rows = c.fetchall()
    conn.close()

    logs = []
    for r in rows:
        trace = {
            "action": r[0],
            "document": r[1],
            "fingerprint": r[2],
            "user": r[3],
            "timestamp": r[4],
            "proof": r[5]
        }
        trace["verified"] = verify_trace(trace)
        logs.append(trace)

    return jsonify(logs)

# --------------------------------------------------
# TRACE STORAGE
# --------------------------------------------------
def save_trace(trace):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute(
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
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
