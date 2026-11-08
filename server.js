// Сервер для "Склад картриджей". Запуск: node server.js
// Кладите рядом с index.html. Данные хранятся в data.json.
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || 8080;
const DIR = __dirname;
const DATA_FILE = path.join(DIR, 'data.json');
const INDEX = path.join(DIR, 'index.html');
// Необязательный пароль: PASSWORD=секрет node server.js
const PASSWORD = process.env.PASSWORD || '';

const blank = () => ({ nextId: 1, items: [], log: [] });
const valid = d => d && Array.isArray(d.items) && Array.isArray(d.log);

let db = { rev: 1, state: blank() };
try {
  const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  if (typeof d.rev === 'number' && valid(d.state)) db = d;
} catch (e) {}

function persist() {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DATA_FILE);
}

function addresses() {
  try {
    const out = [];
    const ifs = os.networkInterfaces();
    Object.keys(ifs).forEach(n => ifs[n].forEach(a => { if (a.family === 'IPv4' && !a.internal) out.push(a.address); }));
    return out;
  } catch (e) { return []; }
}

function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function authorized(req) {
  if (!PASSWORD) return true;
  const h = req.headers.authorization || '';
  if (!h.startsWith('Basic ')) return false;
  const pass = Buffer.from(h.slice(6), 'base64').toString().split(':').slice(1).join(':');
  return pass === PASSWORD;
}

const server = http.createServer((req, res) => {
  if (!authorized(req)) {
    res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Sklad"' });
    return res.end('Требуется пароль');
  }
  const url = req.url.split('?')[0];

  if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
    return fs.readFile(INDEX, (err, buf) => {
      if (err) { res.writeHead(500); return res.end('index.html не найден рядом с server.js'); }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(buf);
    });
  }
  if (req.method === 'GET' && url === '/api/state') return send(res, 200, db);
  if (req.method === 'GET' && url === '/api/rev') return send(res, 200, { rev: db.rev });
  if (req.method === 'GET' && url === '/api/info') return send(res, 200, { addresses: addresses(), port: PORT, dataFile: DATA_FILE });

  if (req.method === 'PUT' && url === '/api/state') {
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > 20e6) req.destroy(); });
    req.on('end', () => {
      let p;
      try { p = JSON.parse(raw); } catch (e) { return send(res, 400, { error: 'bad json' }); }
      if (!p || !valid(p.state)) return send(res, 400, { error: 'bad state' });
      if (p.baseRev !== db.rev) return send(res, 409, db);
      db = { rev: db.rev + 1, state: p.state };
      try { persist(); } catch (e) { return send(res, 500, { error: 'write failed' }); }
      send(res, 200, { rev: db.rev });
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Сервер запущен: http://localhost:' + PORT);
  addresses().forEach(a => console.log('Из локальной сети:  http://' + a + ':' + PORT));
  console.log('Данные: ' + DATA_FILE + (PASSWORD ? ' (пароль включён)' : ' (без пароля)'));
});
