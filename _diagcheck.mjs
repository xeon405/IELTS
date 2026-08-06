const BASE = "http://127.0.0.1:8000/api";
const results = [];
const check = (name, pass, detail = "") => { results.push({ pass, name }); console.log(`${pass ? "PASS" : "FAIL"} ${name}${detail ? "  ->  " + detail : ""}`); };
async function req(method, path, body, t = "") {
  const headers = { "Content-Type": "application/json" };
  if (t) headers.Authorization = `Bearer ${t}`;
  const r = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await r.json(); } catch {
    const text = await r.text().catch(() => "");
    if (text) { try { data = JSON.parse(text); } catch { data = null; } }
  }
  return { status: r.status, data };
}

(async () => {
  const ts = Date.now();
  const email = `diag_${ts}@example.com`;
  const reg = await req("POST", "/auth/register", { full_name: "Diagnostic User", email, password: "DiagPass123" });
  const verify = await req("POST", "/auth/verify", { email, code: reg.data.dev_code });
  const token = verify.data.access_token;
  check("diag: register", reg.status === 201);
  check("diag: verify login", verify.status === 200 && !!token);

  const st = await req("GET", "/diagnostic/status", null, token);
  check("diag: status says incomplete", st.status === 200 && st.data.requires_diagnostic === true, JSON.stringify(st.data));

  const start = await req("GET", "/diagnostic/start", null, token);
  const items = start.data.questions?.items ?? start.data.questions;
  check("diag: start returns questions", start.status === 200 && start.data.completed === false && Array.isArray(items) && items.length > 0, `${items.length} items`);

  const answers = {};
  for (const it of items) {
    if (it.id) {
      answers[it.id] = String(it.correctAnswer ?? it.answer ?? "A");
    }
  }
  check("diag: answers assembled", Object.keys(answers).length > 0, `${Object.keys(answers).length}`);
  const submit = await req("POST", "/diagnostic/submit", { answers }, token);
  if (!submit.data?.result) {
    const retry = await req("POST", "/diagnostic/submit", { answers }, token);
    check("diag: submit returns bands", retry.status === 200 && retry.data?.result?.overallBand > 0, `overall=${retry.data?.result?.overallBand}`);
  } else {
    check("diag: submit returns bands", submit.status === 200 && submit.data.result.overallBand > 0, `overall=${submit.data.result?.overallBand}`);
  }
  check("diag: profile updated diagnostic_completed", submit.data.profile?.diagnosticCompleted === true, "");

  const st2 = await req("GET", "/diagnostic/status", null, token);
  check("diag: status now complete", st2.status === 200 && st2.data.requires_diagnostic === false, "");
  const start2 = await req("GET", "/diagnostic/start", null, token);
  check("diag: start after completion -> completed", start2.status === 200 && start2.data.completed === true, "");
  const sub2 = await req("POST", "/diagnostic/submit", { answers: {} }, token);
  check("diag: re-submit -> 409", sub2.status === 409, "");

  const login = await req("POST", "/auth/login", { email, password: "DiagPass123" });
  check("diag: login now requires_diagnostic=false", login.data.requires_diagnostic === false, "");

  const failed = results.filter((r) => !r.pass);
  console.log(`\n== ${results.length - failed.length}/${results.length} diagnostic checks passed ==`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error("FATAL:", e); process.exit(2); });