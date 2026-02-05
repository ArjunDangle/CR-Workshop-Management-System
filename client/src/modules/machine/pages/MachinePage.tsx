import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/modules/auth/authStore';
import { getUserRoleVariant } from '@/lib/utils'; // Import helper
import { SSEMaintenanceMachineDashboard } from '../components/dashboards/SSEMaintenanceMachineDashboard';
import { SafetyOfficerMachineDashboard } from '../components/dashboards/SafetyOfficerMachineDashboard';

const MachinePage: React.FC = () => {
  const { user } = useAuthStore();
  const roleKey = getUserRoleVariant(user);

  const renderDashboard = () => {
    switch (roleKey) {
      case 'sse-maintenance':
        return <SSEMaintenanceMachineDashboard />;
      
      case 'safety-officer':
        return <SafetyOfficerMachineDashboard />;
      
      case 'sse-office':
        // SSE-Office gets a view-only version similar to maintenance
        return <SSEMaintenanceMachineDashboard />;
      
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Access Restricted
            </h2>
            <p className="text-gray-600">
              Your role ({user?.role?.name}) does not have access to this module.
            </p>
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      {renderDashboard()}
    </DashboardLayout>
  );
};

export default MachinePage;