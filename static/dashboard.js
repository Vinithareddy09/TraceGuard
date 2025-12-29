let CURRENT_USER = null;

/* ---------------- AUTH ---------------- */

async function register() {
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();

  if (!email || !password) {
    loginResult.textContent = "Email & password required";
    return;
  }

  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  loginResult.textContent = JSON.stringify(data, null, 2);
}

async function login() {
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    loginResult.textContent = data.error;
    return;
  }

  CURRENT_USER = data.user;
  currentUser.textContent = CURRENT_USER;

  loginScreen.style.display = "none";
  dashboardScreen.style.display = "block";

  loadAll();
}

function logout() {
  CURRENT_USER = null;
  location.reload();
}

/* ---------------- LOADERS ---------------- */

async function loadAll() {
  await loadStats();
  await loadDocuments();
  await loadAudit();
}

async function loadStats() {
  const r = await fetch("/stats");
  const d = await r.json();

  docs.textContent = d.documents;
  access.textContent = d.accesses;
  reuse.textContent = d.reuse_events;
  logs.textContent = d.audit_logs;
}

async function loadDocuments() {
  const r = await fetch("/documents");
  const docsList = await r.json();

  docTable.innerHTML = "";
  docsList.forEach(d => {
    docTable.innerHTML += `
      <tr>
        <td>${d.name}</td>
        <td>${d.fingerprint}</td>
        <td>🔒 Encrypted</td>
      </tr>
    `;
  });
}

async function loadAudit() {
  const r = await fetch("/audit");
  const logsList = await r.json();

  auditTable.innerHTML = "";
  logsList.forEach(l => {
    auditTable.innerHTML += `
      <tr>
        <td>${l.action}</td>
        <td>${l.document}</td>
        <td>${l.user}</td>
        <td>${l.verified ? "✔" : "❌"}</td>
      </tr>
    `;
  });
}

/* ---------------- ACTIONS ---------------- */

async function upload() {
  const name = document.getElementById("name").value.trim();
  const text = document.getElementById("text").value.trim();

  if (!name || !text) {
    uploadResult.textContent = "Name & content required";
    return;
  }

  const res = await fetch("/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      text,
      user: CURRENT_USER
    })
  });

  const data = await res.json();

  if (!res.ok) {
    uploadResult.textContent = data.error;
    return;
  }

  uploadResult.textContent =
    "Encrypted & stored successfully\nFingerprint:\n" + data.fingerprint;

  loadAll();
}

async function recordAccess() {
  const name = document.getElementById("accessName").value.trim();

  if (!name) {
    accessResult.textContent = "Document name required";
    return;
  }

  const res = await fetch("/access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      user: CURRENT_USER
    })
  });

  const data = await res.json();

  if (!res.ok) {
    accessResult.textContent = data.error;
    return;
  }

  accessResult.textContent = "Access recorded successfully";
  loadAll();
}

async function reuse() {
  const text = document.getElementById("reuseText").value.trim();

  if (!text) {
    reuseResult.textContent = "Text required";
    return;
  }

  const res = await fetch("/reuse_check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      user: CURRENT_USER
    })
  });

  const data = await res.json();

  if (!res.ok) {
    reuseResult.textContent = data.error;
    return;
  }

  if (data.matches.length === 0) {
    reuseResult.textContent = "No semantic reuse detected.";
  } else {
    reuseResult.textContent =
      "Reuse detected:\n" + JSON.stringify(data.matches, null, 2);
  }

  loadAll();
}
