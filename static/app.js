function upload(){
  fetch("/upload", {
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      name:document.getElementById("name").value,
      text:document.getElementById("text").value
    })
  }).then(r=>r.json()).then(alert);
}

function accessDoc(){
  fetch("/access",{
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name:document.getElementById("doc").value})
  }).then(r=>r.json()).then(alert);
}

function reuse(){
  fetch("/reuse_check",{
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({text:document.getElementById("reuseText").value})
  }).then(r=>r.json()).then(alert);
}

fetch("/audit").then(r=>r.json()).then(data=>{
  const t=document.getElementById("logs");
  if(!t) return;
  data.forEach(l=>{
    t.innerHTML+=`<tr>
      <td>${l.action}</td>
      <td>${l.document}</td>
      <td>${l.verified ? "✔" : "❌"}</td>
    </tr>`;
  });
});
