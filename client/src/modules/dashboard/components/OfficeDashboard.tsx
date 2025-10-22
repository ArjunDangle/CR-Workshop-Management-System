import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const OfficeDashboard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Office Dashboard</CardTitle>
        <CardDescription>Overview for SSE-Office Staff</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Office-specific content goes here...</p>
        {/* Add widgets, forms relevant to office tasks */}
      </CardContent>
    </Card>
  );
};

export default OfficeDashboard;