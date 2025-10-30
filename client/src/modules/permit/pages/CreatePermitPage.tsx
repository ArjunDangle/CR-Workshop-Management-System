// FILE: client/src/modules/permit/pages/CreatePermitPage.tsx
import React, { lazy, Suspense } from 'react';
import { useAuthStore } from '@/modules/auth/authStore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// --- Lazy Load the Forms ---
// This is an optimization. We don't load the form code unless the user
// actually needs to see it.
const CreateHeightPermitForm = lazy(() => import('../components/forms/CreateHeightPermitForm'));
const CreateElectricPermitForm = lazy(() => import('../components/forms/CreateElectricPermitForm'));

// Loading component for Suspense
const FormLoading = () => (
  <Card>
    <CardHeader>
      <CardTitle>Loading Form...</CardTitle>
    </CardHeader>
    <CardContent className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </CardContent>
  </Card>
);

const CreatePermitPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const userRole = user?.role?.name;

  const renderForm = () => {
    switch (userRole) {
      case 'SSE-Maintenance - MW':
        return <CreateHeightPermitForm />;
      case 'SSE-Maintenance - Substation':
        return <CreateElectricPermitForm />;
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authorization Error</AlertTitle>
                <AlertDescription>
                  Your user role ({userRole || 'Unknown'}) is not authorized to create new permits.
                </AlertDescription>
              </Alert>
              <Button onClick={() => navigate(-1)} variant="outline" className="mt-4">
                Go Back
              </Button>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Suspense handles the "lazy" loading of our forms */}
      <Suspense fallback={<FormLoading />}>
        {renderForm()}
      </Suspense>
    </div>
  );
};

export default CreatePermitPage;