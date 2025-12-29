<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TraceGuard | Secure Document Intelligence</title>
  <link rel="stylesheet" href="/static/dashboard.css">
</head>
<body>

<div class="sidebar">
  <h2>TraceGuard</h2>
  <p class="tagline">Verifiable Semantic Intelligence</p>
</div>

<div class="main">

  <h1>Secure Document Intelligence Dashboard</h1>

  <!-- STATS -->
  <div class="cards">
    <div class="card">
      <h3 id="docs">0</h3>
      <span>Documents</span>
    </div>
    <div class="card">
      <h3 id="access">0</h3>
      <span>Access Events</span>
    </div>
    <div class="card">
      <h3 id="reuseCount">0</h3>
      <span>Reuse Alerts</span>
    </div>
    <div class="card">
      <h3 id="logs">0</h3>
      <span>Audit Logs</span>
    </div>
  </div>

  <!-- UPLOAD -->
  <section>
    <h2>Upload Protected Document</h2>
    <input id="name" placeholder="Document name (e.g. Exam_Policy_2025)">
    <textarea id="text" placeholder="Document content"></textarea>
    <button onclick="upload()">Encrypt & Store</button>
  </section>

  <!-- REUSE -->
  <section>
    <h2>Semantic Reuse Detection</h2>
    <textarea id="reuseText" placeholder="Paste text to analyze"></textarea>
    <button onclick="checkReuse()">Analyze Similarity</button>
    <pre id="reuseResult"></pre>
  </section>

  <!-- AUDIT -->
  <section>
    <h2>Audit Trail</h2>
    <table>
      <thead>
        <tr>
          <th>Action</th>
          <th>Document</th>
          <th>Verified</th>
        </tr>
      </thead>
      <tbody id="auditTable"></tbody>
    </table>
  </section>

</div>

<script src="/static/dashboard.js"></script>
</body>
</html>
