const CDP = "http://127.0.0.1:9222";
let msgId = 0;
const pending = new Map();
const ws = await connectWS();

function connectWS() {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket("ws://127.0.0.1:9222/devtools/page/1");
    socket.addEventListener("open", () => resolve(socket));
    socket.addEventListener("error", reject);
  });
}

ws.addEventListener("message", (event) => {
  const m = JSON.parse(event.data);
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id);
    pending.delete(m.id);
    m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
  }
});

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function ev(expression) {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true });
  return result.result?.value;
}

const expr = `[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Quick Practice').length>0`;
console.log("expression result now:", await ev(expr));
console.log("innerText has 'Quick Practice':", await ev(`document.body.innerText.includes('Quick Practice')`));
console.log("innerText has 'Reading practice':", await ev(`document.body.innerText.includes('Reading practice')`));
process.exit(0);