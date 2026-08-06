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
const email = `dbg_${stamp}@example.com`;
const reg = await http("POST", "/auth/register", { full_name: "Dashboard Debug", email, password: "DebugPass123" });
const verify = await http("POST", "/auth/verify", { email, code: reg.data.dev_code });
const token = verify.data.access_token;
const start = await http("GET", "/diagnostic/start", null, token);
const items = start.data.questions?.items ?? start.data.questions;
const answers = {};
for (const it of items) if (it.id) answers[it.id] = "My focused answer for this diagnostic question.";
await http("POST", "/diagnostic/submit", { answers }, token);

const fs = await import("fs");
const errors = [];
const report = {};

for (const vp of [
  { name: "desktop1440", width: 1440, height: 900 },
  { name: "laptop1024", width: 1024, height: 768 },
  { name: "tablet768", width: 768, height: 1024 },
  { name: "mobile390", width: 390, height: 844 },
]) {
  await send("Emulation.setDeviceMetricsOverride", { width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: vp.name === "mobile390" });
  await send("Page.navigate", { url: `${BASE}/app` });
  await poll(() => ev(`document.body.textContent.includes('Train weakest skill')`));
  await sleep(1800);
  const m = await ev(`(() => {
    const bad = [];
    for (const el of document.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > innerWidth + 1 || r.left < -1)) {
        bad.push(el.tagName + '.' + (el.className && typeof el.className === 'string' ? el.className.split(' ').slice(0,3).join('.') : '') + ' right=' + Math.round(r.right) + ' left=' + Math.round(r.left));
      }
    }
    return JSON.stringify({
      innerW: innerWidth, docW: document.documentElement.scrollWidth,
      hOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      bodyOverflow: document.body.scrollWidth > innerWidth + 1,
      overflowEls: bad.slice(0, 8),
      cards: [...document.querySelectorAll('main, section, div')].filter(e => getComputedStyle(e).display === 'grid' && e.children.length > 1 && e.children.length < 8).length,
      fixedEls: [...document.querySelectorAll('*')].filter(e => getComputedStyle(e).position === 'fixed').map(e => e.className && typeof e.className === 'string' ? e.className.split(' ').slice(0,3).join('.') : e.tagName),
    });
  })()`);
  report[vp.name] = JSON.parse(m);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(`C:/Users/rahee/AppData/Local/Temp/opencode/dbg_${vp.name}.png`, Buffer.from(shot.data, "base64"));
}

console.log(JSON.stringify(report, null, 1));
console.log("SHOTS DONE");
process.exit(0);
