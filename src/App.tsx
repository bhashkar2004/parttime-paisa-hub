import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AddJob from "./pages/AddJob";
import Jobs from "./pages/Jobs";
import Apply from "./pages/Apply";
import MyJobs from "./pages/MyJobs";
import MyApplications from "./pages/MyApplications";
import EditJob from "./pages/EditJob";
import JobApplications from "./pages/JobApplications";
import NotFound from "./pages/NotFound";
import AiJobAssistant from "./components/AiJobAssistant";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/add-job" element={<AddJob />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/apply/:jobId" element={<Apply />} />
          <Route path="/my-jobs" element={<MyJobs />} />
          <Route path="/my-applications" element={<MyApplications />} />
          <Route path="/edit-job/:jobId" element={<EditJob />} />
          <Route path="/job-applications/:jobId" element={<JobApplications />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AiJobAssistant />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
