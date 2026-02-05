// client/src/modules/contractor/pages/ContractorPage.tsx
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/modules/auth/authStore';
import { SSEOfficeContractorDashboard } from '../components/dashboards/SSEOfficeContractorDashboard';
import { SafetyOfficerContractorDashboard } from '../components/dashboards/SafetyOfficerContractorDashboard';
import { SSEMaintenanceContractorDashboard } from '../components/dashboards/SSEMaintenanceContractorDashboard';

const ContractorPage: React.FC = () => {
  const { user } = useAuthStore();

  // Polymorphic dashboard based on user role
  const renderDashboard = () => {
    const userRole = user?.role?.id;

    switch (userRole) {
      case 'sse-office':
        return <SSEOfficeContractorDashboard />;
      
      case 'safety-officer':
        return <SafetyOfficerContractorDashboard />;
      
      case 'sse-maintenance':
        return <SSEMaintenanceContractorDashboard />;
      
      default:
        // Default view for unauthenticated or other roles
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Contractor Management
            </h2>
            <p className="text-gray-600">
              Please log in with appropriate role to access contractor management features.
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

export default ContractorPage;