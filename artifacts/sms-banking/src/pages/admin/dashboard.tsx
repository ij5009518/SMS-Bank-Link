import { useState } from "react";
import { format } from "date-fns";
import { 
  Users, CreditCard, MessageSquare, Settings, 
  Activity, ShieldAlert, ArrowUpRight, ArrowDownRight,
  Menu, BellOff
} from "lucide-react";

import { 
  useGetAdminStats, 
  useListUsers, 
  useGetSmsLogs,
  useGetAlertSettings,
  useUpdateAlertSettings,
  AlertSettings
} from "@workspace/api-client-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { maskAccount, formatCurrency } from "@/lib/utils";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const navItems = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "users", label: "Users", icon: Users },
    { id: "accounts", label: "Linked Accounts", icon: CreditCard },
    { id: "logs", label: "SMS Logs", icon: MessageSquare },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground">
          <ShieldAlert className="w-5 h-5 mr-2" />
          <span className="font-display font-bold">Admin Panel</span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Badge variant="outline" className="w-full justify-center bg-background">Read-Only Mode Active</Badge>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 md:hidden">
            <Button variant="ghost" size="icon"><Menu className="w-5 h-5" /></Button>
            <span className="font-display font-bold">Admin</span>
          </div>
          <h1 className="text-xl font-semibold hidden md:block">
            {navItems.find(i => i.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-4">
             <div className="text-sm font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
               Demo Environment
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {activeTab === "overview" && <TabOverview />}
            {activeTab === "users" && <TabUsers />}
            {activeTab === "accounts" && <TabAccounts />}
            {activeTab === "logs" && <TabLogs />}
            {activeTab === "settings" && <TabSettings />}
          </div>
        </div>
      </main>
    </div>
  );
}

function TabOverview() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading || !stats) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading stats...</div>;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Total Users <Users className="w-4 h-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.activeUsers} active, {stats.optedOutUsers} opted out</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Linked Accounts <CreditCard className="w-4 h-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{stats.totalAccountsLinked}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.pendingOnboarding} users pending linking</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              SMS Activity Today <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{stats.totalSmsToday}</div>
            <p className="text-xs text-muted-foreground mt-1">Inbound and outbound messages</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 shadow-sm">
        <CardHeader>
          <CardTitle>Recent System Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8 bg-slate-50 rounded-lg border border-dashed">
            No active alerts or system errors. Bridge is operating normally.
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function TabUsers() {
  const { data: users, isLoading } = useListUsers();

  if (isLoading || !users) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading users...</div>;

  return (
    <Card className="shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Consent</TableHead>
            <TableHead className="text-right">Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
              <TableCell>{user.phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1-****-$2')}</TableCell>
              <TableCell>
                <Badge variant={user.onboardingStatus === 'active' ? 'default' : 'secondary'} className="capitalize">
                  {user.onboardingStatus.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                {user.smsConsent ? <span className="text-green-600 font-medium">Yes</span> : <span className="text-red-500">No</span>}
              </TableCell>
              <TableCell className="text-right text-muted-foreground text-sm">
                {format(new Date(user.createdAt), "MMM d, yyyy")}
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function TabAccounts() {
  const { data: users, isLoading } = useListUsers();

  if (isLoading || !users) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading accounts...</div>;

  const allAccounts = users.flatMap(u => (u.accounts || []).map(a => ({ ...a, user: u })));

  return (
    <Card className="shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>Institution</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Account Number</TableHead>
            <TableHead>Nickname</TableHead>
            <TableHead className="text-right">Balance (Mock)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allAccounts.map(account => (
            <TableRow key={account.id}>
              <TableCell className="font-medium">{account.bankName}</TableCell>
              <TableCell className="capitalize">{account.accountType}</TableCell>
              <TableCell className="font-mono text-muted-foreground">{maskAccount(account.accountLastFour)}</TableCell>
              <TableCell><Badge variant="outline">{account.nickname}</Badge></TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(account.currentBalance)}</TableCell>
            </TableRow>
          ))}
          {allAccounts.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No linked accounts found</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function TabLogs() {
  const { data: logs, isLoading } = useGetSmsLogs({ limit: 100 });

  if (isLoading || !logs) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading logs...</div>;

  return (
    <Card className="shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Message Content</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map(log => (
            <TableRow key={log.id}>
              <TableCell>
                {log.direction === 'inbound' 
                  ? <ArrowDownRight className="w-4 h-4 text-blue-500" /> 
                  : <ArrowUpRight className="w-4 h-4 text-green-500" />}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
              </TableCell>
              <TableCell className="font-mono text-sm">{log.phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1-****-$2')}</TableCell>
              <TableCell className="max-w-md truncate">{log.message}</TableCell>
              <TableCell>
                <Badge variant="secondary" className={`text-xs ${log.status === 'failed' ? 'bg-red-100 text-red-700' : ''}`}>
                  {log.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No SMS activity recorded</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function TabSettings() {
  const { data: settings, isLoading } = useGetAlertSettings();
  const updateMutation = useUpdateAlertSettings();
  const [localSettings, setLocalSettings] = useState<AlertSettings | null>(null);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading settings...</div>;
  
  if (!localSettings && settings) {
    setLocalSettings(settings);
  }

  const handleSave = async () => {
    if (!localSettings) return;
    await updateMutation.mutateAsync({ data: localSettings });
  };

  if (!localSettings) return null;

  return (
    <div className="grid gap-6 max-w-2xl">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Global Alert Rules</CardTitle>
          <CardDescription>Configure automated SMS notifications sent to users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Automated Alerts</Label>
              <p className="text-sm text-muted-foreground">Master switch for all outbound push notifications.</p>
            </div>
            <Switch 
              checked={localSettings.alertsEnabled} 
              onCheckedChange={(c) => setLocalSettings({...localSettings, alertsEnabled: c})} 
            />
          </div>

          <div className="flex items-start justify-between bg-muted/30 p-4 rounded-xl border">
            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2">
                <BellOff className="w-4 h-4 text-muted-foreground" />
                <Label className="text-base">Weekend Notification Pause</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Pause all non-critical alerts from Friday afternoon through Sunday night to respect user downtime. Users can still query manually.
              </p>
            </div>
            <Switch 
              checked={localSettings.weekendPauseEnabled} 
              onCheckedChange={(c) => setLocalSettings({...localSettings, weekendPauseEnabled: c})} 
            />
          </div>

          <div className="grid gap-4 pt-4 border-t">
            <div className="grid gap-2">
              <Label>Low Balance Threshold ($)</Label>
              <Input 
                type="number" 
                value={localSettings.lowBalanceThreshold} 
                onChange={(e) => setLocalSettings({...localSettings, lowBalanceThreshold: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="grid gap-2">
              <Label>Large Transaction Alert ($)</Label>
              <Input 
                type="number" 
                value={localSettings.largeTransactionThreshold}
                onChange={(e) => setLocalSettings({...localSettings, largeTransactionThreshold: parseInt(e.target.value) || 0})} 
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
