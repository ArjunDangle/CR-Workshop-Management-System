import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ClipboardCheck, ShieldAlert, History, BarChartHorizontal } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/authStore';
import { ErrorBoundary } from '@/components/common/ErrorBoundary'; // Import ErrorBoundary

// --- Import our REAL widgets ---
import PermitListWidget from '../widgets/PermitListWidget';
import StatCardWidget from '../widgets/StatCardWidget';
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

const SafetyOfficerPermitDashboard = () => {
  const { user } = useAuthStore();

  if (!user) {
    return <WidgetLoading />;
  }
  
  // Define a generic reset handler (could be improved to refetch queries)
  const handleRetry = () => {
    window.location.reload(); // Simple reload for now, or use QueryClient invalidate
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Permit Dashboard</h1>
      
      {/* Grid for widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Row 1: Stats */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-6">
          <ErrorBoundary fallbackTitle="Stats Failed">
            <StatCardWidget
                title="Pending My Approval"
                value="2" 
                icon={ShieldAlert}
            />
          </ErrorBoundary>
          <ErrorBoundary fallbackTitle="Stats Failed">
            <StatCardWidget
                title="Total Active Permits"
                value="3" 
                icon={ClipboardCheck}
            />
          </ErrorBoundary>
          <ErrorBoundary fallbackTitle="Stats Failed">
            <StatCardWidget
                title="Pending Office Auth"
                value="5" 
                icon={BarChartHorizontal}
            />
          </ErrorBoundary>
          <ErrorBoundary fallbackTitle="Stats Failed">
            <StatCardWidget
                title="Expired Today"
                value="1" 
                icon={History}
            />
          </ErrorBoundary>
        </div>
        
        {/* Row 2: To-Do List + Live View */}
        <div className="lg:col-span-2">
            <ErrorBoundary fallbackTitle="Approval List Error" onReset={handleRetry}>
                <PermitListWidget
                title="Permits Awaiting My Approval"
                queryKey="pending_approval_permits"
                statusFilter={['Pending Approval']}
                filterByCurrentUser={false}
                noPermitsMessage="No permits are currently awaiting your approval."
                />
            </ErrorBoundary>
        </div>

        <div className="lg:col-span-1">
            <ErrorBoundary fallbackTitle="Live List Error" onReset={handleRetry}>
                <PermitListWidget
                title="Live Active Permits"
                queryKey="active_permits"
                statusFilter={['Active']}
                filterByCurrentUser={false}
                noPermitsMessage="No permits are currently active."
                />
            </ErrorBoundary>
        </div>

        {/* Row 3: Master History Log */}
        <div className="lg:col-span-3">
            <ErrorBoundary fallbackTitle="History Load Error" onReset={handleRetry}>
                <PermitListWidget
                title="Master Permit History"
                queryKey="all_permit_history"
                statusFilter={['Closed', 'Expired', 'Rejected']}
                filterByCurrentUser={false}
                noPermitsMessage="No permit history found."
                />
            </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default SafetyOfficerPermitDashboard;