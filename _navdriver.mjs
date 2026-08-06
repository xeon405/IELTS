const CDP = "http://127.0.0.1:9222";
const BASE = "http://localhost:3100";

const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function check(name, pass, extra = "") {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}${extra ? "  ->  " + extra : ""}`);
}

let msgId = 0;
const pending = new Map();
let ws;

function connect(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.addEventListener("open", () => resolve(socket));
    socket.addEventListener("error", () => reject(new Error("ws error " + url)));
  });
}

async function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

ws = await connect(
  await (async () => {
    const target = await fetch(`${CDP}/json/new?${encodeURIComponent(BASE)}`, { method: "PUT" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("PUT /json/new failed"))))
      .catch(() => fetch(`${CDP}/json/new?${encodeURIComponent(BASE)}`).then((r) => r.json()));
    return target.webSocketDebuggerUrl;
  })(),
);

ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  } else if (message.method === "Runtime.exceptionThrown") {
    const detail = message.params?.exceptionDetails;
    console.log("PAGE ERROR:", detail?.exception?.description ?? detail?.text ?? "unknown");
  }
});

async function ev(expression) {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error("eval failed: " + (result.exceptionDetails.exception?.description ?? result.exceptionDetails.text));
  return result.result?.value;
}

async function poll(fn, timeout = 40000) {
  const start = Date.now();
  let lastError = "";
  while (Date.now() - start < timeout) {
    try {
      const value = await fn();
      if (value) return value;
    } catch (err) {
      lastError = err.message ?? String(err);
    }
    await sleep(500);
  }
  const dump = await ev(`({ url: location.href, buttons: [...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(Boolean).slice(0,60), body: document.body.textContent.slice(0,400) })`).catch(() => null);
  throw new Error("timeout waiting for condition (lastError: " + lastError + ")\nSTATE: " + JSON.stringify(dump));
}

const waitText = (text, timeout) => poll(() => ev(`document.body.textContent.includes(${JSON.stringify(text)})`), timeout);
const clickByText = (text, nth = 0) =>
  poll(() =>
    ev(`(()=>{const bs=[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()===${JSON.stringify(text)});if(!bs[${nth}])return false;bs[${nth}].click();return true;})()`),
  );
const bodyHas = (text) => ev(`document.body.textContent.includes(${JSON.stringify(text)})`);

await send("Page.navigate", { url: BASE });
await poll(() => ev(`location.href.startsWith(${JSON.stringify(BASE)})`), 30000);
await ev(`window.localStorage.removeItem('ai-ielts-examiner-settings'); window.localStorage.setItem('ai-ielts-examiner-profile', JSON.stringify({id:'nav-tester-1', name:'Nav Tester'})); true`);
await send("Page.navigate", { url: `${BASE}/app` });
await waitText("Full Mock", 30000);

const navViews = [
  { id: "dashboard", anchor: "Train weakest skill" },
  { id: "reading", anchor: "Reading practice" },
  { id: "listening", anchor: "Listening practice" },
  { id: "writing", anchor: "Writing practice" },
  { id: "speaking", anchor: "Speaking practice" },
  { id: "mock", anchor: "Full IELTS computer-delivered mock" },
  { id: "reports", anchor: "Progress over time" },
  { id: "tutor", anchor: "Ask doubts, get study tips" },
  { id: "vocabulary", anchor: "Vocabulary trainer" },
  { id: "profile", anchor: "Student learning profile" },
  { id: "settings", anchor: "Account, notifications, theme & plan" },
];

const clamp = (s) => (s ?? "").replace(/ /g, "");
const skillColors = { reading: "rgb(47,93,140)", listening: "rgb(42,125,92)", writing: "rgb(194,105,42)", speaking: "rgb(107,74,147)" };
const navLabel = (id) => (id === "tutor" ? "AI Tutor" : id === "mock" ? "Full Mock" : id.charAt(0).toUpperCase() + id.slice(1));

const activeBg = await ev(`(()=>{const btn=[...document.querySelectorAll('nav button')].find(b=>b.textContent.trim()==='Dashboard');return btn?getComputedStyle(btn).backgroundColor:'none'})()`);
check("Nav: dashboard default active dark", clamp(activeBg) === "rgb(23,52,47)", activeBg);

for (const view of navViews) {
  if (view.id !== "dashboard") {
    await clickByText(navLabel(view.id));
  }
  await waitText(view.anchor, 30000);
  const rendered = await bodyHas(view.anchor);
  check(`View: ${view.id} renders "${view.anchor}"`, rendered);
  if (view.id === "reading" || view.id === "listening" || view.id === "writing" || view.id === "speaking") {
    const bg = await ev(`(()=>{const btn=[...document.querySelectorAll('nav button')].find(b=>b.textContent.trim()===${JSON.stringify(navLabel(view.id))});return btn?getComputedStyle(btn).backgroundColor:'none'})()`);
    check(`Identity: ${view.id} nav active color`, clamp(bg) === skillColors[view.id], bg);
  }
}

await clickByText("Dashboard");
await waitText("Train weakest skill", 30000);

await clickByText("Reading");
await waitText("Reading practice", 30000);
const readingActive = await ev(`(()=>{const btn=[...document.querySelectorAll('nav button')].find(b=>b.textContent.trim()==='Reading');return btn?getComputedStyle(btn).backgroundColor:'none'})()`);
check("Identity: Reading active = blue", clamp(readingActive) === "rgb(47,93,140)", readingActive);
const gpButtons = await ev(`[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Quick Practice').length`);
check("Reading view: no dead blueprint, Quick Practice present", gpButtons >= 1, `${gpButtons} button(s)`);
check("Reading view: blueprint guide content present", await bodyHas("The complete guide to Reading"), "");

await clickByText("Full Mock");
await waitText("Full IELTS computer-delivered mock", 30000);
await clickByText("Start mock exam");
await waitText("Recommended", 30000);
check("Mock: listening section runs", await bodyHas("Audio player above"), "");
await clickByText("Finish section");
await waitText("Passage 1 — Connected shade networks", 30000);
check("Mock: reading passage renders (no stub)", await bodyHas("Three passage workspace") === false, "real passages shown");
check("Mock: reading passage content", await bodyHas("Professor Ito"), "");
const sideDone = await ev(`(()=>{const ps=[...document.querySelectorAll('p')];const el=ps.find(p=>p.textContent.trim()==='Listening'&&p.parentElement&&p.parentElement.textContent.includes('30 min'));return el?getComputedStyle(el.parentElement).backgroundColor:'none'})()`);
check("Mock: completed listening card green identity", clamp(sideDone) === "rgb(224,240,230)", sideDone);

await clickByText("Settings");
await waitText("Account, notifications, theme & plan", 30000);
await clickByText("dark");
await sleep(600);
const themeAttr = await ev(`document.documentElement.dataset.theme`);
check("Settings: theme sets data-theme=dark", themeAttr === "dark", themeAttr);
const pageBgDark = await ev(`getComputedStyle(document.querySelector('main.exam-grid')).backgroundColor`);
check("Settings: dark theme changes page bg", clamp(pageBgDark) === "rgb(14,23,20)", pageBgDark);
await clickByText("Tutor Plus");
await sleep(500);
const hasPlanToast = await bodyHas("Plan set to Tutor Plus");
check("Settings: plan button gives feedback", hasPlanToast, "");
const persisted = await ev(`JSON.parse(window.localStorage.getItem('ai-ielts-examiner-settings')).plan`);
check("Settings: plan persisted", persisted === "Tutor Plus", persisted);

await send("Page.reload", {});
await sleep(2500);
await waitText("Train weakest skill", 40000);
const themeAfterReload = await ev(`document.documentElement.dataset.theme`);
check("Settings: dark theme restored after reload", themeAfterReload === "dark", themeAfterReload);
const planAfterReload = await ev(`JSON.parse(window.localStorage.getItem('ai-ielts-examiner-settings')).plan`);
check("Settings: plan restored after reload", planAfterReload === "Tutor Plus", planAfterReload);

const failed = results.filter((r) => !r.pass);
console.log(`\n== ${results.length - failed.length}/${results.length} checks passed ==`);
if (failed.length) {
  const dump = await ev(`({ url: location.href, buttons: [...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(Boolean).slice(0,30), body: document.body.textContent.slice(0,500) })`).catch(() => null);
  console.log("STATE:", JSON.stringify(dump, null, 2));
}
process.exit(failed.length === 0 ? 0 : 1);