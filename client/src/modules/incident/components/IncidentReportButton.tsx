// client/src/modules/incident/components/IncidentReportButton.tsx
import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportIncidentDialog } from './ReportIncidentDialog';

interface IncidentReportButtonProps {
  variant?: 'default' | 'emergency';
}

export const IncidentReportButton: React.FC<IncidentReportButtonProps> = ({ 
  variant = 'default' 
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (variant === 'emergency') {
    return (
      <>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg"
          size="default"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          REPORT INCIDENT
        </Button>
        <ReportIncidentDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen} 
        />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        variant="outline"
        size="default"
        className="font-medium"
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Report Issue
      </Button>
      <ReportIncidentDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </>
  );
};
