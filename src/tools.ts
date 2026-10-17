import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const FIX = new URL("../fixtures/", import.meta.url).pathname;

export type ToolCall = { tool: string; args: Record<string, unknown> };

// Every tool declares its risk. Reads never need a person. Writes always might.
export const RISK: Record<string, "read" | "write"> = {
  read_inbox: "read",
  read_file: "read",
  send_payment: "write",
  export_data: "write",
  delete_file: "write",
};

export function run(call: ToolCall): string {
  switch (call.tool) {
    case "read_inbox": {
      const dir = join(FIX, "inbox");
      return readdirSync(dir).sort().map(f => `--- ${f}\n` + readFileSync(join(dir, f), "utf8")).join("\n");
    }
    case "read_file":
      return readFileSync(join(FIX, String(call.args.path).replace(/^\/data\//, "")), "utf8");
    case "send_payment":
      return `payment of $${call.args.amount} to ${call.args.to} ref ${call.args.ref} SENT (simulated)`;
    case "export_data":
      return `${call.args.path} exported to ${call.args.to} (simulated)`;
    case "delete_file":
      return `${call.args.path} deleted (simulated)`;
    default:
      throw new Error(`unknown tool ${call.tool}`);
  }
}
