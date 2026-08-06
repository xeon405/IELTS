const API = "http://127.0.0.1:8000/api";
async function http(method, path, body, t = "") {
  const headers = { "Content-Type": "application/json" };
  if (t) headers.Authorization = `Bearer ${t}`;
  const r = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null; try { data = await r.json(); } catch {}
  return { status: r.status, data };
}

const stamp = Date.now();
const email = `modes_${stamp}@example.com`;
const reg = await http("POST", "/auth/register", { full_name: "Mode Check", email, password: "Modes123" });
const verify = await http("POST", "/auth/verify", { email, code: reg.data.dev_code });
const token = verify.data.access_token;
const start = await http("GET", "/diagnostic/start", null, token);
const items = start.data.questions?.items ?? start.data.questions;
const answers = {};
for (const it of items) if (it.id) answers[it.id] = "My focused answer for this diagnostic question.";
await http("POST", "/diagnostic/submit", { answers }, token);

const modes = {
  reading: ["Full Reading Section", "Passage 1", "Passage 2", "Passage 3", "Individual Question Types", "Question by Question", "Quick Practice"],
  listening: ["Full Listening Section", "Part 1", "Part 2", "Part 3", "Part 4", "Individual Question Types", "Question by Question", "Quick Practice"],
  writing: ["Full Writing Section", "Task 1", "Task 2", "Essay Types", "Question by Question", "Quick Practice"],
  speaking: ["Full Speaking Section", "Part 1", "Part 2", "Part 3", "Topic Practice", "Question by Question", "Quick Practice"],
};

for (const [module, list] of Object.entries(modes)) {
  console.log(`== ${module} ==`);
  for (const mode of list) {
    const r = await http("POST", "/brain/session", { session: { module, mode } }, token);
    const s = r.data?.session;
    console.log(`   ${mode.padEnd(28)} qCount=${String(s?.questionCount).padEnd(3)} actual=${String((s?.items ?? []).length).padEnd(3)} src=${s?.source}`);
  }
}
process.exit(0);