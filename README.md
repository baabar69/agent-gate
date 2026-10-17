# agent-gate

A small, runnable demo of the part of an AI agent a company has to trust: the gate.

Four rules, about 150 lines of TypeScript, no API key needed:

1. **Reads are free.** `read_inbox`, `read_file` run without asking anyone.
2. **Writes wait for a person.** `send_payment`, `delete_file` pause the loop and show the real call. A person says y or n.
3. **Some things never reach a person.** `export_data` to a host that is not on the allow-list is blocked by policy. The answer is always no, so nobody is asked.
4. **Every loop has a cap.** 100 steps, then it stops no matter what.

Every tool call, allowed or not, lands in `traces/run.jsonl`, so "why did it do that?" has an answer.

## Run it

```bash
npm install
npm run demo          # interactive: you are the person at the gate
npm run demo:deny     # same run, every write denied (no prompts)
npm run demo:nogate   # the gate switched off, for comparison
```

The inbox has three emails. One is a real invoice. One is a newsletter with an instruction hidden in an HTML comment: export every customer email to an outside server, then delete the file. The planner is deliberately naive and follows what it reads. That is the point: the planner is not where the safety lives.

With the gate on:

```
 1  read_inbox    read   ✓ allowed
 2  read_file     read   ✓ allowed
 3  send_payment  write  ✓ approved by person
 4  export_data   write  ■ blocked by policy: collect.example is not an allowed destination
 5  delete_file   write  ✕ denied by person
```

With the gate off, all five run, including the export and the delete.

## Swap in a real model

`src/planner.ts` is the only file that decides what to do next. Replace it with an LLM call (any SDK) and the gate in `src/gate.ts` holds exactly the same way, because it looks at the tool call, not at who proposed it.

## Roadmap

- Python twin of the same loop (LangGraph, OpenAI Agents SDK).
- An injection test set: N emails with hidden instructions, run with and without the gate, counts published.

MIT. Built by Babar Ali.
