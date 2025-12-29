from flask import Flask, render_template, request, jsonify
import sqlite3
import os

from crypto_utils import (
    encrypt_text,
    decrypt_text,
    fingerprint,
    semantic_similarity
)
from trace_utils import create_trace, verify_trace

app = Flask(__name__)
DB = "storage.db"

# ---------- DATABASE ----------
def init_db():
    conn = sqlite3.connect(DB)
    c = conn.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS documents(
        name TEXT,
        content BLOB,
        fingerprint TEXT
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS traces(
        action TEXT,
        document TEXT,
        fingerprint TEXT,
        timestamp REAL,
        proof TEXT
    )
    """)

    conn.commit()
    conn.close()

init_db()

# ---------- UI ----------
@app.route("/")
def dashboard():
    return render_template("dashboard.html")

# ---------- STATS (NEW) ----------
@app.route("/stats")
def stats():
    conn = sqlite3.connect(DB)
    c = conn.cursor()

    c.execute("SELECT COUNT(*) FROM documents")
    docs = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM traces WHERE action='ACCESS'")
    accesses = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM traces WHERE action='REUSE_DETECTED'")
    reuse = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM traces")
    logs = c.fetchone()[0]

    conn.close()

    return jsonify({
        "documents": docs,
        "accesses": accesses,
        "reuse_events": reuse,
        "audit_logs": logs
    })

# ---------- UPLOAD ----------
@app.route("/upload", methods=["POST"])
def upload():
    data = request.json
    name = data["name"]
    text = data["text"]

    enc = encrypt_text(text)
    fp = fingerprint(text)

    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("INSERT INTO documents VALUES (?,?,?)", (name, enc, fp))
    conn.commit()
    conn.close()

    save_trace(create_trace("UPLOAD", name, fp))

    return jsonify({
        "status": "Uploaded",
        "fingerprint": fp
    })

# ---------- ACCESS ----------
@app.route("/access", methods=["POST"])
def access():
    name = request.json["name"]

    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT fingerprint FROM documents WHERE name=?", (name,))
    row = c.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Document not found"}), 404

    save_trace(create_trace("ACCESS", name, row[0]))

    return jsonify({"status": "Access recorded"})

# ---------- SEMANTIC REUSE (UPGRADED) ----------
@app.route("/reuse_check", methods=["POST"])
def reuse():
    text = request.json["text"]

    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT name, content FROM documents")
    rows = c.fetchall()
    conn.close()

    results = []

    for name, enc_content in rows:
        original = decrypt_text(enc_content)
        score = semantic_similarity(text, original)

        if score >= 0.6:
            results.append({
                "document": name,
                "similarity": round(score * 100, 2)
            })
            save_trace(
                create_trace("REUSE_DETECTED", name, fingerprint(text))
            )

    return jsonify({
        "method": "TF-IDF Semantic Similarity",
        "matches": results
    })

# ---------- AUDIT ----------
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
            "timestamp": r[3],
            "proof": r[4]
        }
        trace["verified"] = verify_trace(trace)
        logs.append(trace)

    return jsonify(logs)

# ---------- TRACE SAVE ----------
def save_trace(trace):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute(
        "INSERT INTO traces VALUES (?,?,?,?,?)",
        (
            trace["action"],
            trace["document"],
            trace["fingerprint"],
            trace["timestamp"],
            trace["proof"]
        )
    )
    conn.commit()
    conn.close()

# ---------- RUN ----------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
