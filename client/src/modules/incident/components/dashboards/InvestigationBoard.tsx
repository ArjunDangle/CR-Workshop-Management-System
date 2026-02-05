// client/src/modules/incident/components/InvestigationBoard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle2,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  getIncidents,
  getIncidentStats,
  Incident,
  IncidentStatus,
  IncidentSeverity,
} from '../../api';

interface IncidentCardProps {
  incident: Incident;
  onClick: () => void;
}

const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onClick }) => {
  const getSeverityColor = (severity: IncidentSeverity) => {
    switch (severity) {
      case IncidentSeverity.MINOR:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case IncidentSeverity.MAJOR:
        return 'bg-red-100 text-red-800 border-red-300';
      case IncidentSeverity.FATAL:
        return 'bg-black text-white border-black';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusBorderColor = (status: IncidentStatus) => {
    switch (status) {
      case IncidentStatus.OPEN:
        return 'border-l-4 border-l-red-500';
      case IncidentStatus.INVESTIGATION:
        return 'border-l-4 border-l-blue-500';
      case IncidentStatus.CAPA_PENDING:
        return 'border-l-4 border-l-orange-500';
      case IncidentStatus.CLOSED:
        return 'border-l-4 border-l-green-500 opacity-75';
      default:
        return 'border-l-4 border-l-gray-500';
    }
  };

  const timeAgo = formatDistanceToNow(new Date(incident.incident_date), { addSuffix: true });
  const incidentCode = `#INC-${incident.id.slice(0, 8).toUpperCase()}`;

  // Calculate CAPA progress if available
  const capaProgress = incident.capas
    ? incident.capas.length > 0
      ? (incident.capas.filter(c => c.status === 'COMPLETED').length / incident.capas.length) * 100
      : 0
    : 0;

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow",
        getStatusBorderColor(incident.status)
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-sm text-gray-900">{incidentCode}</div>
              <div className="text-xs text-gray-500 mt-1">{timeAgo}</div>
            </div>
            <Badge className={cn("text-xs", getSeverityColor(incident.severity))}>
              {incident.severity}
            </Badge>
          </div>

          {/* Title */}
          <div className="font-medium text-sm line-clamp-2">{incident.title}</div>

          {/* Location */}
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{incident.location}</span>
          </div>

          {/* Status-specific content */}
          {incident.status === IncidentStatus.INVESTIGATION && (
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <User className="h-3 w-3" />
              <span>Investigation in progress</span>
            </div>
          )}

          {incident.status === IncidentStatus.CAPA_PENDING && incident.capas && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-orange-600">CAPA Progress</span>
                <span className="font-medium">
                  {incident.capas.filter(c => c.status === 'COMPLETED').length} / {incident.capas.length}
                </span>
              </div>
              <Progress value={capaProgress} className="h-2" />
            </div>
          )}

          {incident.status === IncidentStatus.CLOSED && (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              <span>Resolved</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const InvestigationBoard: React.FC = () => {
  const navigate = useNavigate();

  const { data: incidents = [], isLoading: incidentsLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => getIncidents(),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['incident-stats'],
    queryFn: () => getIncidentStats(),
  });

  const incidentsByStatus = {
    [IncidentStatus.OPEN]: incidents.filter(i => i.status === IncidentStatus.OPEN),
    [IncidentStatus.INVESTIGATION]: incidents.filter(i => i.status === IncidentStatus.INVESTIGATION),
    [IncidentStatus.CAPA_PENDING]: incidents.filter(i => i.status === IncidentStatus.CAPA_PENDING),
    [IncidentStatus.CLOSED]: incidents.filter(i => i.status === IncidentStatus.CLOSED),
  };

  const statusColumns = [
    {
      status: IncidentStatus.OPEN,
      title: 'New / Triage',
      color: 'text-red-600',
    },
    {
      status: IncidentStatus.INVESTIGATION,
      title: 'Investigation',
      color: 'text-blue-600',
    },
    {
      status: IncidentStatus.CAPA_PENDING,
      title: 'CAPA Pending',
      color: 'text-orange-600',
    },
    {
      status: IncidentStatus.CLOSED,
      title: 'Closed',
      color: 'text-green-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Safety Control Center</h1>
        <p className="text-gray-600 mt-1">Monitor and manage safety incidents</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))
        ) : stats ? (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Open Incidents</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.open_incidents}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Days Without Accident</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.days_without_accident}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Major Incidents</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.major_incidents}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending CAPAs</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending_capas}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Kanban Board */}
      {incidentsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-32 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statusColumns.map((column) => {
            const columnIncidents = incidentsByStatus[column.status];
            return (
              <div key={column.status} className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className={cn("text-sm font-semibold", column.color)}>
                      {column.title}
                      <Badge variant="secondary" className="ml-2">
                        {columnIncidents.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {columnIncidents.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No incidents
                      </div>
                    ) : (
                      columnIncidents.map((incident) => (
                        <IncidentCard
                          key={incident.id}
                          incident={incident}
                          onClick={() => navigate(`/incidents/${incident.id}`)}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
