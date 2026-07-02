import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/lib/api";
import LoginPage from "@/pages/login";
import RequestEstimatePage from "@/pages/request-estimate";
import PortfolioPage from "@/pages/portfolio";
import DashboardPage from "@/pages/dashboard";
import EstimatesPage from "@/pages/estimates";
import InvoicesPage from "@/pages/invoices";
import JobsPage from "@/pages/jobs";
import UsersPage from "@/pages/users";
import SettingsPage from "@/pages/settings";
import TimeEntriesPage from "@/pages/time-entries";
import NotFound from "@/pages/not-found";
import { ClientEstimatesPage, ClientInvoicesPage, ClientJobsPage } from "@/pages/client-portal";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AuthRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const role = user.role;
      if (role === "client") setLocation("/client/estimates");
      else if (role === "crew" || role === "supervisor") setLocation("/jobs");
      else setLocation("/dashboard");
    } else if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthRedirect} />
      <Route path="/login" component={LoginPage} />
      <Route path="/request-estimate" component={RequestEstimatePage} />
      <Route path="/portfolio" component={PortfolioPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/estimates" component={EstimatesPage} />
      <Route path="/invoices" component={InvoicesPage} />
      <Route path="/jobs" component={JobsPage} />
      <Route path="/users" component={UsersPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/time-entries" component={TimeEntriesPage} />
      <Route path="/client/estimates" component={ClientEstimatesPage} />
      <Route path="/client/invoices" component={ClientInvoicesPage} />
      <Route path="/client/jobs" component={ClientJobsPage} />
      <Route component={NotFound} />
    </Switch>
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
