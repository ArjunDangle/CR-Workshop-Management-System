import React, { lazy, Suspense, useEffect } from 'react'; // --- Add useEffect
import { useAuthStore } from '@/modules/auth/authStore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/layout/DashboardLayout';
// --- NEW: Import useQuery and user fetching function ---
import { useQuery } from '@tanstack/react-query';
import { getCurrentUserProfile } from '@/modules/auth/authApi';
// ---

// --- Lazy Load the Role-Specific Dashboards ---
// --- FIX: Make lazy load imports more robust ---
const SSEMaintenancePermitDashboard = lazy(() =>
  import('../components/dashboards/SSEMaintenancePermitDashboard').then(module => ({ default: module.default }))
);
const SSEOfficePermitDashboard = lazy(() =>
  import('../components/dashboards/SSEOfficePermitDashboard').then(module => ({ default: module.default }))
);
const SafetyOfficerPermitDashboard = lazy(() =>
  import('../components/dashboards/SafetyOfficerPermitDashboard').then(module => ({ default: module.default }))
);
// --- END FIX ---

// Loading component for Suspense
const DashboardLoading = () => (
  <Card>
    <CardHeader>
      <CardTitle>Loading Permit Dashboard...</CardTitle>
    </CardHeader>
    <CardContent className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </CardContent>
  </Card>
);

// Helper to determine which dashboard to show
const getRoleDashboard = (roleName: string | undefined) => {
  if (roleName?.startsWith('SSE-Maintenance')) {
    return <SSEMaintenancePermitDashboard />;
  }
  
  switch (roleName) {
    case 'SSE-Office':
      return <SSEOfficePermitDashboard />;
    case 'Safety Officer':
      return <SafetyOfficerPermitDashboard />;
    default:
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error: No Dashboard Found</AlertTitle>
          <AlertDescription>
            A permit dashboard has not been configured for your user role
            ({roleName || 'Unknown'}).
          </AlertDescription>
        </Alert>
      );
  }
};

const PermitPage = () => {
  // --- FIX: Read user, isAuthenticated, and setUser from the store ---
  const { user, isAuthenticated, setUser } = useAuthStore();
  
  // --- FIX: Add query to fetch user profile if it's missing ---
  const { isLoading: isLoadingUser, data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getCurrentUserProfile,
    // Only run if authenticated but user object is missing
    enabled: !!isAuthenticated && !user,
    // --- REMOVED onSuccess and retry ---
  });
  
  // --- NEW: useEffect to handle success side-effect ---
  useEffect(() => {
    if (userProfile) {
      setUser(userProfile); // Update the global state
    }
  }, [userProfile, setUser]);
  // --- END NEW ---

  const userRole = user?.role?.name;

  // --- FIX: Show main loader if we are fetching the user ---
  if (isLoadingUser || !user) {
    return (
      <DashboardLayout>
        <DashboardLoading />
      </DashboardLayout>
    );
  }
  // --- END FIX ---

  return (
    <DashboardLayout>
      <Suspense fallback={<DashboardLoading />}>
        {getRoleDashboard(userRole)}
      </Suspense>
    </DashboardLayout>
  );
};

export default PermitPage;

