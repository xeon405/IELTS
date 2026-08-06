const controller = new AbortController();
setTimeout(() => controller.abort(), 8000);
let version;
try {
  version = await fetch("http://127.0.0.1:9222/json/version", { signal: controller.signal }).then((r) => r.json());
} catch (err) {
  console.log("FETCH VERSION FAILED:", err.name === "AbortError" ? "aborted (port not listening?)" : err.message);
  process.exit(1);
}
console.log("browser:", version.Browser);
const wsUrl = version.webSocketDebuggerUrl;
console.log("ws url:", wsUrl);
const ws = new WebSocket(wsUrl);
const done = setTimeout(() => {
  console.log("WS TIMEOUT");
  process.exit(1);
}, 8000);
ws.addEventListener("open", () => {
  clearTimeout(done);
  console.log("WS OPEN -> raw CDP connection works");
  ws.send(JSON.stringify({ id: 1, method: "Browser.getVersion" }));
});
ws.addEventListener("message", (event) => {
  console.log("cdp reply:", typeof event.data === "string" ? event.data.slice(0, 120) : "binary");
  clearTimeout(done);
  process.exit(0);
});
ws.addEventListener("error", (event) => {
  clearTimeout(done);
  console.log("WS ERROR:", event.message ?? "websocket error");
  process.exit(1);
});