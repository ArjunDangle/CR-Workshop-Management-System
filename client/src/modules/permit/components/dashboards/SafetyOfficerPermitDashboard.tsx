import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ClipboardCheck, ShieldAlert, History, BarChartHorizontal } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/authStore';

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
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Permit Dashboard</h1>
      
      {/* Grid for widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Row 1: Stats */}
        {/* --- FIX: Removed className props --- */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCardWidget
            title="Pending My Approval"
            value="2" // Placeholder
            icon={ShieldAlert}
          />
          <StatCardWidget
            title="Total Active Permits"
            value="3" // Placeholder
            icon={ClipboardCheck}
          />
          <StatCardWidget
            title="Pending Office Auth"
            value="5" // Placeholder
            icon={BarChartHorizontal}
          />
          <StatCardWidget
            title="Expired Today"
            value="1" // Placeholder
            icon={History}
          />
        </div>
        {/* --- END FIX --- */}
        
        {/* Row 2: To-Do List + Live View */}
        <PermitListWidget
          title="Permits Awaiting My Approval"
          queryKey="pending_approval_permits"
          statusFilter={['Pending Approval']}
          filterByCurrentUser={false}
          noPermitsMessage="No permits are currently awaiting your approval."
          className="lg:col-span-2"
        />

        <PermitListWidget
          title="Live Active Permits"
          queryKey="active_permits"
          statusFilter={['Active']}
          filterByCurrentUser={false}
          noPermitsMessage="No permits are currently active."
          className="lg:col-span-1"
        />

        {/* Row 3: Master History Log */}
        <PermitListWidget
          title="Master Permit History"
          queryKey="all_permit_history"
          statusFilter={['Closed', 'Expired', 'Rejected']}
          filterByCurrentUser={false}
          noPermitsMessage="No permit history found."
          className="lg:col-span-3"
        />
      </div>
    </div>
  );
};

export default SafetyOfficerPermitDashboard;

