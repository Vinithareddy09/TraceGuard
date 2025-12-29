// -----------------------------
// GLOBAL STATE
// -----------------------------
let currentUser = null;

// -----------------------------
// AUTH
// -----------------------------
async function login() {
  const email = loginEmail.value;
  const password = loginPassword.value;

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (data.status === "login_success") {
    currentUser = data.user;
    currentUserEl.textContent = currentUser;

    loginScreen.style.display = "none";
    dashboardScreen.style.display = "block";

    refreshAll();
  } else {
    loginResult.textContent = data.error;
  }
}

async function register() {
  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: loginEmail.value,
      password: loginPassword.value
    })
  });

  loginResult.textContent = JSON.stringify(await res.json(), null, 2);
}

function logout() {
  location.reload();
}

// -----------------------------
// REFRESH CORE
// -----------------------------
async function refreshAll() {
  await loadStats();
  await loadDocuments();
  await loadAudit();
}

// -----------------------------
// STATS
// -----------------------------
async function loadStats() {
  const res = await fetch("/stats");
  const data = await res.json();

  docs.textContent = data.documents;
  access.textContent = data.accesses;
  reuse.textContent = data.reuse_events;
  logs.textContent = data.audit_logs;
}

// -----------------------------
// DOCUMENT LIST
// -----------------------------
async function loadDocuments() {
  const res = await fetch("/documents");
  const data = await res.json();

  docTable.innerHTML = ""; // 🔥 CRITICAL

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

// -----------------------------
// UPLOAD
// -----------------------------
async function upload() {
  const res = await fetch("/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name.value,
      text: text.value,
      user: currentUser
    })
  });

  const data = await res.json();
  uploadResult.textContent =
    `Encrypted & stored successfully\nFingerprint:\n${data.fingerprint}`;

  name.value = "";
  text.value = "";

  refreshAll();
}

// -----------------------------
// ACCESS
// -----------------------------
async function recordAccess() {
  const res = await fetch("/access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: accessName.value,
      user: currentUser
    })
  });

  accessResult.textContent = JSON.stringify(await res.json(), null, 2);
  accessName.value = "";

  refreshAll();
}

// -----------------------------
// REUSE
// -----------------------------
async function reuse() {
  const res = await fetch("/reuse_check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: reuseText.value,
      user: currentUser
    })
  });

  const data = await res.json();

  if (data.matches.length === 0) {
    reuseResult.textContent = "No semantic reuse detected.";
  } else {
    reuseResult.textContent = JSON.stringify(data.matches, null, 2);
  }

  refreshAll();
}

// -----------------------------
// AUDIT
// -----------------------------
async function loadAudit() {
  const res = await fetch("/audit");
  const data = await res.json();

  auditTable.innerHTML = ""; // 🔥 CRITICAL

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
