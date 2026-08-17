// Offline grading parity check: the TypeScript mirror in ielts-brain.ts must
// produce the same bands as the Python criteria scorer for shared samples.
// The Python side is locked by tests/test_api.py (test_writing_criteria_official_curves
// and test_speaking_criteria_official_curves); this script locks the TS side.
// Run from the repo root:  npm ci && node scripts/ts-parity-check.cjs
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const loadTs = (file) =>
  ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.Preserve },
  }).outputText;

const timingModule = { exports: {} };
new Function("module", "exports", "require", loadTs(path.join(root, "src/lib/timing.ts")))(timingModule, timingModule.exports, require);

const brainModule = { exports: {} };
let brainJs = loadTs(path.join(root, "src/lib/ielts-brain.ts")).replace(/require\("@\/lib\/timing"\)/g, "require('./timing-shim')");
brainJs += "\nmodule.exports.writingCriteriaBand = writingCriteriaBand;\nmodule.exports.speakingCriteriaBand = speakingCriteriaBand;\n";
new Function("module", "exports", "require", brainJs)(brainModule, brainModule.exports, (id) => {
  if (id === "./timing-shim") return timingModule.exports;
  return require(id);
});

const FULL_ESSAY =
  "Governments should invest more in public transport. First, it reduces congestion in city centres because fewer people drive to work. " +
  "Moreover, public transport is cheaper for low-income families, although its quality depends on reliable funding. " +
  "For example, cities that expanded bus networks have seen fewer car journeys and noticeably cleaner air. " +
  "Furthermore, cycling infrastructure encourages people to exercise as they travel, which improves public health over time. " +
  "On the other hand, some argue that cars remain essential in rural areas where buses are rare or expensive to run. " +
  "Therefore, investment should focus on urban networks first, while subsidies keep rural connections alive. " +
  "In addition, electric buses reduce emissions even further, and many governments already fund them through green taxes. " +
  "However, none of this works unless fares stay affordable, because commuters will otherwise return to private cars. " +
  "Finally, well-designed stations and safe cycle lanes convince more people to switch, whereas crowded, unreliable services discourage them. " +
  "In conclusion, while cars will not disappear, a well-funded transport system is the most practical way to reduce traffic and " +
  "pollution across the country, and it improves the quality of everyday life for millions of residents, which is why governments " +
  "should treat it as a priority alongside housing and education.";

const SPEAKING_LONG =
  "I usually prefer reading at home because it is quiet, although I also enjoy libraries when the weather is bad. " +
  "For example, I read before bed which helps me relax, and when I travel I carry a small book with me. " +
  "If I have a long journey, I can finish a whole chapter. However, I find e-books convenient since they fit in my pocket, " +
  "but I still choose paper books because I like the feeling of turning pages, which makes reading feel like a real experience.";

// [label, fn, args, expected] — expected mirrors the Python criterion outputs.
const checks = [
  ["writing full Task 2 essay", (m) => m.writingCriteriaBand(FULL_ESSAY, { title: "Task 2 Opinion" }), 6.0],
  ["writing tiny under-length Task 1", (m) => m.writingCriteriaBand("The chart shows sales. Sales rose. They fell. Top is cars.", { examSection: "Task 1" }), 4.5],
  ["writing empty", (m) => m.writingCriteriaBand("", { title: "Task 2 Opinion" }), 4.0],
  ["speaking long structured answer", (m) => m.speakingCriteriaBand(SPEAKING_LONG), 7.0],
  ["speaking short answer", (m) => m.speakingCriteriaBand("I like reading. It is fun."), 5.0],
  ["speaking empty", (m) => m.speakingCriteriaBand(""), 4.5],
];

let failed = 0;
for (const [label, fn, expected] of checks) {
  const actual = fn(brainModule.exports);
  const ok = actual === expected;
  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: got ${actual}, expected ${expected}`);
}
if (failed) {
  console.error(`\n${failed} parity check(s) failed - TS grading drifted from Python.`);
  process.exit(1);
}
console.log("\nAll grading parity checks passed.");