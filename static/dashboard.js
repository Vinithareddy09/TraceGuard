// =============================
// DOM REFERENCES (CRITICAL)
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

// =============================
// GLOBAL STATE
// =============================
let currentUser = null;

// =============================
// AUTH
// =============================
async function login() {
  loginResult.textContent = "";

  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();

  if (!email || !password) {
    loginResult.textContent = "Email and password required";
    return;
  }

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    loginResult.textContent = data.error || "Login failed";
    return;
  }

  currentUser = data.user;
  currentUserEl.textContent = currentUser;

  loginScreen.style.display = "none";
  dashboardScreen.style.display = "block";

  refreshAll();
}

async function register() {
  loginResult.textContent = "";

  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: loginEmail.value,
      password: loginPassword.value
    })
  });

  const data = await res.json();
  loginResult.textContent = JSON.stringify(data, null, 2);
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
// DOCUMENT LIST
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
  uploadResult.textContent =
    `Encrypted & stored successfully\nFingerprint:\n${data.fingerprint}`;

  document.getElementById("name").value = "";
  document.getElementById("text").value = "";

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
  document.getElementById("accessName").value = "";

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
