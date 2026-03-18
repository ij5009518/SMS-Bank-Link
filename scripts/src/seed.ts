import { db } from "@workspace/db";
import {
  usersTable,
  accountsTable,
  transactionsTable,
  smsLogsTable,
  alertSettingsTable,
  tellerEnrollmentsTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(smsLogsTable);
  await db.delete(transactionsTable);
  await db.delete(tellerEnrollmentsTable);
  await db.delete(accountsTable);
  await db.delete(usersTable);
  await db.delete(alertSettingsTable);

  // Insert alert settings
  await db.insert(alertSettingsTable).values({
    alertsEnabled: true,
    weekendPauseEnabled: true,
    weekendPauseStart: "friday_14:00",
    weekendPauseEnd: "sunday_00:00",
    maxDailyAlerts: 10,
    lowBalanceThreshold: "100",
    largeTransactionThreshold: "500",
  });

  // Insert demo users
  const users = await db.insert(usersTable).values([
    {
      phoneNumber: "+1 (555) 201-4587",
      firstName: "Maria",
      lastName: "Gonzalez",
      smsConsent: true,
      consentDate: new Date("2026-01-15"),
      optedOut: false,
      onboardingStatus: "active",
      createdAt: new Date("2026-01-15"),
    },
    {
      phoneNumber: "+1 (555) 348-9012",
      firstName: "James",
      lastName: "Okafor",
      smsConsent: true,
      consentDate: new Date("2026-01-22"),
      optedOut: false,
      onboardingStatus: "active",
      createdAt: new Date("2026-01-22"),
    },
    {
      phoneNumber: "+1 (555) 472-3301",
      firstName: "Linda",
      lastName: "Nguyen",
      smsConsent: true,
      consentDate: new Date("2026-02-03"),
      optedOut: false,
      onboardingStatus: "active",
      createdAt: new Date("2026-02-03"),
    },
    {
      phoneNumber: "+1 (555) 519-7654",
      firstName: "Robert",
      lastName: "Thornton",
      smsConsent: true,
      consentDate: new Date("2026-02-10"),
      optedOut: false,
      onboardingStatus: "pending",
      createdAt: new Date("2026-02-10"),
    },
    {
      phoneNumber: "+1 (555) 683-2290",
      firstName: "Aisha",
      lastName: "Williams",
      smsConsent: true,
      consentDate: new Date("2026-02-18"),
      optedOut: true,
      onboardingStatus: "opted_out",
      createdAt: new Date("2026-02-18"),
    },
    {
      phoneNumber: "+1 (555) 791-5543",
      firstName: "Carlos",
      lastName: "Rivera",
      smsConsent: true,
      consentDate: new Date("2026-03-01"),
      optedOut: false,
      onboardingStatus: "active",
      createdAt: new Date("2026-03-01"),
    },
    {
      phoneNumber: "+1 (929) 314-5096",
      firstName: "Samuel",
      lastName: "Hauer",
      smsConsent: true,
      consentDate: new Date("2026-03-10"),
      optedOut: false,
      onboardingStatus: "active",
      createdAt: new Date("2026-03-10"),
    },
  ]).returning();

  console.log(`Inserted ${users.length} users`);

  // Insert accounts for active users
  const accountData = [
    // Maria Gonzalez (users[0])
    { userId: users[0].id, bankName: "Chase Bank", accountType: "checking", accountLastFour: "4521", nickname: "checking", currentBalance: "2847.50" },
    { userId: users[0].id, bankName: "Chase Bank", accountType: "savings", accountLastFour: "8834", nickname: "savings", currentBalance: "12400.00" },
    // James Okafor (users[1])
    { userId: users[1].id, bankName: "Bank of America", accountType: "checking", accountLastFour: "7219", nickname: "main", currentBalance: "1523.80" },
    { userId: users[1].id, bankName: "Wells Fargo", accountType: "savings", accountLastFour: "3302", nickname: "emergency", currentBalance: "5000.00" },
    // Linda Nguyen (users[2])
    { userId: users[2].id, bankName: "Citibank", accountType: "checking", accountLastFour: "9087", nickname: "everyday", currentBalance: "834.25" },
    // Carlos Rivera (users[5])
    { userId: users[5].id, bankName: "US Bank", accountType: "checking", accountLastFour: "6643", nickname: "checking", currentBalance: "3210.00" },
    { userId: users[5].id, bankName: "US Bank", accountType: "credit", accountLastFour: "1198", nickname: "credit", currentBalance: "-450.30" },
    // Samuel Hauer (users[6])
    { userId: users[6].id, bankName: "TD Bank", accountType: "checking", accountLastFour: "2847", nickname: "checking", currentBalance: "4156.75" },
  ];

  const accounts = await db.insert(accountsTable).values(accountData).returning();
  console.log(`Inserted ${accounts.length} accounts`);

  // Insert transactions
  const now = new Date("2026-03-12");
  const txnData: Parameters<typeof db.insert<typeof transactionsTable>>[0] extends (...args: infer A) => unknown ? A[0] : never[] = [];

  const mariaChecking = accounts.find((a) => a.userId === users[0].id && a.nickname === "checking")!;
  const mariaSavings = accounts.find((a) => a.userId === users[0].id && a.nickname === "savings")!;
  const jamesMain = accounts.find((a) => a.userId === users[1].id && a.nickname === "main")!;
  const lindaEveryday = accounts.find((a) => a.userId === users[2].id && a.nickname === "everyday")!;
  const carlosChecking = accounts.find((a) => a.userId === users[5].id && a.nickname === "checking")!;
  const samuelChecking = accounts.find((a) => a.userId === users[6].id && a.nickname === "checking")!;

  const addDays = (d: Date, days: number) => {
    const result = new Date(d);
    result.setDate(result.getDate() + days);
    return result;
  };

  // Maria's transactions
  const mariaTxns = [
    { accountId: mariaChecking.id, userId: users[0].id, description: "WALMART GROCERY", amount: "127.43", type: "debit", category: "Groceries", merchantName: "Walmart", transactionDate: addDays(now, -1), runningBalance: "2847.50" },
    { accountId: mariaChecking.id, userId: users[0].id, description: "DIRECT DEPOSIT - EMPLOYER", amount: "1850.00", type: "credit", category: "Income", merchantName: "ABC Corp", transactionDate: addDays(now, -3), runningBalance: "2974.93" },
    { accountId: mariaChecking.id, userId: users[0].id, description: "NETFLIX SUBSCRIPTION", amount: "17.99", type: "debit", category: "Entertainment", merchantName: "Netflix", transactionDate: addDays(now, -5), runningBalance: "1124.93" },
    { accountId: mariaChecking.id, userId: users[0].id, description: "SHELL GAS STATION", amount: "62.40", type: "debit", category: "Fuel", merchantName: "Shell", transactionDate: addDays(now, -6), runningBalance: "1142.92" },
    { accountId: mariaChecking.id, userId: users[0].id, description: "ELECTRIC BILL - PAYMENT", amount: "98.20", type: "debit", category: "Utilities", merchantName: "ConEd", transactionDate: addDays(now, -8), runningBalance: "1205.32" },
    { accountId: mariaSavings.id, userId: users[0].id, description: "TRANSFER FROM CHECKING", amount: "500.00", type: "credit", category: "Transfer", merchantName: "Internal Transfer", transactionDate: addDays(now, -3), runningBalance: "12400.00" },
    { accountId: mariaSavings.id, userId: users[0].id, description: "INTEREST EARNED", amount: "4.17", type: "credit", category: "Interest", merchantName: "Chase Bank", transactionDate: addDays(now, -7), runningBalance: "11900.00" },
  ];

  // James's transactions
  const jamesTxns = [
    { accountId: jamesMain.id, userId: users[1].id, description: "TARGET STORE", amount: "89.55", type: "debit", category: "Shopping", merchantName: "Target", transactionDate: addDays(now, -2), runningBalance: "1523.80" },
    { accountId: jamesMain.id, userId: users[1].id, description: "PAYROLL DEPOSIT", amount: "2100.00", type: "credit", category: "Income", merchantName: "XYZ Inc", transactionDate: addDays(now, -4), runningBalance: "1613.35" },
    { accountId: jamesMain.id, userId: users[1].id, description: "CHIPOTLE MEXICAN GRILL", amount: "14.75", type: "debit", category: "Dining", merchantName: "Chipotle", transactionDate: addDays(now, -5), runningBalance: "-486.65" },
    { accountId: jamesMain.id, userId: users[1].id, description: "AMAZON PRIME", amount: "16.99", type: "debit", category: "Shopping", merchantName: "Amazon", transactionDate: addDays(now, -7), runningBalance: "-471.90" },
  ];

  // Linda's transactions
  const lindaTxns = [
    { accountId: lindaEveryday.id, userId: users[2].id, description: "WHOLE FOODS MARKET", amount: "74.30", type: "debit", category: "Groceries", merchantName: "Whole Foods", transactionDate: addDays(now, -1), runningBalance: "834.25" },
    { accountId: lindaEveryday.id, userId: users[2].id, description: "FREELANCE PAYMENT", amount: "650.00", type: "credit", category: "Income", merchantName: "Client Payment", transactionDate: addDays(now, -3), runningBalance: "908.55" },
    { accountId: lindaEveryday.id, userId: users[2].id, description: "STARBUCKS", amount: "7.45", type: "debit", category: "Dining", merchantName: "Starbucks", transactionDate: addDays(now, -4), runningBalance: "258.55" },
  ];

  // Carlos's transactions
  const carlosTxns = [
    { accountId: carlosChecking.id, userId: users[5].id, description: "COSTCO WHOLESALE", amount: "213.67", type: "debit", category: "Groceries", merchantName: "Costco", transactionDate: addDays(now, -2), runningBalance: "3210.00" },
    { accountId: carlosChecking.id, userId: users[5].id, description: "BIWEEKLY PAYCHECK", amount: "1920.00", type: "credit", category: "Income", merchantName: "Employer Inc", transactionDate: addDays(now, -3), runningBalance: "3423.67" },
    { accountId: carlosChecking.id, userId: users[5].id, description: "RENT PAYMENT", amount: "1450.00", type: "debit", category: "Housing", merchantName: "Sunrise Apartments", transactionDate: addDays(now, -5), runningBalance: "1503.67" },
  ];

  // Samuel's transactions
  const samuelTxns = [
    { accountId: samuelChecking.id, userId: users[6].id, description: "DIRECT DEPOSIT - SALARY", amount: "2350.00", type: "credit", category: "Income", merchantName: "Tech Solutions LLC", transactionDate: addDays(now, -2), runningBalance: "4156.75" },
    { accountId: samuelChecking.id, userId: users[6].id, description: "TRADER JOE'S", amount: "58.92", type: "debit", category: "Groceries", merchantName: "Trader Joe's", transactionDate: addDays(now, -3), runningBalance: "1806.75" },
    { accountId: samuelChecking.id, userId: users[6].id, description: "SUBWAY CARD RELOAD", amount: "33.00", type: "debit", category: "Transport", merchantName: "MTA", transactionDate: addDays(now, -5), runningBalance: "1865.67" },
    { accountId: samuelChecking.id, userId: users[6].id, description: "HULU SUBSCRIPTION", amount: "17.99", type: "debit", category: "Entertainment", merchantName: "Hulu", transactionDate: addDays(now, -7), runningBalance: "1898.67" },
    { accountId: samuelChecking.id, userId: users[6].id, description: "INTERNET BILL", amount: "59.99", type: "debit", category: "Utilities", merchantName: "Spectrum", transactionDate: addDays(now, -9), runningBalance: "1916.66" },
  ];

  const allTxns = [...mariaTxns, ...jamesTxns, ...lindaTxns, ...carlosTxns, ...samuelTxns];
  await db.insert(transactionsTable).values(allTxns);
  console.log(`Inserted ${allTxns.length} transactions`);

  // Insert SMS logs
  const smsLogData = [
    // Maria
    { userId: users[0].id, phoneNumber: users[0].phoneNumber, direction: "inbound", message: "BAL", command: "BAL", status: "delivered", createdAt: new Date("2026-03-12T08:14:00") },
    { userId: users[0].id, phoneNumber: users[0].phoneNumber, direction: "outbound", message: "Current Balances:\nchecking (checking ••••4521): $2847.50\nsavings (savings ••••8834): $12400.00", command: null, status: "delivered", createdAt: new Date("2026-03-12T08:14:02") },
    { userId: users[0].id, phoneNumber: users[0].phoneNumber, direction: "inbound", message: "TRANS", command: "TRANS", status: "delivered", createdAt: new Date("2026-03-11T17:30:00") },
    { userId: users[0].id, phoneNumber: users[0].phoneNumber, direction: "outbound", message: "Recent Transactions:\nMar 11 Walmart: -$127.43\nMar 9 ABC Corp: +$1850.00\nMar 7 Netflix: -$17.99", command: null, status: "delivered", createdAt: new Date("2026-03-11T17:30:03") },
    // James
    { userId: users[1].id, phoneNumber: users[1].phoneNumber, direction: "inbound", message: "BAL main", command: "BAL", status: "delivered", createdAt: new Date("2026-03-12T09:45:00") },
    { userId: users[1].id, phoneNumber: users[1].phoneNumber, direction: "outbound", message: "main (checking ••••7219): $1523.80", command: null, status: "delivered", createdAt: new Date("2026-03-12T09:45:02") },
    { userId: users[1].id, phoneNumber: users[1].phoneNumber, direction: "inbound", message: "HELP", command: "HELP", status: "delivered", createdAt: new Date("2026-03-10T14:20:00") },
    // Linda
    { userId: users[2].id, phoneNumber: users[2].phoneNumber, direction: "inbound", message: "BAL", command: "BAL", status: "delivered", createdAt: new Date("2026-03-12T07:30:00") },
    { userId: users[2].id, phoneNumber: users[2].phoneNumber, direction: "outbound", message: "everyday (checking ••••9087): $834.25", command: null, status: "delivered", createdAt: new Date("2026-03-12T07:30:02") },
    // Aisha (opted out)
    { userId: users[4].id, phoneNumber: users[4].phoneNumber, direction: "inbound", message: "STOP", command: "STOP", status: "delivered", createdAt: new Date("2026-02-25T11:15:00") },
    { userId: users[4].id, phoneNumber: users[4].phoneNumber, direction: "outbound", message: "You have been unsubscribed from SMS Banking. Reply START to re-subscribe.", command: null, status: "delivered", createdAt: new Date("2026-02-25T11:15:03") },
  ];

  await db.insert(smsLogsTable).values(smsLogData);
  console.log(`Inserted ${smsLogData.length} SMS log entries`);

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
