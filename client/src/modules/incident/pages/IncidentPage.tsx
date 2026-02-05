// client/src/modules/incident/pages/IncidentPage.tsx
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/modules/auth/authStore';
import { InvestigationBoard } from '../components/dashboards/InvestigationBoard';
import { SSEMaintenanceIncidentDashboard } from '../components/dashboards/SSEMaintenanceIncidentDashboard';
import { SSEOfficeIncidentDashboard } from '../components/dashboards/SSEOfficeIncidentDashboard';

const IncidentPage: React.FC = () => {
  const { user } = useAuthStore();

  // Polymorphic dashboard based on user role
  const renderDashboard = () => {
    const userRole = user?.role?.id;

    switch (userRole) {
      case 'safety-officer':
        return <InvestigationBoard />;
      
      case 'sse-maintenance':
        return <SSEMaintenanceIncidentDashboard />;
      
      case 'sse-office':
        return <SSEOfficeIncidentDashboard />;
      
      default:
        // Default view for unauthenticated or other roles
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Incident Management
            </h2>
            <p className="text-gray-600">
              Please log in with appropriate role to access incident management features.
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
