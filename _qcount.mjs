const API = "http://127.0.0.1:8000/api";
async function http(method, path, body, t = "") {
  const headers = { "Content-Type": "application/json" };
  if (t) headers.Authorization = `Bearer ${t}`;
  const r = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null; try { data = await r.json(); } catch {}
  return { status: r.status, data };
}

const stamp = Date.now();
const email = `qc_${stamp}@example.com`;
const reg = await http("POST", "/auth/register", { full_name: "Q Count", email, password: "QCount123" });
const verify = await http("POST", "/auth/verify", { email, code: reg.data.dev_code });
const token = verify.data.access_token;
const start = await http("GET", "/diagnostic/start", null, token);
const items = start.data.questions?.items ?? start.data.questions;
const answers = {};
for (const it of items) if (it.id) answers[it.id] = "My focused answer for this diagnostic question.";
await http("POST", "/diagnostic/submit", { answers }, token);

for (const [module, mode] of [
  ["reading", "Full Reading Section"],
  ["listening", "Full Listening Section"],
  ["writing", "Full Writing Section"],
  ["speaking", "Full Speaking Section"],
]) {
  const t0 = Date.now();
  const r = await http("POST", "/brain/session", { session: { module, mode } }, token);
  const s = r.data?.session;
  const it = (s?.items ?? []);
  console.log(`== ${module} / ${mode} == status=${r.status} qCount=${s?.questionCount} actual=${it.length} source=${s?.source} ms=${Date.now() - t0}`);
  const titles = it.slice(0, 5).map((i) => (i.title || "").slice(0, 40));
  console.log("   first titles:", JSON.stringify(titles));
  const charted = it.filter((i) => i.chart && Object.keys(i.chart).length).length;
  console.log("   with chart:", charted);
}

const m = await http("POST", "/brain/mock", {}, token);
console.log(`== MOCK == status=${m.status}`);
const mr = m.data?.result ?? m.data;
if (mr) {
  for (const sec of (mr.sections ?? [])) {
    console.log(`   section ${sec.skill ?? sec.module} questions=${(sec.questions ?? sec.items ?? []).length}`);
  }
} else {
  console.log("   mock response keys:", Object.keys(m.data ?? {}));
}
process.exit(0);