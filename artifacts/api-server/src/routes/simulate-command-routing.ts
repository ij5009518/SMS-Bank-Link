export type SimulateCommandHandlers = {
  onHelp: () => Promise<string> | string;
  onStop: () => Promise<string> | string;
  onBalance: () => Promise<string> | string;
  onTransactions: () => Promise<string> | string;
  onLast: () => Promise<string> | string;
  onLimit: () => Promise<string> | string;
  onSpend: () => Promise<string> | string;
  onUnknown: () => Promise<string> | string;
};

export async function routeSimulateCommand(cmd: string, handlers: SimulateCommandHandlers): Promise<string> {
  if (cmd === "HELP") return await handlers.onHelp();
  if (cmd === "STOP") return await handlers.onStop();
  if (cmd === "BAL" || cmd.startsWith("BAL ")) return await handlers.onBalance();
  if (cmd === "TRANS" || cmd.startsWith("TRANS ")) return await handlers.onTransactions();
  if (cmd === "LAST") return await handlers.onLast();
  if (cmd === "LIMIT") return await handlers.onLimit();
  if (cmd === "SPEND") return await handlers.onSpend();
  return await handlers.onUnknown();
}
