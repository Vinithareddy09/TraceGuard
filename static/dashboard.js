// ---------- ELEMENTS ----------
const nameInput = document.getElementById("name");
const textInput = document.getElementById("text");
const reuseInput = document.getElementById("reuseText");
const reuseResult = document.getElementById("reuseResult");

const docsEl = document.getElementById("docs");
const accessEl = document.getElementById("access");
const reuseEl = document.getElementById("reuseCount");
const logsEl = document.getElementById("logs");
const auditTable = document.getElementById("auditTable");

// ---------- UPLOAD ----------
async function upload() {
  if (!nameInput.value || !textInput.value) {
    alert("Please enter document name and content");
    return;
  }

  const res = await fetch("/upload", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      name: nameInput.value,
      text: textInput.value
    })
  });

  const d = await res.json();
  alert("Document secured.\nFingerprint:\n" + d.fingerprint);
  loadStats();
  loadAudit();
}

// ---------- REUSE CHECK ----------
async function checkReuse() {
  if (!reuseInput.value) {
    alert("Paste text to analyze");
    return;
  }

  const res = await fetch("/reuse_check", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ text: reuseInput.value })
  });

  const d = await res.json();
  reuseResult.textContent =
    d.reused_in.length === 0
      ? "No semantic reuse detected."
      : "Reuse detected in:\n- " + d.reused_in.join("\n- ");

  loadStats();
}

// ---------- DASHBOARD STATS ----------
async function loadStats() {
  const res = await fetch("/stats");
  const d = await res.json();

  docsEl.textContent = d.documents;
  accessEl.textContent = d.access_events;
  reuseEl.textContent = d.reuse_events;
  logsEl.textContent = d.audit_logs;
}

// ---------- AUDIT LOG ----------
async function loadAudit() {
  auditTable.innerHTML = "";

  const res = await fetch("/audit");
  const data = await res.json();

  data.forEach(l => {
    auditTable.innerHTML += `
      <tr>
        <td>${l.action}</td>
        <td>${l.document}</td>
        <td>${l.verified ? "✔" : "❌"}</td>
      </tr>`;
  });
}

window.onload = () => {
  loadStats();
  loadAudit();
};
