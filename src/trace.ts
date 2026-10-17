import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type TraceEvent = {
  t: string;                 // ISO timestamp
  step: number;              // loop iteration
  tool: string;
  args: Record<string, unknown>;
  risk: "read" | "write";
  decision: "allowed" | "approved" | "denied" | "blocked";
  by: "policy" | "person";
  result?: string;
};

export class Trace {
  constructor(private readonly path: string) {
    mkdirSync(dirname(path), { recursive: true });
  }
  write(e: TraceEvent) {
    appendFileSync(this.path, JSON.stringify(e) + "\n");
  }
}
