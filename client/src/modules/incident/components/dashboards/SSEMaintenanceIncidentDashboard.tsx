// FILE: client/src/modules/incident/components/dashboards/SSEMaintenanceIncidentDashboard.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus, Clock, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getIncidents, IncidentStatus, IncidentSeverity } from '../../api';
import { ReportIncidentDialog } from '../widgets/ReportIncidentDialog';

export const SSEMaintenanceIncidentDashboard: React.FC = () => {
  const[reportDialogOpen, setReportDialogOpen] = useState(false);

  const { data: incidents =[], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => getIncidents(),
  });

  const maintenanceIncidents = incidents.filter(incident => 
    incident.machine_id || 
    incident.category === 'UNSAFE_CONDITION' ||
    incident.severity === IncidentSeverity.MAJOR ||
    incident.severity === IncidentSeverity.FATAL ||
    incident.severity === IncidentSeverity.CRITICAL
  );

  const recentIncidents = maintenanceIncidents.slice(0, 5);

  const getSeverityColor = (severity: IncidentSeverity) => {
    switch (severity) {
      case IncidentSeverity.MINOR: return 'bg-yellow-100 text-yellow-800';
      case IncidentSeverity.MAJOR: return 'bg-red-100 text-red-800';
      case IncidentSeverity.FATAL: return 'bg-black text-white';
      case IncidentSeverity.CRITICAL: return 'bg-red-600 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: IncidentStatus) => {
    switch (status) {
      case IncidentStatus.OPEN: return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case IncidentStatus.INVESTIGATING:
      case IncidentStatus.INVESTIGATION_PENDING: return <Clock className="h-4 w-4 text-blue-500" />;
      case IncidentStatus.CLOSED: return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card><CardHeader><CardTitle className="text-lg font-semibold">Quick Actions</CardTitle></CardHeader><CardContent><div className="flex gap-4"><Button onClick={() => setReportDialogOpen(true)} className="bg-red-600 hover:bg-red-700"><Plus className="h-4 w-4 mr-2" />Report Incident</Button></div></CardContent></Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Incidents</CardTitle>
          <p className="text-sm text-gray-600">Incidents affecting maintenance operations</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => (<div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />))}</div>
          ) : recentIncidents.length === 0 ? (
            <div className="text-center py-8 text-gray-500"><AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" /><p>No recent incidents</p></div>
          ) : (
            <div className="space-y-3">
              {recentIncidents.map((incident) => (
                <div key={incident.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(incident.status)}
                    <div>
                      <p className="font-medium text-sm">{incident.title}</p>
                      <p className="text-xs text-gray-500">{incident.location_details}</p>
                    </div>
                  </div>
                  <Badge className={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <ReportIncidentDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} />
    </div>
  );
};