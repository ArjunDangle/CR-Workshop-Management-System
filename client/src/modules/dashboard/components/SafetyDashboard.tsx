import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const SafetyDashboard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Safety Dashboard</CardTitle>
        <CardDescription>Overview for Safety Officers</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Safety-specific content goes here...</p>
        {/* Add widgets, reports relevant to safety */}
      </CardContent>
    </Card>
  );
};

export default SafetyDashboard;