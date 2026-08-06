const API = "http://127.0.0.1:8000/api";
async function http(method, path, body, t = "") {
  const headers = { "Content-Type": "application/json" };
  if (t) headers.Authorization = `Bearer ${t}`;
  const r = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null; try { data = await r.json(); } catch {}
  return { status: r.status, data };
}
const stamp = Date.now();
const email = `modes2_${stamp}@example.com`;
const reg = await http("POST", "/auth/register", { full_name: "Mode Check2", email, password: "Modes123" });
const verify = await http("POST", "/auth/verify", { email, code: reg.data.dev_code });
const token = verify.data.access_token;
const start = await http("GET", "/diagnostic/start", null, token);
const items = start.data.questions?.items ?? start.data.questions;
const answers = {};
for (const it of items) if (it.id) answers[it.id] = "My focused answer for this diagnostic question.";
await http("POST", "/diagnostic/submit", { answers }, token);

const cases = [
  ["reading", "Passage 1"],
  ["reading", "Individual Question Types"],
  ["listening", "Individual Question Types"],
  ["listening", "Part 1"],
  ["writing", "Task 1"],
  ["writing", "Task 2"],
  ["writing", "Essay Types"],
  ["speaking", "Part 1"],
  ["speaking", "Part 2"],
  ["speaking", "Part 3"],
  ["speaking", "Topic Practice"],
  ["speaking", "Question by Question"],
  ["speaking", "Quick Practice"],
];
for (const [module, mode] of cases) {
  const t0 = Date.now();
  const r = await http("POST", "/brain/session", { session: { module, mode } }, token);
  const s = r.data?.session;
  console.log(`${module}/${mode} -> qCount=${s?.questionCount} actual=${(s?.items ?? []).length} src=${s?.source} ms=${Date.now() - t0}`);
}
process.exit(0);