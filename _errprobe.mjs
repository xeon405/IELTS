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
const errors = [];
ws.addEventListener("message", (event) => {
  const m = JSON.parse(event.data);
  if (m.id && pending.has(m.id)) { const { resolve, reject } = pending.get(m.id); pending.delete(m.id); m.error ? reject(new Error(m.error.message)) : resolve(m.result); return; }
  if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.text + " | " + (m.params.exceptionDetails.exception?.description || "").split("\n")[0]);
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push("console.error: " + (m.params.args || []).map(a => a.value || a.description).join(" ").slice(0, 300));
});
async function ev(expression) { const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error("eval failed: " + (r.exceptionDetails.exception?.description ?? "")); return r.result?.value; }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await send("Runtime.enable");
const stamp = Date.now();
const email = `errprobe_${stamp}@example.com`;
const reg = await http("POST", "/auth/register", { full_name: "Err Probe", email, password: "ErrP12345" });
const verify = await http("POST", "/auth/verify", { email, code: reg.data.dev_code });
const token = verify.data.access_token;

await send("Page.navigate", { url: `${BASE}/app` });
await sleep(6000);
let body = await ev(`document.body ? document.body.innerText.slice(0, 300) : '(no body)'`);
let url = await ev(`location.href`);
console.log("STEP1 url:", url);
console.log("STEP1 body:", JSON.stringify(body));
console.log("STEP1 errors:", JSON.stringify(errors));

await ev(`localStorage.setItem('ielts_access_token', ${JSON.stringify(token)}); true`);
await send("Page.navigate", { url: `${BASE}/app` });
await sleep(7000);
url = await ev(`location.href`);
body = await ev(`document.body ? document.body.innerText.slice(0, 400) : '(no body)'`);
console.log("STEP2 url:", url);
console.log("STEP2 body:", JSON.stringify(body));
console.log("STEP2 errors:", JSON.stringify(errors));
process.exit(0);