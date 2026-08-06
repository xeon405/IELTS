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
const email = `dbg3_${stamp}@example.com`;
const reg = await http("POST", "/auth/register", { full_name: "Dashboard Debug3", email, password: "DebugPass123" });
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
await sleep(1500);

const detail = await ev(`(() => {
  const grid = document.querySelector('.grid.min-w-0');
  const btns = [...(grid ? grid.querySelectorAll('button') : [])];
  const section = grid ? grid.parentElement : null;
  const grand = section ? section.parentElement : null;
  const r = (el) => { const b = el.getBoundingClientRect(); return { left: Math.round(b.left), right: Math.round(b.right), w: Math.round(b.width) }; };
  return JSON.stringify({
    grid: r(grid),
    gridClass: grid ? grid.className : null,
    gridTemplateColumns: grid ? getComputedStyle(grid).gridTemplateColumns : null,
    section: section ? { cls: section.className, ...r(section) } : null,
    grand: grand ? { cls: grand.className, ...r(grand) } : null,
    main: (() => { const m = document.querySelector('main'); return m ? { cls: m.className.slice(0,80), ...r(m) } : null; })(),
    btns: btns.slice(0, 4).map((b) => ({ cls: b.className.slice(0, 60), ...r(b), inner: b.querySelector('div') ? r(b.querySelector('div')) : null })),
    html: { scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth },
  });
})()`);
console.log(detail);
process.exit(0);