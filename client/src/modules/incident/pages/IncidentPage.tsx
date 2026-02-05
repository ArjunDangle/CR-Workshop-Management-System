// client/src/modules/incident/pages/IncidentPage.tsx
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { InvestigationBoard } from '../components/InvestigationBoard';

const IncidentPage: React.FC = () => {
  return (
    <DashboardLayout>
      <InvestigationBoard />
    </DashboardLayout>
  );
};

export default IncidentPage;
