import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/authStore';
import { ErrorBoundary } from '@/components/common/ErrorBoundary'; // Import ErrorBoundary

// --- Import our REAL widgets ---
import CreatePermitWidget from '../widgets/CreatePermitWidget';
import PermitListWidget from '../widgets/PermitListWidget';
// ---

// Loading component for the list widgets
const WidgetLoading = () => (
  <Card>
    <CardContent className="flex justify-center items-center h-48">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </CardContent>
  </Card>
);

// --- Main Dashboard Component ---

const SSEMaintenancePermitDashboard = () => {
  const { user } = useAuthStore();

  // Define a generic reset handler
  const handleRetry = () => {
    window.location.reload(); 
  };

  if (!user) {
    return <WidgetLoading />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Permit Dashboard</h1>
      
      {/* Grid for widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Row 1: Create + Active */}
        <ErrorBoundary fallbackTitle="Create Widget Error">
            <CreatePermitWidget />
        </ErrorBoundary>
        
        <ErrorBoundary fallbackTitle="Active List Error" onReset={handleRetry}>
            <PermitListWidget
            title="My Active & Approved Permits"
            queryKey={`active_permits_${user.id}`}
            statusFilter={['Active', 'Approved']}
            filterByCurrentUser={true}
            noPermitsMessage="You have no active or approved permits."
            />
        </ErrorBoundary>
        
        {/* Row 2: Pending */}
        <div className="lg:col-span-2">
            <ErrorBoundary fallbackTitle="Pending List Error" onReset={handleRetry}>
                <PermitListWidget
                title="My Pending Permits"
                queryKey={`pending_permits_${user.id}`}
                statusFilter={['Pending Authorization', 'Pending Approval']}
                filterByCurrentUser={true}
                noPermitsMessage="You have no permits awaiting approval."
                className="w-full" // Ensure full width inside the wrapper
                />
            </ErrorBoundary>
        </div>
        
        {/* Row 3: History */}
        <div className="lg:col-span-2">
            <ErrorBoundary fallbackTitle="History Load Error" onReset={handleRetry}>
                <PermitListWidget
                title="My Permit History"
                queryKey={`history_permits_${user.id}`}
                statusFilter={['Closed', 'Expired', 'Rejected']}
                filterByCurrentUser={true}
                noPermitsMessage="You have no permit history."
                className="w-full"
                />
            </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default SSEMaintenancePermitDashboard;