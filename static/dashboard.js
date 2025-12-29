// --------------------------------------------------
// GLOBAL AUTH STATE
// --------------------------------------------------
let CURRENT_USER = null;

// --------------------------------------------------
// ELEMENT REFERENCES
// --------------------------------------------------
const loginScreen = document.getElementById("loginScreen");
const dashboardScreen = document.getElementById("dashboardScreen");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginResult = document.getElementById("loginResult");
const currentUserLabel = document.getElementById("currentUser");

const nameInput = document.getElementById("name");
const textInput = document.getElementById("text");
const reuseTextInput = document.getElementById("reuseText");
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

// --------------------------------------------------
// AUTHENTICATION
// --------------------------------------------------
function login() {
  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: loginEmail.value,
      password: loginPassword.value
    })
  })
    .then(r => r.json())
    .then(d => {
      if (d.error) {
        loginResult.textContent = d.error;
        return;
      }

      CURRENT_USER = d.user;
      currentUserLabel.textContent = CURRENT_USER;

      loginScreen.style.display = "none";
      dashboardScreen.style.display = "block";

      loadAll();
    });
}

function register() {
  fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: loginEmail.value,
      password: loginPassword.value
    })
  })
    .then(r => r.json())
    .then(d => {
      loginResult.textContent = d.error || "Registered successfully. You can login.";
    });
}

function logout() {
  CURRENT_USER = null;
  loginScreen.style.display = "block";
  dashboardScreen.style.display = "none";
}

// --------------------------------------------------
// UPLOAD DOCUMENT
// --------------------------------------------------
function upload() {
  if (!CURRENT_USER) return alert("Please login first");

  fetch("/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: nameInput.value,
      text: textInput.value,
      user: CURRENT_USER
    })
  })
    .then(r => r.json())
    .then(d => {
      uploadResult.textContent =
        "Encrypted & stored\n\nFingerprint:\n" + d.fingerprint;
      loadAll();
    });
}

// --------------------------------------------------
// ACCESS DOCUMENT
// --------------------------------------------------
function recordAccess() {
  if (!CURRENT_USER) return alert("Please login first");

  fetch("/access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: accessNameInput.value,
      user: CURRENT_USER
    })
  })
    .then(r => r.json())
    .then(() => {
      accessResult.textContent =
        "Access recorded for user: " + CURRENT_USER;
      loadAll();
    });
}

// --------------------------------------------------
// SEMANTIC REUSE CHECK
// --------------------------------------------------
function reuse() {
  if (!CURRENT_USER) return alert("Please login first");

  fetch("/reuse_check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: reuseTextInput.value,
      user: CURRENT_USER
    })
  })
    .then(r => r.json())
    .then(d => {
      reuseResult.textContent = "";

      if (d.matches.length === 0) {
        reuseResult.textContent = "No semantic reuse detected.";
      } else {
        d.matches.forEach(m => {
          reuseResult.textContent +=
            `⚠ ${m.document} — Similarity: ${m.similarity}%\n`;
        });
      }

      loadAll();
    });
}

// --------------------------------------------------
// LOAD DOCUMENT VAULT
// --------------------------------------------------
function loadDocuments() {
  docTable.innerHTML = "";

  fetch("/documents")
    .then(r => r.json())
    .then(data => {
      data.forEach(d => {
        docTable.innerHTML += `
          <tr>
            <td>${d.name}</td>
            <td>${d.fingerprint}</td>
            <td>🔒 Encrypted</td>
          </tr>
        `;
      });
    });
}

// --------------------------------------------------
// STATS
// --------------------------------------------------
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

// --------------------------------------------------
// AUDIT LOG
// --------------------------------------------------
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
            <td>${l.user || "-"}</td>
            <td>${l.verified ? "✔" : "❌"}</td>
          </tr>
        `;
      });
    });
}

// --------------------------------------------------
// LOAD EVERYTHING
// --------------------------------------------------
function loadAll() {
  loadStats();
  loadDocuments();
  loadAudit();
}
