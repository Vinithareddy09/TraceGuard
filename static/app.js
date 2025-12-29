function notify(msg) {
  alert(msg);
}

function upload() {
  fetch("/upload", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      name: document.getElementById("name").value,
      text: document.getElementById("text").value
    })
  })
  .then(r => r.json())
  .then(res => {
    notify(`Uploaded successfully\nFingerprint:\n${res.fingerprint}`);
  });
}

function accessDoc() {
  fetch("/access", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      name: document.getElementById("doc").value
    })
  })
  .then(r => r.json())
  .then(res => {
    notify(res.status);
  });
}

function reuse() {
  fetch("/reuse_check", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      text: document.getElementById("reuseText").value
    })
  })
  .then(r => r.json())
  .then(res => {
    if (res.reused_in.length === 0)
      notify("No reuse detected");
    else
      notify("Reused in:\n" + res.reused_in.join(", "));
  });
}

fetch("/audit")
  .then(r => r.json())
  .then(data => {
    const table = document.getElementById("logs");
    if (!table) return;

    table.innerHTML = "";
    data.forEach(l => {
      table.innerHTML += `
        <tr>
          <td>${l.action}</td>
          <td>${l.document}</td>
          <td class="${l.verified ? "badge-ok" : "badge-bad"}">
            ${l.verified ? "✔ Verified" : "❌ Invalid"}
          </td>
        </tr>`;
    });
  });
