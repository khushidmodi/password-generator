const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const DIR = __dirname;

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
};

const server = http.createServer((req, res) => {
  // Handle vault file saves
  if (req.method === "POST" && req.url === "/save-vault") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { encrypted, decrypted } = JSON.parse(body);
        fs.writeFileSync(path.join(DIR, "vault_encrypted.json"), JSON.stringify(encrypted, null, 2));
        fs.writeFileSync(path.join(DIR, "vault_decrypted.json"), JSON.stringify(decrypted, null, 2));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Handle password record file saves
  if (req.method === "POST" && req.url === "/save-password-records") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { encrypted, decrypted } = JSON.parse(body);
        fs.writeFileSync(path.join(DIR, "password-records-encrypted.json"), JSON.stringify(encrypted, null, 2));
        fs.writeFileSync(path.join(DIR, "password-records-plaintext.json"), JSON.stringify(decrypted, null, 2));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = path.join(DIR, req.url === "/" ? "index.html" : req.url);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
