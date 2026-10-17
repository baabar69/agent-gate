import { RISK, type ToolCall } from "./tools.js";

export type Policy = {
  maxSteps: number;                       // the loop cap
  allowedHosts: string[];                 // where an export may go, if anywhere
  askPerson: (call: ToolCall, step: number) => Promise<boolean>;
};

export type Verdict =
  | { decision: "allowed"; by: "policy" }
  | { decision: "blocked"; by: "policy"; reason: string }
  | { decision: "approved" | "denied"; by: "person" };

export async function gate(call: ToolCall, step: number, policy: Policy): Promise<Verdict> {
  const risk = RISK[call.tool] ?? "write";          // unknown tools are treated as writes
  if (risk === "read") return { decision: "allowed", by: "policy" };

  // Hard rules first: some things never reach a person because the answer is always no.
  if (call.tool === "export_data") {
    const host = new URL(String(call.args.to)).host;
    if (!policy.allowedHosts.includes(host))
      return { decision: "blocked", by: "policy", reason: `${host} is not an allowed destination` };
  }

  // Everything else that writes waits for a person, who sees the real call.
  const ok = await policy.askPerson(call, step);
  return ok ? { decision: "approved", by: "person" } : { decision: "denied", by: "person" };
}
