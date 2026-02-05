import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/modules/auth/authStore';
import { getUserRoleVariant } from '@/lib/utils'; // Import helper
import { InvestigationBoard } from '../components/dashboards/InvestigationBoard';
import { SSEMaintenanceIncidentDashboard } from '../components/dashboards/SSEMaintenanceIncidentDashboard';
import { SSEOfficeIncidentDashboard } from '../components/dashboards/SSEOfficeIncidentDashboard';

const IncidentPage: React.FC = () => {
  const { user } = useAuthStore();
  const roleKey = getUserRoleVariant(user);

  const renderDashboard = () => {
    switch (roleKey) {
      case 'safety-officer':
        return <InvestigationBoard />;
      
      case 'sse-maintenance':
        return <SSEMaintenanceIncidentDashboard />;
      
      case 'sse-office':
        return <SSEOfficeIncidentDashboard />;
      
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

export default IncidentPage;