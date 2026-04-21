// FILE: client/src/modules/permit/components/widgets/CreatePermitWidget.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/authStore';

const CreatePermitWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userRole = user?.role?.name;

  let permitName = '';
  if (userRole === 'SSE-Maintenance - MW') permitName = 'Height Permit';
  else if (userRole === 'SSE-Maintenance - Substation') permitName = 'Electrical Permit';
  else permitName = 'Permit'; 

  return (
    <Card className="bg-blue-600 text-white border-0 shadow-md">
      <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Create New {permitName}</h2>
          <p className="text-blue-100 mt-1 opacity-90">Start a new safety authorization request for your upcoming work.</p>
        </div>
        <Button
          size="lg"
          className="bg-white text-blue-700 hover:bg-gray-50 whitespace-nowrap font-bold"
          onClick={() => navigate('/permits/new')}
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Draft {permitName}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreatePermitWidget;