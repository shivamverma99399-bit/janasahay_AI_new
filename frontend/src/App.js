import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
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
import GovernmentUpdateDetails from "@/pages/GovernmentUpdateDetails";
import Notifications from "@/pages/Notifications";
import NotFound from "@/pages/NotFound";
import SignIn from "@/pages/SignIn";
import CreateId from "@/pages/CreateId";
import { useApp } from "@/context/AppContext";

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
      <Route path="/signin" element={<SignIn />} />
      <Route path="/create-id" element={<CreateId />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/search" element={<SchemeExplorer />} />
        <Route path="/scheme/:id" element={<SchemeDetails />} />
        <Route path="/scheme/guide/:id" element={<SchemeDetails />} />
        <Route path="/scheme/apply/:id" element={<SchemeDetails />} />
        <Route path="/scheme/details/:id" element={<SchemeDetails />} />
        <Route path="/scheme/:id/guide" element={<SchemeDetails />} />
        <Route path="/scheme/:id/apply" element={<SchemeDetails />} />
        <Route path="/scheme/:id/details" element={<SchemeDetails />} />
        <Route path="/schemes/:id" element={<SchemeDetails />} />
        <Route path="/schemes/guide/:id" element={<SchemeDetails />} />
        <Route path="/schemes/apply/:id" element={<SchemeDetails />} />
        <Route path="/schemes/details/:id" element={<SchemeDetails />} />
        <Route path="/schemes/:id/guide" element={<SchemeDetails />} />
        <Route path="/schemes/:id/apply" element={<SchemeDetails />} />
        <Route path="/guide/:id" element={<SchemeDetails />} />
        <Route path="/apply/:id" element={<SchemeDetails />} />
        <Route path="/eligibility" element={<EligibilityChecker />} />
        <Route path="/eligibility/results" element={<EligibilityResults />} />
        <Route path="/ai" element={<AIAssistant />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/documents" element={<Navigate to="/profile" replace />} />
        <Route path="/documents" element={<Navigate to="/profile" replace />} />
        <Route path="/schemes" element={<Navigate to="/search" replace />} />
        <Route path="/browse" element={<Navigate to="/search" replace />} />
        <Route path="/chat" element={<Navigate to="/ai" replace />} />
        <Route path="/help" element={<Navigate to="/ai" replace />} />
        <Route path="/eligibility/check" element={<Navigate to="/eligibility" replace />} />
        <Route path="/updates" element={<GovernmentUpdates />} />
        <Route path="/government-updates" element={<GovernmentUpdates />} />
        <Route path="/government-updates/:id" element={<GovernmentUpdateDetails />} />
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
