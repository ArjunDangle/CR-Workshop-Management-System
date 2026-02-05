import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, FileCheck, History, BarChart3 } from 'lucide-react';
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

const SSEOfficePermitDashboard = () => {
  const { user } = useAuthStore();

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Row 1 Left: The main TO-DO list */}
        <div className="lg:col-span-2">
            <ErrorBoundary fallbackTitle="Authorization List Error" onReset={handleRetry}>
                <PermitListWidget
                title="Permits Awaiting My Authorization"
                queryKey="pending_authorization_permits"
                statusFilter={['Pending Authorization']}
                filterByCurrentUser={false}
                noPermitsMessage="No permits are currently awaiting your authorization."
                className="h-full"
                />
            </ErrorBoundary>
        </div>
        
        {/* Row 1 Right: Stats */}
        <div className="space-y-6">
          <ErrorBoundary fallbackTitle="Stat Error">
            <StatCardWidget
                title="Awaiting My Authorization"
                value="5" 
                icon={FileCheck}
                className="bg-yellow-100 text-yellow-800"
            />
          </ErrorBoundary>
          
          <ErrorBoundary fallbackTitle="Stat Error">
            <StatCardWidget
                title="Awaiting Safety Approval"
                value="12" 
                icon={BarChart3}
                className="bg-orange-100 text-orange-800"
            />
          </ErrorBoundary>
        </div>
        
        {/* Row 2: History/Done list */}
        <div className="lg:col-span-3">
            <ErrorBoundary fallbackTitle="Recent History Error" onReset={handleRetry}>
                <PermitListWidget
                title="Recently Authorized"
                queryKey={`authorized_permits_${user.id}`}
                statusFilter={['Pending Approval']}
                filterByCurrentUser={false}
                noPermitsMessage="No permits are currently pending safety approval."
                className="w-full"
                />
            </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default SSEOfficePermitDashboard;