const CDP = "http://127.0.0.1:9222";
const BASE = "http://localhost:3100";
const API = "http://127.0.0.1:8000/api";
let msgId = 0;
const pending = new Map();
let ws;
async function http(method, path, body, t = "") {
  const headers = { "Content-Type": "application/json" };
  if (t) headers.Authorization = `Bearer ${t}`;
  const r = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null; try { data = await r.json(); } catch {}
  return { status: r.status, data };
}
function connect(url) { return new Promise((resolve, reject) => { const s = new WebSocket(url); s.addEventListener("open", () => resolve(s)); s.addEventListener("error", () => reject(new Error("ws error"))); }); }
async function send(method, params = {}) { return new Promise((resolve, reject) => { const id = ++msgId; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); }); }
ws = await connect((await fetch(`${CDP}/json/new?${encodeURIComponent(BASE)}`, { method: "PUT" }).catch(() => fetch(`${CDP}/json/new?${encodeURIComponent(BASE)}`)).then((r) => r.json())).webSocketDebuggerUrl);
ws.addEventListener("message", (event) => { const m = JSON.parse(event.data); if (m.id && pending.has(m.id)) { const { resolve, reject } = pending.get(m.id); pending.delete(m.id); m.error ? reject(new Error(m.error.message)) : resolve(m.result); } });
async function ev(expression) { const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error("eval failed: " + (r.exceptionDetails.exception?.description ?? "")); return r.result?.value; }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function poll(fn, timeout = 40000) { const start = Date.now(); while (Date.now() - start < timeout) { try { const v = await fn(); if (v) return v; } catch {} await sleep(500); } throw new Error("timeout"); }

const stamp = Date.now();
const email = `dbg2_${stamp}@example.com`;
const reg = await http("POST", "/auth/register", { full_name: "Dashboard Debug2", email, password: "DebugPass123" });
const verify = await http("POST", "/auth/verify", { email, code: reg.data.dev_code });
const token = verify.data.access_token;
const start = await http("GET", "/diagnostic/start", null, token);
const items = start.data.questions?.items ?? start.data.questions;
const answers = {};
for (const it of items) if (it.id) answers[it.id] = "My focused answer for this diagnostic question.";
await http("POST", "/diagnostic/submit", { answers }, token);

await send("Emulation.setDeviceMetricsOverride", { width: 1024, height: 768, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: `${BASE}/app` });
await poll(() => ev(`document.body.textContent.includes('Train weakest skill')`));
await sleep(1800);

const detail = await ev(`(() => {
  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > innerWidth + 1) {
      const chain = [];
      let n = el;
      for (let i = 0; i < 5 && n; i++) { chain.push(n.tagName + '.' + (typeof n.className === 'string' ? n.className.split(' ').slice(0,4).join('.') : '')); n = n.parentElement; }
      const text = (el.childElementCount === 0 ? (el.textContent || '').trim().slice(0, 40) : '');
      const key = text || chain[0];
      if (seen.has(key)) continue; seen.add(key);
      out.push({ right: Math.round(r.right), left: Math.round(r.left), w: Math.round(r.width), tag: el.tagName, cls: el.className, text, chain });
    }
  }
  return JSON.stringify(out);
})()`);
console.log("=== 1024 OVERFLOW DETAIL ===");
console.log(detail);

await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await send("Page.navigate", { url: `${BASE}/app` });
await poll(() => ev(`document.body.textContent.includes('Train weakest skill')`));
await sleep(1800);
const detail2 = await ev(`(() => {
  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > innerWidth + 1) {
      const chain = [];
      let n = el;
      for (let i = 0; i < 6 && n; i++) { chain.push(n.tagName + '.' + (typeof n.className === 'string' ? n.className.split(' ').slice(0,4).join('.') : '')); n = n.parentElement; }
      const text = (el.childElementCount === 0 ? (el.textContent || '').trim().slice(0, 40) : '');
      const key = text || chain[0];
      if (seen.has(key)) continue; seen.add(key);
      out.push({ key, right: Math.round(el.right), left: Math.round(el.left), w: Math.round(el.width), tag: el.tagName, cls: el.className, text, chain });
    }
  }
  return JSON.stringify(out);
})()`);
console.log("=== 390 OVERFLOW DETAIL ===");
console.log(detail2);
process.exit(0);