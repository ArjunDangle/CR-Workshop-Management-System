import React from 'react'; // --- Removed Suspense
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, FileCheck, History, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/authStore';

// --- Import our REAL widgets ---
import PermitListWidget from '../widgets/PermitListWidget'; // --- FIX: Added import
import StatCardWidget from '../widgets/StatCardWidget'; // --- FIX: Added import
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

  if (!user) {
    return <WidgetLoading />;
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Permit Dashboard</h1>
      
      {/* Grid for widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Row 1: The main TO-DO list */}
        {/* --- FIX: Removed Suspense wrapper --- */}
        <PermitListWidget
          title="Permits Awaiting My Authorization"
          queryKey="pending_authorization_permits"
          statusFilter={['Pending Authorization']}
          filterByCurrentUser={false} // Show all permits for this status
          noPermitsMessage="No permits are currently awaiting your authorization."
          className="lg:col-span-2"
        />
        
        {/* Row 1: Stats */}
        <div className="space-y-6">
          <StatCardWidget
            title="Awaiting My Authorization"
            value="5" // Placeholder value
            icon={FileCheck}
            className="bg-yellow-100 text-yellow-800"
          />
          <StatCardWidget
            title="Awaiting Safety Approval"
            value="12" // Placeholder value
            icon={BarChart3}
            className="bg-orange-100 text-orange-800"
          />
        </div>
        
        {/* Row 2: History/Done list */}
        <PermitListWidget
          title="Recently Authorized"
          queryKey={`authorized_permits_${user.id}`}
          // This is tricky. We'd need a "filterByAuthorizer" prop.
          // For now, let's just show all "Pending Approval".
          statusFilter={['Pending Approval']}
          filterByCurrentUser={false}
          noPermitsMessage="No permits are currently pending safety approval."
          className="lg:col-span-3" // Make it full-width for this row
        />
        {/* --- END FIX --- */}
      </div>
    </div>
  );
};

export default SSEOfficePermitDashboard;
