import { createInterface } from "node:readline/promises";
import { stdin, stdout, argv } from "node:process";
import { gate, type Policy, type Verdict } from "./gate.js";
import { plan } from "./planner.js";
import { run, RISK } from "./tools.js";
import { Trace } from "./trace.js";

const flags = new Set(argv.slice(2));
const NO_GATE = flags.has("--no-gate");
const AUTO = flags.has("--auto");      // approve everything without asking (for comparison runs)
const DENY = flags.has("--deny");      // deny everything without asking (for CI / screenshots)

const c = { dim: "\x1b[2m", green: "\x1b[32m", amber: "\x1b[33m", red: "\x1b[31m", bold: "\x1b[1m", off: "\x1b[0m" };
const tag = (s: string, col: string) => `${col}${s}${c.off}`;

const trace = new Trace(new URL("../traces/run.jsonl", import.meta.url).pathname);
const rl = AUTO || DENY ? null : createInterface({ input: stdin, output: stdout });

const policy: Policy = {
  maxSteps: 100,
  allowedHosts: ["exports.yourcompany.example"],
  askPerson: async (call, step) => {
    if (AUTO) return true;
    if (DENY) return false;
    console.log(`\n${tag("  needs a person", c.amber)}  step ${step}  ${c.bold}${call.tool}${c.off} ${JSON.stringify(call.args)}`);
    const a = (await rl!.question("  approve? [y/N] ")).trim().toLowerCase();
    return a === "y" || a === "yes";
  },
};

const memory: string[] = [];
let counts = { allowed: 0, approved: 0, denied: 0, blocked: 0 };

console.log(`${c.bold}agent-gate${c.off}  gate: ${NO_GATE ? tag("OFF", c.red) : tag("ON", c.green)}  cap: ${policy.maxSteps} steps\n`);

for (let step = 1; step <= policy.maxSteps; step++) {
  const call = plan(step, memory);
  if (!call) { console.log(`\n${c.dim}planner has nothing left to do${c.off}`); break; }

  const risk = RISK[call.tool] ?? "write";
  const verdict: Verdict = NO_GATE ? { decision: "allowed", by: "policy" } : await gate(call, step, policy);

  const line = `${String(step).padStart(2)}  ${call.tool.padEnd(13)} ${risk === "read" ? tag("read ", c.dim) : tag("write", c.amber)}  `;
  let result: string | undefined;
  if (verdict.decision === "allowed" || verdict.decision === "approved") {
    result = run(call);
    memory.push(result);
    console.log(line + tag(verdict.decision === "allowed" ? "✓ allowed" : "✓ approved by person", c.green));
  } else if (verdict.decision === "denied") {
    memory.push(`denied:${call.tool}`);
    console.log(line + tag("✕ denied by person", c.red));
  } else {
    memory.push(`blocked:${call.tool}`);
    console.log(line + tag(`■ blocked by policy: ${verdict.reason}`, c.red));
  }
  counts[verdict.decision]++;
  trace.write({ t: new Date().toISOString(), step, tool: call.tool, args: call.args, risk, decision: verdict.decision, by: verdict.by, result: result?.slice(0, 80) });
}

rl?.close();
console.log(`\n${c.bold}summary${c.off}  allowed ${counts.allowed}  approved ${counts.approved}  denied ${counts.denied}  blocked ${counts.blocked}`);
console.log(`${c.dim}trace: traces/run.jsonl${c.off}`);
