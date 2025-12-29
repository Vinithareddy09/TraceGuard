// -------- ELEMENT REFERENCES --------
const nameInput = document.getElementById("name");
const textInput = document.getElementById("text");
const reuseTextInput = document.getElementById("reuseText");

const uploadResult = document.getElementById("uploadResult");
const reuseResult = document.getElementById("reuseResult");

const docs = document.getElementById("docs");
const access = document.getElementById("access");
const reuseMetric = document.getElementById("reuse");
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
    uploadResult.textContent =
      "Document encrypted and stored.\n\nFingerprint:\n" + d.fingerprint;

    loadStats();
    loadAudit();
  })
  .catch(err => {
    console.error(err);
    alert("Upload failed");
  });
}

// -------- REUSE CHECK (FIXED) --------
function reuse() {
  fetch("/reuse_check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: reuseTextInput.value
    })
  })
  .then(r => r.json())
  .then(d => {
    reuseResult.textContent = JSON.stringify(d, null, 2);
    loadStats();
    loadAudit();
  })
  .catch(err => {
    console.error(err);
    alert("Reuse check failed");
  });
}

// -------- STATS --------
function loadStats() {
  fetch("/stats")
    .then(r => r.json())
    .then(d => {
      docs.textContent = d.documents;
      access.textContent = d.accesses;
      reuseMetric.textContent = d.reuse_events;
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
          </tr>
        `;
      });
    });
}

// -------- INIT --------
loadStats();
loadAudit();
