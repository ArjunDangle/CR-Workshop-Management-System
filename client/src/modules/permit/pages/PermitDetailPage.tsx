import React from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const PermitDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <CardTitle>Permit Details (Placeholder)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Loading details for permita: {id}</p>
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>
            (This page will soon show all permit details and action buttons
            like "Authorize" or "Approve".)
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default PermitDetailPage;
