import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";

// Route-level code splitting keeps the initial bundle small — each page is
// fetched on demand instead of all up front.
const LandingPage = lazy(() => import("./pages/landing"));
const RegisterPage = lazy(() => import("./pages/register"));
const MyAccountPage = lazy(() => import("./pages/my-account"));
const AdminDashboard = lazy(() => import("./pages/admin/dashboard"));
const PrivacyPolicy = lazy(() => import("./pages/privacy"));
const TermsOfService = lazy(() => import("./pages/terms"));
const NotFound = lazy(() => import("./pages/not-found"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner className="w-6 h-6 text-muted-foreground" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/my-account" component={MyAccountPage} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsOfService} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
