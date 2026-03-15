import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  ShieldCheck,
  ArrowRight,
  Building2,
  CheckCircle,
  LockKeyhole,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useRegisterUser, useGetTellerConfig, useTellerEnroll } from "@workspace/api-client-react";

declare global {
  interface Window {
    TellerConnect?: {
      setup: (opts: {
        applicationId: string;
        environment?: string;
        products?: string[];
        onSuccess: (enrollment: { accessToken: string; enrollment: { id: string; institution: { name: string } } }) => void;
        onExit?: () => void;
        onFailure?: (e: unknown) => void;
      }) => { open: () => void };
    };
  }
}

const userSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  smsConsent: z.boolean().refine((val) => val === true, {
    message: "You must consent to receive SMS messages",
  }),
});

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [registeredUserId, setRegisteredUserId] = useState<number | null>(null);
  const [tellerScriptLoaded, setTellerScriptLoaded] = useState(false);
  const [tellerError, setTellerError] = useState<string | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<{ nickname: string; lastFour: string; bankName: string }[]>([]);
  const tellerConnectRef = useRef<{ open: () => void } | null>(null);

  const registerMutation = useRegisterUser();
  const tellerEnrollMutation = useTellerEnroll();
  const { data: tellerConfig } = useGetTellerConfig();

  // Load Teller Connect script once
  useEffect(() => {
    if (document.querySelector('script[src*="teller.io"]')) {
      setTellerScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.teller.io/connect/connect.js";
    script.async = true;
    script.onload = () => setTellerScriptLoaded(true);
    script.onerror = () => setTellerError("Could not load bank connection service. Please try again.");
    document.head.appendChild(script);
  }, []);

  // Set up Teller Connect when config is ready
  useEffect(() => {
    if (!tellerScriptLoaded || !tellerConfig?.applicationId || !registeredUserId) return;

    if (!window.TellerConnect) {
      setTellerError("Bank connection service unavailable.");
      return;
    }

    tellerConnectRef.current = window.TellerConnect.setup({
      applicationId: tellerConfig.applicationId,
      environment: tellerConfig.environment,
      products: ["balance", "transactions"],
      onSuccess: async (enrollment) => {
        setTellerError(null);
        try {
          const result = await tellerEnrollMutation.mutateAsync({
            data: {
              userId: registeredUserId,
              accessToken: enrollment.accessToken,
              enrollmentId: enrollment.enrollment.id,
              institutionName: enrollment.enrollment.institution.name,
            },
          });
          setLinkedAccounts(
            result.accounts.map((a) => ({
              nickname: a.nickname,
              lastFour: a.accountLastFour,
              bankName: a.bankName,
            }))
          );
          setStep(3);
        } catch (e) {
          setTellerError("Failed to save your bank connection. Please try again.");
        }
      },
      onExit: () => {
        // user closed connect modal — that's ok
      },
      onFailure: () => {
        setTellerError("Bank connection failed. Please try again.");
      },
    });
  }, [tellerScriptLoaded, tellerConfig, registeredUserId]);

  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      smsConsent: false,
    },
  });

  const onUserSubmit = async (values: z.infer<typeof userSchema>) => {
    try {
      const user = await registerMutation.mutateAsync({ data: values });
      setRegisteredUserId(user.id);
      setStep(2);
    } catch (e: unknown) {
      const data = (e as { data?: { error?: string; message?: string } })?.data;
      if (data?.error === "duplicate_phone") {
        userForm.setError("phoneNumber", { message: data.message });
      } else {
        userForm.setError("root", { message: "Registration failed. Please try again." });
      }
    }
  };

  const openTellerConnect = () => {
    setTellerError(null);
    if (tellerConnectRef.current) {
      tellerConnectRef.current.open();
    } else {
      setTellerError("Bank connection not ready yet. Please wait a moment and try again.");
    }
  };

  return (
    <PublicLayout>
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 bg-slate-50/50">
        {/* Step indicator */}
        <div className="w-full max-w-xl mb-8 flex justify-center">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                    step > i
                      ? "bg-primary text-primary-foreground"
                      : step === i
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step > i ? <CheckCircle className="w-4 h-4" /> : i}
                </div>
                {i < 3 && (
                  <div
                    className={cn(
                      "w-12 h-1 mx-2 rounded-full transition-colors",
                      step > i ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="w-full max-w-xl shadow-xl shadow-black/5 border-border/60 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Info + Consent */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader>
                  <CardTitle className="text-2xl font-display">Create your account</CardTitle>
                  <CardDescription>
                    Enter your details to register for SMS banking.
                  </CardDescription>
                </CardHeader>
                <Form {...userForm}>
                  <form onSubmit={userForm.handleSubmit(onUserSubmit)}>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={userForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Jane" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={userForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="(555) 123-4567" {...field} />
                            </FormControl>
                            <FormDescription>
                              The phone number you will use to send SMS commands.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={userForm.control}
                        name="smsConsent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/30">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-medium">
                                SMS Consent Agreement
                              </FormLabel>
                              <FormDescription className="text-xs">
                                By checking this box, you agree to receive SMS messages from
                                TextBank. Msg & data rates may apply. Reply STOP to cancel. Read
                                our{" "}
                                <Link href="/privacy" className="underline">
                                  Privacy Policy
                                </Link>
                                .
                              </FormDescription>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {userForm.formState.errors.root && (
                        <p className="text-sm text-destructive">
                          {userForm.formState.errors.root.message}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="bg-muted/20 border-t px-6 py-4">
                      <Button
                        type="submit"
                        className="w-full group"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Registering...
                          </>
                        ) : (
                          <>
                            Continue to Link Bank
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </motion.div>
            )}

            {/* Step 2: Teller Connect */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2 text-primary font-medium text-sm">
                    <ShieldCheck className="w-4 h-4" /> Powered by Teller
                  </div>
                  <CardTitle className="text-2xl font-display">Link your bank</CardTitle>
                  <CardDescription>
                    Connect your institution securely through Teller. We only request{" "}
                    <strong>read-only</strong> access to balances and transactions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Security badge */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { icon: LockKeyhole, label: "Bank-grade TLS" },
                      { icon: ShieldCheck, label: "Read-only access" },
                      { icon: Building2, label: "10,000+ banks" },
                    ].map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/50"
                      >
                        <Icon className="w-5 h-5 text-primary" />
                        <span className="text-xs text-muted-foreground font-medium">{label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">What Teller accesses:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Account names and last 4 digits</li>
                      <li>Current balance (read-only)</li>
                      <li>Recent transaction history (read-only)</li>
                    </ul>
                    <p className="pt-1">
                      We <strong>never</strong> store your bank credentials or initiate any
                      transactions.
                    </p>
                  </div>

                  {tellerError && (
                    <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      {tellerError}
                    </div>
                  )}

                  {tellerEnrollMutation.isPending && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Syncing your accounts…
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/20 border-t px-6 py-4 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={tellerEnrollMutation.isPending}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={openTellerConnect}
                    disabled={!tellerScriptLoaded || !tellerConfig || tellerEnrollMutation.isPending}
                  >
                    {!tellerScriptLoaded ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Loading…
                      </>
                    ) : (
                      <>
                        <Building2 className="w-4 h-4 mr-2" /> Connect Your Bank
                      </>
                    )}
                  </Button>
                </CardFooter>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-display font-bold mb-2">You're all set!</h2>

                  {linkedAccounts.length > 0 && (
                    <div className="w-full bg-muted/40 rounded-xl p-4 mb-6 text-left space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Linked Accounts
                      </p>
                      {linkedAccounts.map((a) => (
                        <div
                          key={a.lastFour}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="font-medium">
                            {a.bankName} ••••{a.lastFour}
                          </span>
                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                            BAL {a.nickname}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-muted-foreground mb-8 max-w-sm text-sm">
                    Your phone is registered and your accounts are linked. Try texting{" "}
                    <strong className="text-foreground font-mono">BAL</strong> to our service
                    number from your phone.
                  </p>

                  <div className="bg-muted/50 rounded-xl p-5 w-full mb-8">
                    <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                      Quick Commands
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm text-left">
                      <div>
                        <span className="font-mono font-bold">BAL</span>{" "}
                        <span className="text-muted-foreground">All balances</span>
                      </div>
                      <div>
                        <span className="font-mono font-bold">TRANS</span>{" "}
                        <span className="text-muted-foreground">Recent history</span>
                      </div>
                      <div>
                        <span className="font-mono font-bold">BAL [name]</span>{" "}
                        <span className="text-muted-foreground">Specific account</span>
                      </div>
                      <div>
                        <span className="font-mono font-bold">STOP</span>{" "}
                        <span className="text-muted-foreground">Opt out instantly</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full" onClick={() => setLocation("/")}>
                    Return to Homepage
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </PublicLayout>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
