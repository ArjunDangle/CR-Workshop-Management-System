// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react'; // <-- ADDED THIS IMPORT

// Auth/Public Pages
import LandingPage from "./modules/auth/LandingPage";
import LoginPage from "./modules/auth/LoginPage";

// Dashboard/Protected Page
import DashboardPage from "./modules/dashboard/DashboardPage";

// Other Pages
import NotFound from "./pages/NotFound";

// Import the Protected Route component
import ProtectedRoute from "./components/ProtectedRoute";

// --- NEW: Lazy load the Permit module pages ---
const PermitPage = lazy(() => import('./modules/permit/pages/PermitPage'));
const CreatePermitPage = lazy(() => import('./modules/permit/pages/CreatePermitPage'));
const PermitDetailPage = lazy(() => import('./modules/permit/pages/PermitDetailPage'));
// ---

// Import Machine Page
const MachinePage = lazy(() => import('./modules/machine/pages/MachinePage'));

const queryClient = new QueryClient();

// --- NEW: Create a simple loading fallback for lazy-loaded pages ---
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
  </div>
);
// ---

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}> {/* Wrap all routes in Suspense */}
          <Routes>
            {/* --- Public Routes --- */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* --- Protected Routes --- */}
            <Route element={<ProtectedRoute />}> {/* Wrap protected routes */}
              <Route path="/dashboard" element={<DashboardPage />} />
              
              {/* --- NEW: Permit Module Routes --- */}
              <Route path="/permits" element={<PermitPage />} />
              <Route path="/permits/new" element={<CreatePermitPage />} />
              <Route path="/permits/:id" element={<PermitDetailPage />} />
              {/* --- END NEW --- */}

              {/* Add other protected routes here later */}
              {/* Example: <Route path="/machines" element={<MachinePage />} /> */}
            </Route>

            {/* --- Catch-all Not Found Route --- */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

