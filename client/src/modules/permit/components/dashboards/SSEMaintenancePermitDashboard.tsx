import React from 'react'; // --- Removed Suspense
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/authStore';

// --- Import our REAL widgets ---
import CreatePermitWidget from '../widgets/CreatePermitWidget';
import PermitListWidget from '../widgets/PermitListWidget'; // --- FIX: Added import
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

  // We must ensure the user object is loaded before rendering lists
  if (!user) {
    return <WidgetLoading />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Permit Dashboard</h1>
      
      {/* Grid for widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Row 1: Create + Active */}
        <CreatePermitWidget />
        
        {/* --- FIX: Removed Suspense wrapper --- */}
        <PermitListWidget
          title="My Active & Approved Permits"
          queryKey={`active_permits_${user.id}`}
          statusFilter={['Active', 'Approved']}
          filterByCurrentUser={true}
          noPermitsMessage="You have no active or approved permits."
        />
        
        {/* Row 2: Pending */}
        <PermitListWidget
          title="My Pending Permits"
          queryKey={`pending_permits_${user.id}`}
          statusFilter={['Pending Authorization', 'Pending Approval']}
          filterByCurrentUser={true}
          noPermitsMessage="You have no permits awaiting approval."
          className="lg:col-span-2"
        />
        
        {/* Row 3: History */}
        <PermitListWidget
          title="My Permit History"
          queryKey={`history_permits_${user.id}`}
          statusFilter={['Closed', 'Expired', 'Rejected']}
          filterByCurrentUser={true}
          noPermitsMessage="You have no permit history."
          className="lg:col-span-2"
        />
        {/* --- END FIX --- */}
      </div>
    </div>
  );
};

export default SSEMaintenancePermitDashboard;
