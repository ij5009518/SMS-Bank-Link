import assert from "node:assert/strict";
import test from "node:test";

import { routeSimulateCommand } from "./simulate-command-routing.js";

const HANDLER_NAMES = [
  "onHelp",
  "onStop",
  "onBalance",
  "onTransactions",
  "onLast",
  "onLimit",
  "onSpend",
  "onUnknown",
] as const;

type HandlerName = (typeof HANDLER_NAMES)[number];

type HandlerMap = Record<HandlerName, () => Promise<string>>;

function buildHandlers(calls: Record<HandlerName, number>): HandlerMap {
  return {
    onHelp: async () => {
      calls.onHelp += 1;
      return "help";
    },
    onStop: async () => {
      calls.onStop += 1;
      return "stop";
    },
    onBalance: async () => {
      calls.onBalance += 1;
      return "balance";
    },
    onTransactions: async () => {
      calls.onTransactions += 1;
      return "transactions";
    },
    onLast: async () => {
      calls.onLast += 1;
      return "last";
    },
    onLimit: async () => {
      calls.onLimit += 1;
      return "limit";
    },
    onSpend: async () => {
      calls.onSpend += 1;
      return "spend";
    },
    onUnknown: async () => {
      calls.onUnknown += 1;
      return "unknown";
    },
  };
}

test("simulate command routing maps each command to exactly one handler", async (t) => {
  const cases: Array<{ cmd: string; expectedHandler: HandlerName; expectedResponse: string }> = [
    { cmd: "HELP", expectedHandler: "onHelp", expectedResponse: "help" },
    { cmd: "STOP", expectedHandler: "onStop", expectedResponse: "stop" },
    { cmd: "BAL", expectedHandler: "onBalance", expectedResponse: "balance" },
    { cmd: "BAL checking", expectedHandler: "onBalance", expectedResponse: "balance" },
    { cmd: "TRANS", expectedHandler: "onTransactions", expectedResponse: "transactions" },
    { cmd: "TRANS 3", expectedHandler: "onTransactions", expectedResponse: "transactions" },
    { cmd: "LAST", expectedHandler: "onLast", expectedResponse: "last" },
    { cmd: "LIMIT", expectedHandler: "onLimit", expectedResponse: "limit" },
    { cmd: "SPEND", expectedHandler: "onSpend", expectedResponse: "spend" },
    { cmd: "WHAT", expectedHandler: "onUnknown", expectedResponse: "unknown" },
  ];

  for (const { cmd, expectedHandler, expectedResponse } of cases) {
    await t.test(cmd, async () => {
      const calls = Object.fromEntries(HANDLER_NAMES.map((name) => [name, 0])) as Record<HandlerName, number>;
      const handlers = buildHandlers(calls);

      const response = await routeSimulateCommand(cmd, handlers);

      assert.equal(response, expectedResponse);
      for (const name of HANDLER_NAMES) {
        const expectedCount = name === expectedHandler ? 1 : 0;
        assert.equal(calls[name], expectedCount, `Expected ${name} call count for command ${cmd}`);
      }
    });
  }
});
