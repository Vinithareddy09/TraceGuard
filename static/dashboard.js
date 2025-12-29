// -------- ELEMENT REFERENCES --------
const nameInput = document.getElementById("name");
const textInput = document.getElementById("text");
const reuseTextInput = document.getElementById("reuseText");
const reuseResult = document.getElementById("reuseResult");

const docs = document.getElementById("docs");
const access = document.getElementById("access");
const reuse = document.getElementById("reuse");
const logs = document.getElementById("logs");
const auditTable = document.getElementById("auditTable");

// -------- UPLOAD --------
function upload() {
  fetch("/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: nameInput.value,
      text: textInput.value
    })
  })
  .then(r => r.json())
  .then(d => {
    // Alert (optional but fine for demo)
    alert("Document encrypted & stored.\nFingerprint:\n" + d.fingerprint);

    // ✅ Visible confirmation in UI
    document.getElementById("uploadResult").textContent =
      "Fingerprint:\n" + d.fingerprint;

    // Refresh dashboard data
    loadStats();
    loadAudit();
  })
  .catch(err => {
    console.error(err);
    alert("Upload failed");
  });
}


// -------- REUSE CHECK --------
function reuseCheck() {
  fetch("/reuse_check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: reuseTextInput.value })
  })
    .then(r => r.json())
    .then(d => {
      reuseResult.textContent = JSON.stringify(d, null, 2);
      loadStats();
      loadAudit();
    })
    .catch(err => alert("Reuse check failed"));
}

// -------- STATS --------
function loadStats() {
  fetch("/stats")
    .then(r => r.json())
    .then(d => {
      docs.textContent = d.documents;
      access.textContent = d.accesses;
      reuse.textContent = d.reuse_events;
      logs.textContent = d.audit_logs;
    });
}

// -------- AUDIT --------
function loadAudit() {
  auditTable.innerHTML = "";
  fetch("/audit")
    .then(r => r.json())
    .then(data => {
      data.forEach(l => {
        auditTable.innerHTML += `
          <tr>
            <td>${l.action}</td>
            <td>${l.document}</td>
            <td>${l.verified ? "✔" : "❌"}</td>
          </tr>`;
      });
    });
}

// -------- INIT --------
loadStats();
loadAudit();
