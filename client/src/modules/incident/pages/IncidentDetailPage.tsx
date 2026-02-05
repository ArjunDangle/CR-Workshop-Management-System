// client/src/modules/incident/pages/IncidentDetailPage.tsx
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import IncidentDetail from '../components/IncidentDetail';

const IncidentDetailPage: React.FC = () => {
  return (
    <DashboardLayout>
      <IncidentDetail />
    </DashboardLayout>
  );
};

export default IncidentDetailPage;
