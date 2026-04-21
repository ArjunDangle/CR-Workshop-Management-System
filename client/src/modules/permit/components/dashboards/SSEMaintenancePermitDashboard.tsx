// FILE: client/src/modules/permit/components/dashboards/SSEMaintenancePermitDashboard.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/authStore';
import { ErrorBoundary } from '@/components/common/ErrorBoundary'; 

import CreatePermitWidget from '../widgets/CreatePermitWidget';
import PermitListWidget from '../widgets/PermitListWidget';

const WidgetLoading = () => (
  <Card><CardContent className="flex justify-center items-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent></Card>
);

const SSEMaintenancePermitDashboard = () => {
  const { user } = useAuthStore();
  const handleRetry = () => window.location.reload(); 

  if (!user) return <WidgetLoading />;

  return (
    <div className="space-y-6 pb-12 max-w-full overflow-x-hidden">
      <div>
         <h1 className="text-3xl font-bold tracking-tight text-gray-900">Maintenance Permit Dashboard</h1>
         <p className="text-gray-500 mt-1">Manage your active work permits and history.</p>
      </div>
      
      {/* Horizontal Banner */}
      <ErrorBoundary fallbackTitle="Create Widget Error">
          <CreatePermitWidget />
      </ErrorBoundary>
      
      {/* Vertically Stacked Lists */}
      <div className="space-y-6">
        <ErrorBoundary fallbackTitle="Active List Error" onReset={handleRetry}>
            <PermitListWidget
            title="My Active & Approved Permits"
            queryKey={`active_permits_${user.id}`}
            statusFilter={['Active', 'Approved']}
            filterByCurrentUser={true}
            noPermitsMessage="You have no active or approved permits right now."
            />
        </ErrorBoundary>
        
        <ErrorBoundary fallbackTitle="Pending List Error" onReset={handleRetry}>
            <PermitListWidget
            title="My Pending Permits"
            queryKey={`pending_permits_${user.id}`}
            statusFilter={['Pending Authorization', 'Pending Approval']}
            filterByCurrentUser={true}
            noPermitsMessage="You have no permits awaiting approval."
            />
        </ErrorBoundary>
        
        <ErrorBoundary fallbackTitle="History Load Error" onReset={handleRetry}>
            <PermitListWidget
            title="My Permit History"
            queryKey={`history_permits_${user.id}`}
            statusFilter={['Closed', 'Expired', 'Rejected']}
            filterByCurrentUser={true}
            noPermitsMessage="You have no permit history."
            />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default SSEMaintenancePermitDashboard;