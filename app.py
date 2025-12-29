from flask import Flask, render_template, request, jsonify
import sqlite3

from crypto_utils import encrypt_text, semantic_fingerprint
from trace_utils import create_trace, verify_trace

app = Flask(__name__)
DB = "storage.db"

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

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/access_ui")
def access_ui():
    return render_template("access.html")

@app.route("/reuse_ui")
def reuse_ui():
    return render_template("reuse.html")

@app.route("/audit_ui")
def audit_ui():
    return render_template("audit.html")

@app.route("/upload", methods=["POST"])
def upload():
    data = request.json
    enc = encrypt_text(data["text"])
    fp = semantic_fingerprint(data["text"])

    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("INSERT INTO documents VALUES (?,?,?)",
              (data["name"], enc, fp))
    conn.commit()
    conn.close()

    save_trace(create_trace("UPLOAD", data["name"], fp))
    return jsonify({"status": "Uploaded", "fingerprint": fp})

@app.route("/access", methods=["POST"])
def access():
    name = request.json["name"]
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT fingerprint FROM documents WHERE name=?", (name,))
    row = c.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Not found"}), 404

    save_trace(create_trace("ACCESS", name, row[0]))
    return jsonify({"status": "Access recorded"})

@app.route("/reuse_check", methods=["POST"])
def reuse():
    fp = semantic_fingerprint(request.json["text"])
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT name FROM documents WHERE fingerprint=?", (fp,))
    rows = c.fetchall()
    conn.close()

    reused = [r[0] for r in rows]
    for doc in reused:
        save_trace(create_trace("REUSE_DETECTED", doc, fp))

    return jsonify({"reused_in": reused})

@app.route("/audit")
def audit():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT * FROM traces")
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

def save_trace(trace):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("INSERT INTO traces VALUES (?,?,?,?,?)",
              (trace["action"], trace["document"], trace["fingerprint"],
               trace["timestamp"], trace["proof"]))
    conn.commit()
    conn.close()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)


