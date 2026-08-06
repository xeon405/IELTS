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
  const dump = await ev(`({ url: location.href, qpCount: [...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Quick Practice').length, buttons: [...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(Boolean).slice(0,80), body: document.body.textContent.slice(0,500) })`).catch(() => null);
  throw new Error("timeout waiting for condition (lastError: " + lastError + ")\nSTATE: " + JSON.stringify(dump));
}

const waitText = (text, timeout) => poll(() => ev(`document.body.textContent.includes(${JSON.stringify(text)})`), timeout);
const clickByText = (text, nth = 0) =>
  poll(() =>
    ev(`(()=>{const bs=[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()===${JSON.stringify(text)});if(!bs[${nth}])return false;bs[${nth}].click();return true;})()`),
  );
const stat = (label) =>
  ev(`(()=>{const p=[...document.querySelectorAll('p')].find(x=>x.textContent.trim()===${JSON.stringify(label)});if(!p)return null;return (p.parentElement?p.parentElement.textContent:p.textContent).replace(/\\s+/g,' ').trim();})()`);

await send("Page.navigate", { url: BASE });
await poll(() => ev(`location.href.startsWith(${JSON.stringify(BASE)})`), 30000);
await ev(`window.localStorage.setItem('ai-ielts-examiner-profile', JSON.stringify({id:'ui-tester-1', name:'UI Tester'})); true`);
await send("Page.navigate", { url: `${BASE}/app` });
await waitText("Full Mock", 30000);
check("App loads to dashboard", await ev(`[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Reading')`));

await clickByText("Reading");
await poll(async () => {
  const value = await ev(`[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Quick Practice').length>0`);
  console.log("poll qp:", value, "| has Reading practice:", await ev(`document.body.textContent.includes('Reading practice')`));
  return value;
}, 30000);
await clickByText("Quick Practice");
await sleep(2200);
await waitText("Time used", 30000);
await sleep(2200);

const used = await stat("Time used");
const recommended = await stat("Recommended");
const remaining = await stat("Remaining");
const pace = await stat("Pace");
const tm = await stat("Time mgmt");
check("Practice: Time Taken", /00:0/.test(used ?? ""), used);
check("Practice: Recommended 5m", /00:05:00/.test(recommended ?? ""), recommended);
check("Practice: Time Remaining", /00:0[0-4]:/.test(remaining ?? ""), remaining);
check("Practice: Pace label", /Fast|Balanced|Slow/.test(pace ?? ""), pace);
check("Practice: Time mgmt label", /No timing data|Rushed|On pace|Excellent|Slightly over|Over time/.test(tm ?? ""), tm);

await clickByText("Fill demo answers");
await clickByText("Submit selected section");
await waitText("Pacing report", 40000);
const speedCard = await stat("Answer speed");
const tmCard = await stat("Time management");
const sectionTime = await stat("Section time");
check("Practice submit: Answer speed card", /\d+(Fast|Balanced|Slow)/.test(speedCard ?? ""), speedCard);
check("Practice submit: Time mgmt card", /\d+(Excellent|On pace|Slightly over|Over time|Rushed|Needs work)/.test(tmCard ?? ""), tmCard);
check("Practice submit: Section time card", /00:/.test(sectionTime ?? ""), sectionTime);

await clickByText("Full Mock");
await clickByText("Start mock exam");
await waitText("Recommended", 30000);
const mUsed = await stat("Used");
const mRec = await stat("Recommended");
const mRemaining = await stat("Remaining");
const mPace = await stat("Pace");
const mTm = await stat("Time mgmt");
check("Mock: Time Taken (Used)", /00:0/.test(mUsed ?? ""), mUsed);
check("Mock: Recommended 30m", /30m/.test(mRec ?? ""), mRec);
check("Mock: Time Remaining", /00:(2\d|30):\d\d/.test(mRemaining ?? ""), mRemaining);
check("Mock: Pace label", /Fast|Balanced|Slow/.test(mPace ?? ""), mPace);
check("Mock: Time mgmt label", /No timing data|On pace|Rushed|Excellent|Needs work|Slightly over|Over time/.test(mTm ?? ""), mTm);

await clickByText("Fill demo exam answers");
await sleep(2600);
for (let i = 0; i < 3; i += 1) {
  await clickByText("Finish section");
  await sleep(700);
}
await clickByText("Submit full mock");
await waitText("Pacing across the mock", 60000);
const acc = await stat("Overall accuracy");
const mSpeed = await stat("Answer speed");
const mTmCard = await stat("Time management");
check("Mock result: Overall accuracy %", /\d+%/.test(acc ?? ""), acc);
check("Mock result: speed score+label", /\d+(Fast|Balanced|Slow)/.test(mSpeed ?? ""), mSpeed);
check("Mock result: time mgmt score+label", /\d+(Excellent|On pace|Needs work|Slightly over|Rushed)/.test(mTmCard ?? ""), mTmCard);
check("Mock result: overall band shown", /Overall Band \d\.\d/.test((await stat("Overall Band")) ?? "") || (await ev(`document.body.textContent.includes('Overall Band')`)), "Overall Band header");
const sCount = await ev(`(()=>{const h=[...document.querySelectorAll('h3')].find(x=>x.textContent.trim()==='What carried the mock');let el=h&&h.parentElement;while(el&&!el.querySelector('li'))el=el.parentElement;return el?el.querySelectorAll('li').length:0})()`);
const wCount = await ev(`(()=>{const h=[...document.querySelectorAll('h3')].find(x=>x.textContent.trim()==='What cost you band score');let el=h&&h.parentElement;while(el&&!el.querySelector('li'))el=el.parentElement;return el?el.querySelectorAll('li').length:0})()`);
const rCount = await ev(`(()=>{const h=[...document.querySelectorAll('h3')].find(x=>x.textContent.trim()==='Your next sessions');let el=h&&h.parentElement;while(el&&!el.querySelector('li'))el=el.parentElement;return el?el.querySelectorAll('li').length:0})()`);
check("Mock result: Strengths section", sCount >= 1, `${sCount} items`);
check("Mock result: Weaknesses section", wCount >= 1, `${wCount} items`);
check("Mock result: Recommendations section", rCount >= 1, `${rCount} items`);
const bandCards = await ev(`[...document.querySelectorAll('p')].filter(p=>String(p.className).includes('text-5xl')&&/^\\d+\\.\\d$/.test(p.textContent.trim())).length`);
check("Mock result: 4 skill band cards", bandCards === 4, `${bandCards} cards`);
const sectionRows = await ev(`[...document.querySelectorAll('p')].filter(p=>p.textContent.trim().startsWith('recommended')).length`);
check("Mock result: per-section timings", sectionRows >= 4, `${sectionRows} rows`);

await clickByText("Reports");
await waitText("Study statistics", 30000);
await waitText("Grammar", 30000);
const descCards = await ev(`[...document.querySelectorAll('p')].filter(p=>['Grammar','Vocabulary','Fluency','Coherence'].includes(p.textContent.trim())).length`);
const statTiles = await ev(`[...document.querySelectorAll('p')].filter(p=>['Study streak','Hours completed','Weekly goal','Practice sessions','Full mocks','Confidence','Avg accuracy'].includes(p.textContent.trim())).length`);
const hasRecFocus = await ev(`document.body.textContent.includes('Next study focus')`);
const hasPlan = await ev(`document.body.textContent.includes('Suggested plan')`);
check("Reports: 4 descriptor cards", descCards === 4, `${descCards} cards`);
check("Reports: 7 study statistics", statTiles === 7, `${statTiles} tiles`);
check("Reports: AI recommendation focus", hasRecFocus, "Next study focus");
check("Reports: suggested plan list", hasPlan, "Suggested plan");

const failed = results.filter((r) => !r.pass);
console.log(`\n== ${results.length - failed.length}/${results.length} checks passed ==`);
if (failed.length) {
  const dump = await ev(`({ url: location.href, buttons: [...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(Boolean).slice(0,30), body: document.body.textContent.slice(0,500) })`).catch(() => null);
  console.log("STATE:", JSON.stringify(dump, null, 2));
}
process.exit(failed.length === 0 ? 0 : 1);