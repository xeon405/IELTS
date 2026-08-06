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
const email = `dbg4_${stamp}@example.com`;
const reg = await http("POST", "/auth/register", { full_name: "Dashboard Debug4", email, password: "DebugPass123" });
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
  const section = grid.parentElement;
  const btn = grid.querySelector('button');
  const cs = getComputedStyle(grid);
  const out = [];
  const walk = (el, depth) => {
    if (!el || depth > 5) return;
    const cs2 = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    out.push({ tag: el.tagName, depth, cls: (el.className || '').toString().slice(0, 55), w: Math.round(b.width), scrollW: el.scrollWidth, minW: cs2.minWidth, maxW: cs2.maxWidth, overflow: cs2.overflowX, whiteSpace: cs2.whiteSpace });
    for (const c of el.children) walk(c, depth + 1);
  };
  walk(btn, 0);
  return JSON.stringify({
    gridMinWidth: cs.minWidth,
    gridOverflow: cs.overflowX,
    sectionOverflow: getComputedStyle(section).overflowX,
    sectionTrack: getComputedStyle(section).gridTemplateColumns,
    btnMinWidth: getComputedStyle(btn).minWidth,
    tree: out,
  });
})()`);
console.log(detail);
process.exit(0);