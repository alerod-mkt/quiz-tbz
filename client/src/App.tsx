import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy } from "react";

// Lazy load all pages for better performance and code splitting
const QuizFlow = lazy(() => import("@/pages/QuizFlow"));
const SalesPage = lazy(() => import("@/pages/SalesPage"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const TermosDeUso = lazy(() => import("@/pages/TermosDeUso"));
const PoliticaDePrivacidade = lazy(() => import("@/pages/PoliticaDePrivacidade"));
const PoliticaDeReembolso = lazy(() => import("@/pages/PoliticaDeReembolso"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading component for Suspense
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-deep to-navy-light">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
  </div>
);

function Router() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Switch>
        <Route path="/" component={QuizFlow} />
        <Route path="/quiz" component={QuizFlow} />
        <Route path="/sales">{() => <SalesPage />}</Route>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/termos-de-uso" component={TermosDeUso} />
        <Route path="/politica-de-privacidade" component={PoliticaDePrivacidade} />
        <Route path="/politica-de-reembolso" component={PoliticaDeReembolso} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
