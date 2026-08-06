import { chromium } from "playwright";

const BASE = "http://localhost:3100";
const results = [];

function check(name, pass, extra = "") {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}${extra ? "  ->  " + extra : ""}`);
}

async function statText(page, label) {
  const hit = page
    .locator("div")
    .filter({ has: page.getByText(label, { exact: true }) })
    .first();
  await hit.waitFor({ state: "visible", timeout: 8000 });
  return (await hit.innerText()).replace(/\s+/g, " ").trim();
}

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const context = browser.contexts()[0] ?? (await browser.newContext());
const page = await context.newPage();
await page.addInitScript((p) => {
  window.localStorage.setItem("ai-ielts-examiner-profile", JSON.stringify(p));
}, { id: "ui-tester-1", name: "UI Tester" });

// ---------- Practice section ----------
await page.goto(`${BASE}/app`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
check("App loads to dashboard", (await page.getByRole("button", { name: "Reading", exact: true }).count()) > 0);

await page.getByRole("button", { name: "Reading", exact: true }).first().click();
await page.waitForTimeout(600);
await page.getByRole("button", { name: "Quick Practice" }).first().click();
await page.waitForSelector("text=Time used", { timeout: 20000 });
await page.waitForTimeout(2200);

const used = await statText(page, "Time used");
const recommended = await statText(page, "Recommended");
const remaining = await statText(page, "Remaining");
const pace = await statText(page, "Pace");
const tm = await statText(page, "Time mgmt");
check("Practice shows Time Taken", used.startsWith("00:00:"), used);
check("Practice shows Recommended (5m)", recommended.includes("00:05:00"), recommended);
check("Practice shows Time Remaining", /00:0[0-4]:/.test(remaining), remaining);
check("Practice shows Pace label", /Fast|Balanced|Slow/.test(pace), pace);
check("Practice shows Time mgmt label", /No timing data|Rushed|On pace|Excellent|Slightly over|Over time/.test(tm), tm);

await page.getByRole("button", { name: "Fill demo answers" }).click();
await page.getByRole("button", { name: "Submit selected section" }).click();
await page.waitForSelector("text=Pacing report", { timeout: 40000 });
const speedCard = await statText(page, "Answer speed");
const tmCard = await statText(page, "Time management");
const sectionTime = await statText(page, "Section time");
check("After submit: Answer speed card", /\d+ (Fast|Balanced|Slow)/.test(speedCard), speedCard);
check("After submit: Time management card", /^\d+ (Excellent|On pace|Slightly over|Over time|Rushed|Needs work)/.test(tmCard), tmCard);
check("After submit: Section time card", /00:/ .test(sectionTime), sectionTime);

// ---------- Mock section ----------
await page.getByRole("button", { name: "Full Mock", exact: true }).click();
await page.waitForTimeout(600);
await page.getByRole("button", { name: "Start mock exam" }).click();
await page.waitForSelector("text=Used", { timeout: 15000 });
const mUsed = await statText(page, "Used");
const mRec = await statText(page, "Recommended");
const mRemaining = await statText(page, "Remaining");
const mPace = await statText(page, "Pace");
const mTm = await statText(page, "Time mgmt");
check("Mock shows Time Taken (Used)", mUsed.startsWith("00:0"), mUsed);
check("Mock shows Recommended 30m", mRec.includes("30m"), mRec);
check("Mock shows Time Remaining", /00:2/.test(mRemaining), mRemaining);
check("Mock shows Pace label", /Fast|Balanced|Slow/.test(mPace), mPace);
check("Mock shows Time mgmt label", /On pace|Rushed|Excellent|Needs work|Slightly over|Over time/.test(mTm), mTm);

await page.getByRole("button", { name: "Fill demo exam answers" }).click();
await page.waitForTimeout(2600);
for (let i = 0; i < 3; i += 1) {
  await page.getByRole("button", { name: "Finish section" }).click();
  await page.waitForTimeout(700);
}
await page.getByRole("button", { name: "Submit full mock" }).click();
await page.waitForSelector("text=Pacing across the mock", { timeout: 60000 });
const acc = await statText(page, "Overall accuracy");
const mSpeedCard = await statText(page, "Answer speed");
const mTmCard = await statText(page, "Time management");
check("Mock result: Overall accuracy %", /^Overall accuracy \d+%/.test(acc), acc);
check("Mock result: speed score+label", /^\d+ (Fast|Balanced|Slow)/.test(mSpeedCard), mSpeedCard);
check("Mock result: time mgmt score+label", /^\d+ (Excellent|On pace|Needs work|Slightly over|Rushed)/.test(mTmCard), mTmCard);
const hasSectionTimes = await page.locator("p", { hasText: "recommended" }).count();
check("Mock result: per-section timings", hasSectionTimes >= 4, `${hasSectionTimes} rows`);

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n== ${results.length - failed.length}/${results.length} checks passed ==`);
process.exit(failed.length === 0 ? 0 : 1);