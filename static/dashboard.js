// =============================
// DOM REFERENCES
// =============================
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginResult = document.getElementById("loginResult");

const loginScreen = document.getElementById("loginScreen");
const dashboardScreen = document.getElementById("dashboardScreen");
const currentUserEl = document.getElementById("currentUser");

const docs = document.getElementById("docs");
const access = document.getElementById("access");
const reuse = document.getElementById("reuse");
const logs = document.getElementById("logs");

const docTable = document.getElementById("docTable");
const auditTable = document.getElementById("auditTable");

const uploadResult = document.getElementById("uploadResult");
const accessResult = document.getElementById("accessResult");
const reuseResult = document.getElementById("reuseResult");

let currentUser = null;
let busy = false;

// =============================
// AUTH
// =============================
async function login() {
  if (busy) return;
  busy = true;
  loginResult.textContent = "Logging in...";

  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  busy = false;

  if (!res.ok) {
    loginResult.textContent = data.error;
    return;
  }

  currentUser = data.user;
  currentUserEl.textContent = currentUser;

  loginScreen.style.display = "none";
  dashboardScreen.style.display = "block";

  refreshAll();
}

async function register() {
  if (busy) return;
  busy = true;
  loginResult.textContent = "Registering...";

  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: loginEmail.value,
      password: loginPassword.value
    })
  });

  const data = await res.json();
  busy = false;

  if (!res.ok) {
    loginResult.textContent = data.error;
  } else {
    loginResult.textContent = "Registered successfully. Now click LOGIN.";
  }
}

function logout() {
  location.reload();
}

// =============================
// REFRESH
// =============================
async function refreshAll() {
  await loadStats();
  await loadDocuments();
  await loadAudit();
}

// =============================
// STATS
// =============================
async function loadStats() {
  const res = await fetch("/stats");
  const data = await res.json();

  docs.textContent = data.documents;
  access.textContent = data.accesses;
  reuse.textContent = data.reuse_events;
  logs.textContent = data.audit_logs;
}

// =============================
// DOCUMENTS
// =============================
async function loadDocuments() {
  const res = await fetch("/documents");
  const data = await res.json();

  docTable.innerHTML = "";
  data.forEach(d => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${d.name}</td>
      <td>${d.fingerprint}</td>
      <td>🔒 Encrypted</td>
    `;
    docTable.appendChild(row);
  });
}

// =============================
// UPLOAD
// =============================
async function upload() {
  const res = await fetch("/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("name").value,
      text: document.getElementById("text").value,
      user: currentUser
    })
  });

  const data = await res.json();
  uploadResult.textContent = "Stored successfully";
  refreshAll();
}

// =============================
// ACCESS
// =============================
async function recordAccess() {
  const res = await fetch("/access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("accessName").value,
      user: currentUser
    })
  });

  accessResult.textContent = JSON.stringify(await res.json(), null, 2);
  refreshAll();
}

// =============================
// REUSE
// =============================
async function reuse() {
  const res = await fetch("/reuse_check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: document.getElementById("reuseText").value,
      user: currentUser
    })
  });

  const data = await res.json();
  reuseResult.textContent =
    data.matches.length === 0
      ? "No semantic reuse detected."
      : JSON.stringify(data.matches, null, 2);

  refreshAll();
}

// =============================
// AUDIT
// =============================
async function loadAudit() {
  const res = await fetch("/audit");
  const data = await res.json();

  auditTable.innerHTML = "";
  data.forEach(t => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${t.action}</td>
      <td>${t.document}</td>
      <td>${t.user || "-"}</td>
      <td>${t.verified ? "✔" : "❌"}</td>
    `;
    auditTable.appendChild(row);
  });
}
