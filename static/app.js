function showMessage(res) {
  if (res.status) {
    alert(res.status + (res.fingerprint ? "\nFingerprint: " + res.fingerprint : ""));
  } else if (res.error) {
    alert("Error: " + res.error);
  } else if (res.reused_in) {
    alert("Reused in documents:\n" + res.reused_in.join(", "));
  } else {
    alert(JSON.stringify(res, null, 2));
  }
}

function upload(){
  fetch("/upload", {
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      name:document.getElementById("name").value,
      text:document.getElementById("text").value
    })
  })
  .then(r=>r.json())
  .then(showMessage);
}

function accessDoc(){
  fetch("/access",{
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      name:document.getElementById("doc").value
    })
  })
  .then(r=>r.json())
  .then(showMessage);
}

function reuse(){
  fetch("/reuse_check",{
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      text:document.getElementById("reuseText").value
    })
  })
  .then(r=>r.json())
  .then(showMessage);
}

fetch("/audit")
  .then(r=>r.json())
  .then(data=>{
    const t=document.getElementById("logs");
    if(!t) return;
    t.innerHTML="";
    data.forEach(l=>{
      t.innerHTML+=`
        <tr>
          <td>${l.action}</td>
          <td>${l.document}</td>
          <td>${l.verified ? "✔ Verified" : "❌ Invalid"}</td>
        </tr>`;
    });
});
