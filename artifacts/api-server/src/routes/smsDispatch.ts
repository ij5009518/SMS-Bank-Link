export type SimulateCommandHandlers = {
  help: () => Promise<string> | string;
  stop: () => Promise<string> | string;
  balance: (cmd: string) => Promise<string> | string;
  transactions: (cmd: string) => Promise<string> | string;
  last: () => Promise<string> | string;
  limit: () => Promise<string> | string;
  spend: () => Promise<string> | string;
  unknown: () => Promise<string> | string;
};

export async function dispatchSimulateCommand(
  cmd: string,
  handlers: SimulateCommandHandlers
): Promise<string> {
  if (cmd === "HELP") {
    return handlers.help();
  }
  if (cmd === "STOP") {
    return handlers.stop();
  }
  if (cmd === "BAL" || cmd.startsWith("BAL ")) {
    return handlers.balance(cmd);
  }
  if (cmd === "TRANS" || cmd.startsWith("TRANS ")) {
    return handlers.transactions(cmd);
  }
  if (cmd === "LAST") {
    return handlers.last();
  }
  if (cmd === "LIMIT") {
    return handlers.limit();
  }
  if (cmd === "SPEND") {
    return handlers.spend();
  }
  return handlers.unknown();
}
