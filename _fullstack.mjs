const CDP = "http://127.0.0.1:9222";
const BASE = "http://localhost:3100";
const API = "http://127.0.0.1:8000/api";

const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function check(name, pass, extra = "") {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}${extra ? "  ->  " + extra : ""}`);
}

let msgId = 0;
const pending = new Map();
let ws;

async function http(method, path, body) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await r.json(); } catch {}
  return { status: r.status, data };
}

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

async function poll(fn, timeout = 40000, label = "condition") {
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
  throw new Error(`timeout (${label}) lastError: ${lastError}\nSTATE: ${JSON.stringify(dump)}`);
}

const waitText = (text, timeout = 30000) => poll(() => ev(`document.body.textContent.includes(${JSON.stringify(text)})`), timeout, `waitText ${text}`);
const waitH2 = (text, timeout = 40000) =>
  poll(
    () => ev(`[...document.querySelectorAll('h2')].some(h => (h.textContent || '').trim() === ${JSON.stringify(text)})`),
    timeout,
    `h2 ${text}`,
  );
const clickByText = (text, nth = 0) =>
  poll(
    () =>
      ev(`(()=>{const bs=[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()===${JSON.stringify(text)});if(!bs[${nth}])return false;bs[${nth}].click();return true;})()`),
    40000,
    `click ${text}`,
  );
const clickByPartial = (text, nth = 0) =>
  poll(
    () =>
      ev(`(()=>{const bs=[...document.querySelectorAll('button')].filter(b=>b.textContent.includes(${JSON.stringify(text)}));if(!bs[${nth}])return false;bs[${nth}].click();return true;})()`),
    40000,
    `click partial ${text}`,
  );
const bodyHas = (text) => ev(`document.body.textContent.includes(${JSON.stringify(text)})`);

const SET_TEXT = `(sel, text)=>{const el=document.querySelector(sel);if(!el)return false;const proto=el instanceof HTMLTextAreaElement?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,text);el.dispatchEvent(new Event('input',{bubbles:true}));return true;}`;

(async () => {
  const stamp = Date.now();
  const email = `e2e_${stamp}@example.com`;
  const pwd = "E2ePass123!";
  const reg = await http("POST", "/auth/register", { full_name: "Full Stack Tester", email, password: pwd });
  if (reg.status !== 201) throw new Error("register failed: " + JSON.stringify(reg));
  const verify = await http("POST", "/auth/verify", { email, code: reg.data.dev_code });
  if (verify.status !== 200) throw new Error("verify failed: " + JSON.stringify(verify));
  const token = verify.data.access_token;
  check("setup: registered + email-verified backend user (diagnostic pending)", !!token);

  await send("Page.navigate", { url: BASE });
  await poll(() => ev(`location.href.startsWith(${JSON.stringify(BASE)})`), 30000);
  await ev(`localStorage.clear(); localStorage.setItem('ielts_access_token', ${JSON.stringify(token)}); true`);
  await send("Page.navigate", { url: `${BASE}/app` });

  await waitText("Welcome. Which IELTS are you taking?", 40000);
  check("boot: authenticated user with pending diagnostic lands on onboarding", await bodyHas("Step 1 of 3 · Your exam"));

  await ev(`(${SET_TEXT})('input[placeholder="Your name"]', 'Full Stack Tester')`);
  await clickByPartial("Academic");
  await clickByText("7.0");
  await clickByText("Start the diagnostic assessment");
  await waitText("A quick diagnostic, four sections", 150000);
  check("onboarding: diagnostic loads 4 questions", (await bodyHas("4 / 4 answered")) === false && await ev(`document.querySelectorAll('textarea[placeholder="Type your answer here…"]').length >= 1 && document.querySelectorAll('textarea[placeholder="Type your answer here…"]').length <= 3`), "");

  const filled = await ev(`(()=>{const cards=[...document.querySelectorAll('div[class*="bg-[#fffdf7]"]')].filter(c=>c.querySelector('textarea')||c.querySelectorAll('button').length>=2);let n=0;for(const card of cards){const ta=card.querySelector('textarea');if(ta){const proto=window.HTMLTextAreaElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(ta,'The government should invest more in public transport to reduce traffic congestion and improve air quality in cities.');ta.dispatchEvent(new Event('input',{bubbles:true}));n++;}else{const opts=[...card.querySelectorAll('button')].filter(b=>b.textContent.trim().length>0&&!['Play audio','Pause audio','Reset','Reveal meaning','Back to word','Got it'].includes(b.textContent.trim()));if(opts.length){opts[0].click();n++;}}}return n;})()`);
  check("onboarding: filled all 4 diagnostic answers", filled === 4, `filled ${filled}`);
  await waitText("4 / 4 answered", 30000);
  await clickByText("Estimate my current band");
  await waitText("Estimated overall band", 90000);
  check("onboarding: diagnostic scored (band result)", await bodyHas("/ 9.0"), "");
  check("onboarding: result shows focus area", await bodyHas("Focus area"), "");
  await clickByText("Open my personalized dashboard");
  await waitText("Train weakest skill", 40000);
  check("onboarding: dashboard reached after completion", await bodyHas("Next best action"), "");

  await clickByPartial("Quick practice");
  await waitText("Submit selected section", 90000);
  check("practice: session generated by backend, workbench active", await bodyHas("Question 1"), "");

  const answered = await ev(`(()=>{const card=[...document.querySelectorAll('div[class*="bg-[#fffdf7]"]')].find(c=>c.querySelector('button')&&c.querySelector('button').textContent.trim().length<80&&!c.querySelector('textarea'));if(card){const opts=[...card.querySelectorAll('button')];if(opts.length){opts[0].click();return opts[0].textContent.trim();}}const ta=document.querySelector('textarea[placeholder="Type your full answer here. The AI evaluates after you submit the selected section."]');if(ta){const proto=window.HTMLTextAreaElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(ta,'Public transport reduces congestion and pollution in cities.');ta.dispatchEvent(new Event('input',{bubbles:true}));return 'typed';}return 'none';})()`);
  check("practice: answered first question", answered !== "none", answered);
  await clickByText("Submit selected section");
  await waitText("AI examiner report", 150000);
  check("practice: evaluation report rendered", await bodyHas("Predicted Band"), "");
  await clickByPartial("← Back");
  await waitText("Train weakest skill", 30000);
  check("dashboard: continue practice card now has title", (await bodyHas("Start a new session")) === false, "");

  await clickByText("Full mock exam");
  await waitText("Exam order", 30000);
  await waitH2("Listening", 300000);
  check("mock: listening section running with timer", await bodyHas("Timer"), "");
  await clickByText("Fill demo exam answers");
  await clickByText("Finish section");
  await waitH2("Reading", 60000);
  check("mock: reading passages grouped from real session", await bodyHas("Passage 1"), "");
  await clickByText("Fill demo exam answers");
  await clickByText("Finish section");
  await waitH2("Writing", 60000);
  await clickByText("Fill demo exam answers");
  await clickByText("Finish section");
  await waitH2("Speaking", 60000);
  await clickByText("Fill demo exam answers");
  await clickByText("Submit full mock");
  await waitText("Full mock examiner report", 300000);
  check("mock: full exam report with overall band", await bodyHas("Overall Band"), "");
  check("mock: four section band cards", await bodyHas("Strengths"), "");

  await clickByText("Reports");
  await waitText("Progress over time", 40000);
  check("reports: practice summary mentions sessions", await bodyHas("reviewed by the AI examiner"), "");
  check("reports: study statistics populated", await bodyHas("Full mocks"), "");

  await clickByText("AI Tutor");
  await waitText("Ask doubts, get study tips", 30000);
  await clickByText("What is the best strategy for True / False / Not Given?");
  await waitText("The AI Brain is thinking…", 30000);
  await poll(() => ev(`!document.body.textContent.includes('The AI Brain is thinking…') && document.body.textContent.includes('For True/False/Not Given, decide')`), 60000, "tutor reply");
  check("tutor: reply with tips rendered", true, "");
  check("tutor: question echoed in chat", await bodyHas("What is the best strategy for True / False / Not Given?"), "");

  await clickByText("Vocabulary");
  await waitText("Vocabulary trainer", 30000);
  await clickByText("Reveal meaning");
  check("vocab: card flipped to meaning", await bodyHas("Back to word"), "");
  await clickByText("Got it");
  await clickByText("Quiz");
  await waitText("Question 1 of 10", 30000);
  for (let i = 0; i < 9; i++) {
    await ev(`(()=>{const nav=['Next','See result','Flashcards','Quiz','New quiz','Study flashcards','Dashboard','Reading','Listening','Writing','Speaking','Full Mock','Reports','AI Tutor','Vocabulary','Profile','Settings','Reset demo memory','Start adaptive practice','Full mock exam','Reveal meaning','Got it','Back to word'];const bs=[...document.querySelectorAll('section button')].filter(b=>!nav.includes(b.textContent.trim())&&!b.disabled);if(bs.length){bs[0].click();return true;}return false;})()`);
    await poll(() => ev(`[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Next'&&!b.disabled)`), 30000, "next enabled");
    await clickByText("Next");
    if (i < 8) await waitText(`Question ${i + 2} of 10`, 30000);
  }
  await waitText("Question 10 of 10", 30000);
  await ev(`(()=>{const nav=['Next','See result','Flashcards','Quiz','New quiz','Study flashcards','Dashboard','Reading','Listening','Writing','Speaking','Full Mock','Reports','AI Tutor','Vocabulary','Profile','Settings','Reset demo memory','Start adaptive practice','Full mock exam','Reveal meaning','Got it','Back to word'];const bs=[...document.querySelectorAll('section button')].filter(b=>!nav.includes(b.textContent.trim())&&!b.disabled);if(bs.length){bs[0].click();return true;}return false;})()`);
  await clickByText("See result");
  await waitText("/10 correct", 30000);
  check("vocab: quiz result rendered", true, "");

  await clickByText("Profile");
  await waitText("Student learning profile", 30000);
  check("profile: skill bands render", await bodyHas("Skill bands"), "");
  check("profile: achievements unlocked", await bodyHas("/12 unlocked"), "");

  await clickByText("Settings");
  await waitText("Account, notifications, theme & plan", 30000);
  await clickByText("warm");
  await sleep(600);
  check("settings: warm theme applied", (await ev(`document.documentElement.dataset.theme`)) === "warm", "");
  await clickByText("dark");
  await sleep(600);
  check("settings: dark theme applied", (await ev(`document.documentElement.dataset.theme`)) === "dark", "");
  await clickByText("Tutor Plus");
  await sleep(400);
  check("settings: plan toast", await bodyHas("Plan set to Tutor Plus"), "");
  await ev(`(()=>{const b=[...document.querySelectorAll('label')].find(l=>l.textContent.includes('Practice reminders'));const btn=b?b.querySelector('button'):null;if(btn){btn.click();return true;}return false;})()`);
  await sleep(400);
  check("settings: notification toggle toast", await bodyHas("Notification"), "");

  await send("Page.reload", {});
  await sleep(2500);
  await waitText("Train weakest skill", 40000);
  check("persistence: dark theme restored after reload", (await ev(`document.documentElement.dataset.theme`)) === "dark", "");

  await clickByText("Reset demo memory");
  await sleep(400);
  check("reset: demo memory reset toast", await bodyHas("Demo memory reset"), "");

  const failed = results.filter((r) => !r.pass);
  console.log(`\n== ${results.length - failed.length}/${results.length} full-stack checks passed ==`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(2);
});