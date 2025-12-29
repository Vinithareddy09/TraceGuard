function upload() {
  fetch("/upload", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      name: name.value,
      text: text.value
    })
  })
  .then(r => r.json())
  .then(d => alert("Fingerprint generated:\n" + d.fingerprint));
}

function reuse() {
  fetch("/reuse_check", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ text: reuseText.value })
  })
  .then(r => r.json())
  .then(d => {
    reuseResult.textContent = JSON.stringify(d, null, 2);
  });
}

fetch("/stats")
  .then(r => r.json())
  .then(d => {
    docs.textContent = d.documents;
    access.textContent = d.accesses;
    reuse.textContent = d.reuse_events;
    logs.textContent = d.audit_logs;
  });

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
