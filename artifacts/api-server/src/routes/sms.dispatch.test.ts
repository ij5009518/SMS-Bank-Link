import test from "node:test";
import assert from "node:assert/strict";

import { dispatchSimulateCommand } from "./smsDispatch.js";

test("dispatchSimulateCommand routes each command to exactly one handler", async () => {
  const cases = [
    { cmd: "HELP", expected: "help" },
    { cmd: "STOP", expected: "stop" },
    { cmd: "BAL", expected: "balance" },
    { cmd: "BAL checking", expected: "balance" },
    { cmd: "TRANS", expected: "transactions" },
    { cmd: "TRANS 8", expected: "transactions" },
    { cmd: "LAST", expected: "last" },
    { cmd: "LIMIT", expected: "limit" },
    { cmd: "SPEND", expected: "spend" },
    { cmd: "WHAT", expected: "unknown" },
  ] as const;

  for (const { cmd, expected } of cases) {
    const calls: Record<string, number> = {
      help: 0,
      stop: 0,
      balance: 0,
      transactions: 0,
      last: 0,
      limit: 0,
      spend: 0,
      unknown: 0,
    };

    const result = await dispatchSimulateCommand(cmd, {
      help: () => { calls.help += 1; return "help"; },
      stop: () => { calls.stop += 1; return "stop"; },
      balance: () => { calls.balance += 1; return "balance"; },
      transactions: () => { calls.transactions += 1; return "transactions"; },
      last: () => { calls.last += 1; return "last"; },
      limit: () => { calls.limit += 1; return "limit"; },
      spend: () => { calls.spend += 1; return "spend"; },
      unknown: () => { calls.unknown += 1; return "unknown"; },
    });

    assert.equal(result, expected);
    assert.equal(calls[expected], 1, `expected exactly one call for ${expected} on command ${cmd}`);

    const totalCalls = Object.values(calls).reduce((sum, value) => sum + value, 0);
    assert.equal(totalCalls, 1, `expected exactly one total handler call for command ${cmd}`);
  }
});
