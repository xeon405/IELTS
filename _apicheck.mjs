const BASE = "http://127.0.0.1:8000/api";
const results = [];
let token = "";
const check = (name, pass, detail = "") => { results.push({ pass, name, detail }); console.log(`${pass ? "PASS" : "FAIL"} ${name}${detail ? "  ->  " + detail : ""}`); };

async function req(method, path, body, t = "") {
  const headers = { "Content-Type": "application/json" };
  if (t) headers.Authorization = `Bearer ${t}`;
  const r = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await r.json(); } catch {}
  return { status: r.status, data };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const stamp = Date.now();
  const email = `step13_${stamp}@example.com`;
  const pwd = "CorrectHorse42!x";

  const h = await req("GET", "/brain/health");
  check("health OK", h.status === 200 && h.data.status === "ok", JSON.stringify(h.data));
  check("Gemini integration available at backend", h.data.gemini === true, "");

  const reg = await req("POST", "/auth/register", { full_name: "Step 13 Tester", email, password: pwd }, "");
  check("register creates account gated on email verification", reg.status === 201 && reg.data.requires_verification === true && typeof reg.data.dev_code === "string", `requires_verification=${reg.data.requires_verification}`);
  const devCode = reg.data.dev_code;

  const dup = await req("POST", "/auth/register", { full_name: "Dup", email, password: pwd }, "");
  check("duplicate register -> 409", dup.status === 409, dup.data?.detail);

  const wrongEmail = await req("POST", "/auth/login", { email: `nobody_${stamp}@example.com`, password: pwd }, "");
  check("login unknown email -> 401", wrongEmail.status === 401);

  const badLogin = await req("POST", "/auth/login", { email, password: "wrongpass" }, "");
  check("login wrong password -> 401 (exact password checked)", badLogin.status === 401);

  const unverified = await req("POST", "/auth/login", { email, password: pwd }, "");
  check("login before verification -> 403 not verified", unverified.status === 403 && /verif/i.test(unverified.data?.detail ?? ""), String(unverified.data?.detail));

  const verifyBad = await req("POST", "/auth/verify", { email, code: "000000" }, "");
  check("verify wrong code -> 400", verifyBad.status === 400);

  const verify = await req("POST", "/auth/verify", { email, code: devCode }, "");
  check("verify correct code -> logged in (token)", verify.status === 200 && !!verify.data.access_token && !!verify.data.profile, "");
  token = verify.data.access_token;

  const resend = await req("POST", "/auth/verify/resend", { email }, "");
  check("resend on verified account reports already verified", resend.status === 200 && resend.data.dev_code == null, resend.data?.message);

  const login = await req("POST", "/auth/login", { email, password: pwd }, "");
  check("login exact matching email+password -> token", login.status === 200 && login.data.access_token, "");
  check("login returns requires_diagnostic", login.data.requires_diagnostic === true, "");

  const me = await req("GET", "/auth/me", null, token);
  check("auth/me works", me.status === 200 && me.data.user.email === email, "");
  const meNoAuth = await req("GET", "/auth/me", null, "");
  check("auth/me without token -> 401", meNoAuth.status === 401);

  const bp = await req("GET", "/brain/blueprint?module=reading", null, "");
  check("blueprint (public) returns guide", bp.status === 200 && bp.data.title === "Reading Blueprint", bp.data.title);
  const bps = await req("GET", "/brain/blueprints?module=listening", null, token);
  check("blueprints list (auth)", bps.status === 200 && Array.isArray(bps.data) && bps.data.length > 0, `${bps.data.length} modes`);
  const bpsNoAuth = await req("GET", "/brain/blueprints?module=reading", null, "");
  check("blueprints unauth -> 401", bpsNoAuth.status === 401);

  const rec = await req("POST", "/brain/recommendation", { profile: {} }, token);
  check("recommendation works", rec.status === 200 && rec.data.recommendation && rec.data.session, `-> ${rec.data.recommendation?.module}`);
  const sessionId = rec.data.session?.id;
  const recNoAuth = await req("POST", "/brain/recommendation", { profile: {} }, "");
  check("recommendation unauth -> 401", recNoAuth.status === 401);

  const sess = await req("POST", "/brain/session", { session: { module: "listening", mode: "Question by Question", questionCount: 5 } }, token);
  check("session generation works", sess.status === 200 && Array.isArray(sess.data.session?.items) && sess.data.session.items.length >= 1, `${sess.data.session?.items?.length} items`);

  const evalAnswers = {};
  if (Array.isArray(sess.data.session?.items)) {
    for (const i of sess.data.session.items.slice(0, 3)) evalAnswers[i.id] = String(i.correctAnswer ?? "A");
  }
  const ev = await req("POST", "/brain/evaluate", { profile: {}, session: { id: sessionId ? String(sessionId) : undefined, module: "listening", mode: "Question by Question", items: sess.data.session?.items }, answers: evalAnswers, timing: { totalSeconds: 90 } }, token);
  check("evaluate works", ev.status === 200 && ev.data.evaluation && ev.data.updatedProfile, `band=${ev.data.evaluation?.predictedBand}`);

  const mock = await req("POST", "/brain/mock", { profile: {}, answers: {}, timing: {} }, token);
  check("mock (4-section) works", mock.status === 200 && mock.data.result && mock.data.result.overallBand !== undefined, `overall=${mock.data.result?.overallBand}`);
  const mockNoAuth = await req("POST", "/brain/mock", { profile: {}, answers: {} }, "");
  check("mock unauth -> 401", mockNoAuth.status === 401);

  const report = await req("GET", "/brain/report", null, token);
  check("report works", report.status === 200 && report.data.sectionScores && report.data.statistics, `overall=${report.data.overallBand}`);
  check("report has recommendation + practiceSummary", report.data.recommendation && report.data.practiceSummary, "");
  const reportNoAuth = await req("GET", "/brain/report", null, "");
  check("report unauth -> 401", reportNoAuth.status === 401);

  const tutor = await req("POST", "/brain/tutor", { profile: {}, question: "How do I improve my True/False/Not Given score?" }, token);
  const tutorOk = tutor.status === 200 && tutor.data.reply && tutor.data.reply.length > 20;
  check("tutor works (AI reply)", tutorOk, `tips=${tutor.data.tips?.length}`);
  const tutorNoAuth = await req("POST", "/brain/tutor", { question: "hi" }, "");
  check("tutor unauth -> 401", tutorNoAuth.status === 401);

  const set = await req("PATCH", "/brain/settings", { theme: "dark", weekly_goal_hours: 5.0 }, token);
  check("settings update persists", set.status === 200 && set.data.theme === "dark" && set.data.weekly_goal_hours === 5.0, JSON.stringify(set.data));
  const prof = await req("PATCH", "/brain/profile", { test_type: "general", target_band: 6.5 }, token);
  check("profile onboarding update", prof.status === 200 && prof.data.testType === "general", `testType=${prof.data.testType}`);

  const fp = await req("POST", "/auth/forgot-password", { email }, "");
  const resetToken = fp.data?.reset_token;
  check("forgot-password issues token (dev)", fp.status === 200 && !!resetToken);
  const rs = await req("POST", "/auth/reset-password", { token: resetToken, password: "NewPassword77!" }, "");
  check("reset-password works", rs.status === 200, "");
  const oldLogin = await req("POST", "/auth/login", { email, password: pwd }, "");
  check("old password revoked after reset", oldLogin.status === 401);
  const newLogin = await req("POST", "/auth/login", { email, password: "NewPassword77!" }, "");
  check("new password login works", newLogin.status === 200 && newLogin.data.access_token, "");

  const failed = results.filter((r) => !r.pass);
  console.log(`\n== ${results.length - failed.length}/${results.length} backend checks passed ==`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error("FATAL:", e); process.exit(2); });
