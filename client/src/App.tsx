import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import StudyFormPage from "@/pages/study-form";
import QuizPage from "@/pages/quiz";
import ResultsPage from "@/pages/results";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={StudyFormPage} />
      <Route path="/quiz/:id" component={QuizPage} />
      <Route path="/results/:id" component={ResultsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
