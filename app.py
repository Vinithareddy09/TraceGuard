from flask import Flask, render_template, request, jsonify, session
import sqlite3
import os
import hashlib

from crypto_utils import encrypt_text, decrypt_text, fingerprint, semantic_similarity
from trace_utils import create_trace, verify_trace

app = Flask(__name__)
app.secret_key = "traceguard-secret-key"  # REQUIRED for session
DB = "storage.db"

# --------------------------------------------------
# DATABASE INITIALIZATION
# --------------------------------------------------
def init_db():
    conn = sqlite3.connect(DB)
    c = conn.cursor()

    # USERS TABLE
    c.execute("""
    CREATE TABLE IF NOT EXISTS users(
        email TEXT PRIMARY KEY,
        password_hash TEXT
    )
    """)

    # DOCUMENTS TABLE
    c.execute("""
    CREATE TABLE IF NOT EXISTS documents(
        name TEXT,
        content BLOB,
        fingerprint TEXT PRIMARY KEY
    )
    """)

    # AUDIT TRACES TABLE
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
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def require_login():
    if "user" not in session:
        return False
    return True


# --------------------------------------------------
# UI
# --------------------------------------------------
@app.route("/")
def dashboard():
    return render_template("dashboard.html")


# --------------------------------------------------
# AUTHENTICATION
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

    session["user"] = email
    return jsonify({"status": "login_success", "user": email})


@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"status": "logged_out"})


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
def list_documents():
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
# UPLOAD DOCUMENT
# --------------------------------------------------
@app.route("/upload", methods=["POST"])
def upload():
    if not require_login():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    name = data.get("name")
    text = data.get("text")

    if not name or not text:
        return jsonify({"error": "Invalid input"}), 400

    fp = fingerprint(text)

    conn = sqlite3.connect(DB)
    c = conn.cursor()

    # Prevent duplicate documents
    c.execute("SELECT * FROM documents WHERE fingerprint=?", (fp,))
    if c.fetchone():
        conn.close()
        return jsonify({
            "status": "already_exists",
            "fingerprint": fp
        })

    enc = encrypt_text(text)
    c.execute(
        "INSERT INTO documents VALUES (?,?,?)",
        (name, enc, fp)
    )
    conn.commit()
    conn.close()

    save_trace(create_trace("UPLOAD", name, fp, session["user"]))

    return jsonify({
        "status": "stored",
        "fingerprint": fp
    })


# --------------------------------------------------
# ACCESS DOCUMENT
# --------------------------------------------------
@app.route("/access", methods=["POST"])
def access():
    if not require_login():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    name = data.get("name")

    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT fingerprint FROM documents WHERE name=?", (name,))
    row = c.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Document not found"}), 404

    save_trace(create_trace(
        "ACCESS",
        name,
        row[0],
        session["user"]
    ))

    return jsonify({"status": "access recorded"})


# --------------------------------------------------
# SEMANTIC REUSE DETECTION
# --------------------------------------------------
@app.route("/reuse_check", methods=["POST"])
def reuse_check():
    if not require_login():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    text = data.get("text")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT name, content FROM documents")
    rows = c.fetchall()
    conn.close()

    matches = []

    for name, enc in rows:
        original = decrypt_text(enc)
        score = semantic_similarity(text, original)

        if score >= 0.45:
            matches.append({
                "document": name,
                "similarity": round(score * 100, 2)
            })
            save_trace(create_trace(
                "REUSE_DETECTED",
                name,
                fingerprint(text),
                session["user"]
            ))

    return jsonify({
        "method": "Semantic Similarity",
        "matches": matches
    })


# --------------------------------------------------
# AUDIT LOG
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
