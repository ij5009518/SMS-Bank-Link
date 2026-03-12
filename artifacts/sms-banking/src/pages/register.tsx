import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ShieldCheck, ArrowRight, Building2, CheckCircle, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useRegisterUser, useLinkAccount, LinkAccountRequestAccountType } from "@workspace/api-client-react";

const userSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  smsConsent: z.boolean().refine(val => val === true, {
    message: "You must consent to receive SMS messages"
  })
});

const accountSchema = z.object({
  bankName: z.string().min(1, "Please select a bank"),
  accountType: z.enum(["checking", "savings", "credit"]),
  nickname: z.string().min(1, "Nickname is required"),
});

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [registeredUserId, setRegisteredUserId] = useState<number | null>(null);

  const registerMutation = useRegisterUser();
  const linkAccountMutation = useLinkAccount();

  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      smsConsent: false
    }
  });

  const accountForm = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      bankName: "",
      accountType: "checking",
      nickname: ""
    }
  });

  const onUserSubmit = async (values: z.infer<typeof userSchema>) => {
    try {
      const user = await registerMutation.mutateAsync({ data: values });
      setRegisteredUserId(user.id);
      setStep(2);
    } catch (error) {
      console.error("Registration failed", error);
    }
  };

  const onAccountSubmit = async (values: z.infer<typeof accountSchema>) => {
    if (!registeredUserId) return;
    
    try {
      await linkAccountMutation.mutateAsync({
        data: {
          userId: registeredUserId,
          bankName: values.bankName,
          accountType: values.accountType as typeof LinkAccountRequestAccountType[keyof typeof LinkAccountRequestAccountType],
          nickname: values.nickname.toLowerCase().replace(/\s+/g, ''),
          accountLastFour: Math.floor(1000 + Math.random() * 9000).toString(),
          currentBalance: Math.floor(100 + Math.random() * 5000)
        }
      });
      setStep(3);
    } catch (error) {
      console.error("Linking failed", error);
    }
  };

  return (
    <PublicLayout>
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 bg-slate-50/50">
        
        <div className="w-full max-w-xl mb-8 flex justify-center">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                  step >= i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {i}
                </div>
                {i < 3 && (
                  <div className={cn(
                    "w-12 h-1 mx-2 rounded-full transition-colors",
                    step > i ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="w-full max-w-xl shadow-xl shadow-black/5 border-border/60 relative overflow-hidden">
          <AnimatePresence mode="wait">
            
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader>
                  <CardTitle className="text-2xl font-display">Create your account</CardTitle>
                  <CardDescription>Enter your details to register for SMS banking.</CardDescription>
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
                              <FormControl><Input placeholder="Jane" {...field} /></FormControl>
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
                              <FormControl><Input placeholder="Doe" {...field} /></FormControl>
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
                            <FormControl><Input type="tel" placeholder="(555) 123-4567" {...field} /></FormControl>
                            <FormDescription>The phone number you will use to send SMS commands.</FormDescription>
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
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-medium">SMS Consent Agreement</FormLabel>
                              <FormDescription className="text-xs">
                                By checking this box, you agree to receive SMS messages from TextBank. Msg & data rates may apply. Reply STOP to cancel. Read our <Link href="/privacy" className="underline">Privacy Policy</Link>.
                              </FormDescription>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter className="bg-muted/20 border-t px-6 py-4">
                      <Button type="submit" className="w-full group" disabled={registerMutation.isPending}>
                        {registerMutation.isPending ? "Registering..." : "Continue to Link Bank"}
                        {!registerMutation.isPending && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2 text-primary font-medium text-sm">
                    <ShieldCheck className="w-4 h-4" /> Secure Sandbox Environment
                  </div>
                  <CardTitle className="text-2xl font-display">Link your bank</CardTitle>
                  <CardDescription>
                    Connect your institution. We only request read-only access to balances and transactions.
                  </CardDescription>
                </CardHeader>
                <Form {...accountForm}>
                  <form onSubmit={accountForm.handleSubmit(onAccountSubmit)}>
                    <CardContent className="space-y-6">
                      <FormField
                        control={accountForm.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Institution</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a bank..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Chase Mock">Chase (Demo)</SelectItem>
                                <SelectItem value="BofA Mock">Bank of America (Demo)</SelectItem>
                                <SelectItem value="Wells Mock">Wells Fargo (Demo)</SelectItem>
                                <SelectItem value="Capital One Mock">Capital One (Demo)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={accountForm.control}
                          name="accountType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Type..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="checking">Checking</SelectItem>
                                  <SelectItem value="savings">Savings</SelectItem>
                                  <SelectItem value="credit">Credit Card</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={accountForm.control}
                          name="nickname"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SMS Nickname</FormLabel>
                              <FormControl><Input placeholder="e.g. check" {...field} /></FormControl>
                              <FormDescription className="text-xs">Used for commands like <span className="font-mono bg-muted px-1 rounded">BAL check</span></FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/20 border-t px-6 py-4 flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={linkAccountMutation.isPending}>
                        Back
                      </Button>
                      <Button type="submit" className="flex-1" disabled={linkAccountMutation.isPending}>
                        {linkAccountMutation.isPending ? "Connecting..." : "Securely Link Account"}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </motion.div>
            )}

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
                  <h2 className="text-3xl font-display font-bold mb-4">You're all set!</h2>
                  <p className="text-muted-foreground mb-8 max-w-sm">
                    Your phone is registered and your account is linked. Try texting <strong className="text-foreground">BAL</strong> to our service number from your phone.
                  </p>
                  
                  <div className="bg-muted/50 rounded-xl p-6 w-full mb-8">
                    <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Quick Commands</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-left">
                      <div><strong className="font-mono">BAL</strong> - All balances</div>
                      <div><strong className="font-mono">TRANS</strong> - Recent history</div>
                      <div><strong className="font-mono">BAL [name]</strong> - Specific account</div>
                      <div><strong className="font-mono">STOP</strong> - Opt out instantly</div>
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

// Ensure utility is available
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
