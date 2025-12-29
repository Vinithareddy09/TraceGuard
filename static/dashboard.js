// --------------------------------------------------
// GLOBAL STATE
// --------------------------------------------------
let currentUser = null;

// --------------------------------------------------
// ELEMENT REFERENCES
// --------------------------------------------------
const loginScreen = document.getElementById("loginScreen");
const dashboardScreen = document.getElementById("dashboardScreen");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginResult = document.getElementById("loginResult");
const currentUserSpan = document.getElementById("currentUser");

const nameInput = document.getElementById("name");
const textInput = document.getElementById("text");
const reuseTextInput = document.getElementById("reuseText");
const accessNameInput = document.getElementById("accessName");

const uploadResult = document.getElementById("uploadResult");
const reuseResult = document.getElementById("reuseResult");
const accessResult = document.getElementById("accessResult");

const docs = document.getElementById("docs");
const accessMetric = document.getElementById("access");
const reuseMetric = document.getElementById("reuse");
const logs = document.getElementById("logs");

const auditTable = document.getElementById("auditTable");
const docTable = document.getElementById("docTable");

// --------------------------------------------------
// AUTH
// --------------------------------------------------
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
      if (d.error) {
        loginResult.textContent = d.error;
      } else {
        loginResult.textContent = "Registered successfully. Please login.";
      }
    });
}

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

      currentUser = d.user;
      currentUserSpan.textContent = currentUser;

      loginScreen.style.display = "none";
      dashboardScreen.style.display = "block";

      loadAll();
    });
}

function logout() {
  fetch("/logout", { method: "POST" })
    .then(() => location.reload());
}

// --------------------------------------------------
// UPLOAD
// --------------------------------------------------
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
      if (d.error) {
        uploadResult.textContent = d.error;
        return;
      }

      uploadResult.textContent =
        "Encrypted & stored successfully\nFingerprint:\n" + d.fingerprint;

      loadAll();
    });
}

// --------------------------------------------------
// ACCESS
// --------------------------------------------------
function recordAccess() {
  fetch("/access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: accessNameInput.value
    })
  })
    .then(r => r.json())
    .then(d => {
      if (d.error) {
        accessResult.textContent = d.error;
        return;
      }

      accessResult.textContent = "Access recorded successfully.";
      loadAll();
    });
}

// --------------------------------------------------
// REUSE DETECTION
// --------------------------------------------------
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
// DATA LOADERS
// --------------------------------------------------
function loadStats() {
  fetch("/stats")
    .then(r => r.json())
    .then(d => {
      docs.textContent = d.documents;
      accessMetric.textContent = d.accesses;
      reuseMetric.textContent = d.reuse_events;
      logs.textContent = d.audit_logs;
    });
}

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
          </tr>`;
      });
    });
}

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
            <td>${l.user}</td>
            <td>${l.verified ? "✔" : "❌"}</td>
          </tr>`;
      });
    });
}

function loadAll() {
  loadStats();
  loadDocuments();
  loadAudit();
}
