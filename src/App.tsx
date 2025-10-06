import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/app/auth/AuthProvider";
import { RequireAuth } from "@/app/auth/RequireAuth";
import { ImpersonationBar } from "@/components/dev/ImpersonationBar";
import Index from "./pages/Index";
import SearchResults from "./pages/SearchResults";
import PropertyPassport from "./pages/PropertyPassport";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ClaimProperty from "./pages/ClaimProperty";
import Settings from "./pages/Settings";
import TestLogin from "./pages/TestLogin";
import DebugEnv from "./pages/DebugEnv";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ImpersonationBar />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/test-login" element={<TestLogin />} />
            <Route path="/debug/env" element={<DebugEnv />} />
            
            {/* Protected routes */}
            <Route
              path="/search"
              element={
                <RequireAuth>
                  <SearchResults />
                </RequireAuth>
              }
            />
            <Route
              path="/property/:id"
              element={
                <RequireAuth>
                  <PropertyPassport />
                </RequireAuth>
              }
            />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/claim"
              element={
                <RequireAuth>
                  <ClaimProperty />
                </RequireAuth>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAuth>
                  <Settings />
                </RequireAuth>
              }
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
