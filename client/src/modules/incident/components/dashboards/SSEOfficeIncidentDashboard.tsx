// FILE: client/src/modules/incident/components/dashboards/SSEOfficeIncidentDashboard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, FileText, Users, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getIncidents, getIncidentStats, IncidentStatus, IncidentSeverity } from '../../api';

export const SSEOfficeIncidentDashboard: React.FC = () => {
  const { data: incidents =[], isLoading: incidentsLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => getIncidents(),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['incident-stats'],
    queryFn: () => getIncidentStats(),
  });

  const incidentsByStatus = {
    [IncidentStatus.OPEN]: incidents.filter(i => i.status === IncidentStatus.OPEN),
    [IncidentStatus.INVESTIGATING]: incidents.filter(i => i.status === IncidentStatus.INVESTIGATING || i.status === IncidentStatus.INVESTIGATION_PENDING),[IncidentStatus.CAPA_PENDING]: incidents.filter(i => i.status === IncidentStatus.CAPA_PENDING),
    [IncidentStatus.CLOSED]: incidents.filter(i => i.status === IncidentStatus.CLOSED),
  };

  const recentIncidents = incidents.slice(0, 5);

  const getSeverityColor = (severity: IncidentSeverity) => {
    switch (severity) {
      case IncidentSeverity.MINOR: return 'bg-yellow-100 text-yellow-800';
      case IncidentSeverity.MAJOR: return 'bg-red-100 text-red-800';
      case IncidentSeverity.FATAL: return 'bg-black text-white';
      case IncidentSeverity.CRITICAL: return 'bg-red-600 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2" /><div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /></CardContent></Card>
          ))
        ) : stats ? (
          <>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Total Incidents</p><p className="text-2xl font-bold text-gray-900">{stats.total_incidents || 0}</p></div><FileText className="h-8 w-8 text-blue-500" /></div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Open Incidents</p><p className="text-2xl font-bold text-gray-900">{stats.open_incidents}</p></div><BarChart3 className="h-8 w-8 text-red-500" /></div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Days Without Accident</p><p className="text-2xl font-bold text-gray-900">{stats.days_without_accident}</p></div><TrendingUp className="h-8 w-8 text-green-500" /></div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Pending CAPAs</p><p className="text-2xl font-bold text-gray-900">{stats.pending_capas}</p></div><Users className="h-8 w-8 text-orange-500" /></div></CardContent></Card>
          </>
        ) : null}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg font-semibold">Incident Status Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(incidentsByStatus).map(([status, incidents]) => (
              <div key={status} className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{incidents.length}</p>
                <p className="text-sm text-gray-600">{status.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg font-semibold">Recent Incidents</CardTitle></CardHeader>
        <CardContent>
          {incidentsLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => (<div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />))}</div>
          ) : recentIncidents.length === 0 ? (
            <div className="text-center py-8 text-gray-500"><p>No recent incidents</p></div>
          ) : (
            <div className="space-y-3">
              {recentIncidents.map((incident) => (
                <div key={incident.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-sm">{incident.title}</p>
                    <p className="text-xs text-gray-500">{incident.location_details}</p>
                  </div>
                  <Badge className={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};