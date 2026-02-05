import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/modules/auth/authStore';
import { getUserRoleVariant } from '@/lib/utils'; // Import helper
import { SSEOfficeContractorDashboard } from '../components/dashboards/SSEOfficeContractorDashboard';
import { SafetyOfficerContractorDashboard } from '../components/dashboards/SafetyOfficerContractorDashboard';
import { SSEMaintenanceContractorDashboard } from '../components/dashboards/SSEMaintenanceContractorDashboard';

const ContractorPage: React.FC = () => {
  const { user } = useAuthStore();
  const roleKey = getUserRoleVariant(user); // Normalize role

  const renderDashboard = () => {
    switch (roleKey) {
      case 'sse-office':
        return <SSEOfficeContractorDashboard />;
      
      case 'safety-officer':
        return <SafetyOfficerContractorDashboard />;
      
      case 'sse-maintenance':
        // Now this will correctly match for "SSE-Maintenance - MW" etc.
        return <SSEMaintenanceContractorDashboard />;
      
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

export default ContractorPage;