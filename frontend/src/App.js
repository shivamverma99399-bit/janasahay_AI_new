import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "@/context/AppContext";

import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import AIAssistant from "@/pages/AIAssistant";
import SchemeExplorer from "@/pages/SchemeExplorer";
import SchemeDetails from "@/pages/SchemeDetails";
import EligibilityChecker from "@/pages/EligibilityChecker";
import EligibilityResults from "@/pages/EligibilityResults";
import Profile from "@/pages/Profile";
import GovernmentUpdates from "@/pages/GovernmentUpdates";
import Notifications from "@/pages/Notifications";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/search" element={<SchemeExplorer />} />
        <Route path="/scheme/:id" element={<SchemeDetails />} />
        <Route path="/eligibility" element={<EligibilityChecker />} />
        <Route path="/eligibility/results" element={<EligibilityResults />} />
        <Route path="/ai" element={<AIAssistant />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/updates" element={<GovernmentUpdates />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-center" richColors />
        </BrowserRouter>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
