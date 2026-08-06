const BASE = "http://127.0.0.1:8000/api";
const stamp = Date.now();
const email = `rpt_${stamp}@example.com`;
const pwd = "Verify123!";

async function req(method, path, body, token = "") {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

const checks = [];
const check = (name, ok) => checks.push(`${ok ? "PASS" : "FAIL"} ${name}`);

const reg = await req("POST", "/auth/register", { email, full_name: "Report Probe", password: pwd });
check("register", reg.status === 201 && !!reg.data?.dev_code);
const verify = await req("POST", "/auth/verify", { email, code: reg.data?.dev_code });
check("verify", verify.status === 200 && !!verify.data?.access_token);
const token = verify.data?.access_token || "";

const post = await req("POST", "/brain/report", { profile: {} }, token);
check("POST /brain/report -> 200", post.status === 200);
check("POST returns all 14 keys", ["overallBand","sectionScores","strengths","weaknesses","progress","recommendation","practiceSummary","grammar","vocabulary","fluency","coherence","statistics","recommendations"].every((k) => k in (post.data || {})));
check("POST not empty payload", post.status === 200 && !!post.data && Object.keys(post.data).length >= 13);

const get = await req("GET", "/brain/report", null, token);
check("GET /brain/report still 200", get.status === 200);

const recommend = await req("POST", "/brain/recommendation", { profile: {} }, token);
check("recommendation endpoint ok", recommend.status === 200 && !!recommend.data?.recommendation?.module);

console.log(checks.join("\n"));
console.log(`overallBand=${post.data?.overallBand} sections=${JSON.stringify(post.data?.sectionScores)} stats=${JSON.stringify(post.data?.statistics)} recCount=${post.data?.recommendations?.length}`);
process.exit(checks.some((c) => c.startsWith("FAIL")) ? 1 : 0);
