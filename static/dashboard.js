const nameInput = document.getElementById("name");
const textInput = document.getElementById("text");
const reuseTextInput = document.getElementById("reuseText");

const userIdInput = document.getElementById("userId");
const accessNameInput = document.getElementById("accessName");

const uploadResult = document.getElementById("uploadResult");
const reuseResult = document.getElementById("reuseResult");
const accessResult = document.getElementById("accessResult");

const docs = document.getElementById("docs");
const access = document.getElementById("access");
const reuseMetric = document.getElementById("reuse");
const logs = document.getElementById("logs");

const auditTable = document.getElementById("auditTable");
const docTable = document.getElementById("docTable");

// UPLOAD
function upload() {
  fetch("/upload", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      name: nameInput.value,
      text: textInput.value
    })
  })
  .then(r => r.json())
  .then(d => {
    uploadResult.textContent =
      "Encrypted & stored\nFingerprint:\n" + d.fingerprint;
    loadAll();
  });
}

// ACCESS
function recordAccess() {
  fetch("/access", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      name: accessNameInput.value,
      user: userIdInput.value
    })
  })
  .then(() => {
    accessResult.textContent = "Access recorded for user.";
    loadAll();
  });
}

// REUSE
function reuse() {
  fetch("/reuse_check", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ text: reuseTextInput.value })
  })
  .then(r=>r.json())
  .then(d=>{
    reuseResult.textContent = "";
    if(d.matches.length === 0){
      reuseResult.textContent = "No semantic reuse detected.";
    } else {
      d.matches.forEach(m=>{
        reuseResult.textContent +=
          `⚠ ${m.document} — Similarity: ${m.similarity}%\n`;
      });
    }
    loadAll();
  });
}

// LOAD DOCUMENTS
function loadDocuments(){
  docTable.innerHTML="";
  fetch("/documents")
    .then(r=>r.json())
    .then(data=>{
      data.forEach(d=>{
        docTable.innerHTML += `
          <tr>
            <td>${d.name}</td>
            <td>${d.fingerprint}</td>
            <td>🔒 Encrypted</td>
          </tr>`;
      });
    });
}

// STATS
function loadStats(){
  fetch("/stats")
    .then(r=>r.json())
    .then(d=>{
      docs.textContent=d.documents;
      access.textContent=d.accesses;
      reuseMetric.textContent=d.reuse_events;
      logs.textContent=d.audit_logs;
    });
}

// AUDIT
function loadAudit(){
  auditTable.innerHTML="";
  fetch("/audit")
    .then(r=>r.json())
    .then(data=>{
      data.forEach(l=>{
        auditTable.innerHTML += `
          <tr>
            <td>${l.action}</td>
            <td>${l.document}</td>
            <td>${l.user || "-"}</td>
            <td>${l.verified?"✔":"❌"}</td>
          </tr>`;
      });
    });
}

function loadAll(){
  loadStats();
  loadAudit();
  loadDocuments();
}

loadAll();
