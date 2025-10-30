// FILE: client/src/modules/permit/components/widgets/CreatePermitWidget.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/authStore';

const CreatePermitWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userRole = user?.role?.name;

  // Determine the correct permit name based on role
  let permitName = '';
  if (userRole === 'SSE-Maintenance - MW') {
    permitName = 'Height Permit';
  } else if (userRole === 'SSE-Maintenance - Substation') {
    permitName = 'Electrical Permit';
  } else {
    permitName = 'Permit'; // Fallback
  }

  return (
    <Card className="bg-primary text-primary-foreground h-full">
      <CardHeader>
        <CardTitle>Create New Permit</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Start a new {permitName} request for your work.</p>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => navigate('/permits/new')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create {permitName}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreatePermitWidget;