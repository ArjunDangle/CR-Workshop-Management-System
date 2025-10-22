// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth/Public Pages
import LandingPage from "./modules/auth/LandingPage";
import LoginPage from "./modules/auth/LoginPage";

// Dashboard/Protected Page
import DashboardPage from "./modules/dashboard/DashboardPage";

// Other Pages
import NotFound from "./pages/NotFound";

// Import the Protected Route component
import ProtectedRoute from "./components/ProtectedRoute"; // Adjust path if needed

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* --- Protected Routes --- */}
          <Route element={<ProtectedRoute />}> {/* Wrap protected routes */}
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* Add other protected routes here later */}
            {/* Example: <Route path="/machines" element={<MachinePage />} /> */}
          </Route>

          {/* --- Catch-all Not Found Route --- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;