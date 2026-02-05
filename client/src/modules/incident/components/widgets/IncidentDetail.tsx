// client/src/modules/incident/components/IncidentDetail.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Phone,
  Wrench,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  getIncidentById,
  getCAPAsByIncidentId,
  updateCAPAStatus,
  Incident,
  CAPA,
  CAPAStatus,
} from '../../api';

interface TimelineEvent {
  time: string;
  title: string;
  description: string;
  type: 'system' | 'user' | 'action';
}

const IncidentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('timeline');

  const { data: incident, isLoading: incidentLoading } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => getIncidentById(id!),
    enabled: !!id,
  });

  const { data: capas = [], isLoading: capasLoading } = useQuery({
    queryKey: ['incident-capas', id],
    queryFn: () => getCAPAsByIncidentId(id!),
    enabled: !!id,
  });

  const capaStatusMutation = useMutation({
    mutationFn: ({ capaId, status }: { capaId: string; status: CAPAStatus }) =>
      updateCAPAStatus(capaId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident-capas', id] });
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
    },
  });

  const handleCAPAToggle = (capa: CAPA) => {
    const newStatus =
      capa.status === CAPAStatus.COMPLETED
        ? CAPAStatus.IN_PROGRESS
        : CAPAStatus.COMPLETED;
    capaStatusMutation.mutate({ capaId: capa.id, status: newStatus });
  };

  if (incidentLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Incident not found</p>
        <Button onClick={() => navigate('/incidents')} className="mt-4">
          Back to Incidents
        </Button>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'MINOR':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'MAJOR':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'FATAL':
        return 'bg-black text-white border-black';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Build timeline events
  const timelineEvents: TimelineEvent[] = [
    {
      time: format(new Date(incident.incident_date), 'h:mm a'),
      title: 'Accident Reported',
      description: `Reported by ${incident.reported_by}`,
      type: 'user',
    },
    {
      time: format(new Date(incident.created_at), 'h:mm a'),
      title: 'SYSTEM LOCKDOWN Triggered',
      description:
        incident.severity === 'MAJOR' || incident.severity === 'FATAL'
          ? 'Automatic safety measures activated'
          : 'No automatic lockdown (minor incident)',
      type: 'system',
    },
    ...(incident.status === 'INVESTIGATION' || incident.status === 'CAPA_PENDING'
      ? [
          {
            time: format(new Date(incident.updated_at), 'h:mm a'),
            title: 'Investigation Started',
            description: 'Assigned to investigation officer',
            type: 'action',
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/incidents')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{incident.title}</h1>
          <p className="text-gray-600 mt-1">
            Incident #{incident.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Metadata */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Date & Time</p>
                    <p className="font-medium">
                      {format(new Date(incident.incident_date), 'MMM dd, yyyy h:mm a')}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{incident.location}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Reported By</p>
                    <p className="font-medium">{incident.reported_by}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Contact</p>
                    <p className="font-medium">{incident.contact_number}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-gray-600 mb-2">Severity</p>
                  <Badge className={cn('text-sm', getSeverityColor(incident.severity))}>
                    {incident.severity}
                  </Badge>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-gray-600 mb-2">Status</p>
                  <Badge variant="outline" className="text-sm">
                    {incident.status.replace('_', ' ')}
                  </Badge>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-gray-600 mb-2">Category</p>
                  <Badge variant="secondary" className="text-sm">
                    {incident.category.replace('_', ' ')}
                  </Badge>
                </div>

                {incident.machine && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Wrench className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Machine</p>
                        <p className="font-medium">
                          {incident.machine.asset_id || incident.machine_id}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {incident.permit && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Permit</p>
                        <p className="font-medium">
                          {incident.permit.permit_no || incident.permit_id}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {incident.contractor && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Contractor</p>
                        <p className="font-medium">
                          {incident.contractor.company_name || incident.contractor_id}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Tabs */}
        <div className="lg:col-span-2">
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardHeader>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="investigation">Investigation</TabsTrigger>
                  <TabsTrigger value="capa">CAPA Tracker</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                {/* Timeline Tab */}
                <TabsContent value="timeline" className="space-y-4">
                  <div className="space-y-4">
                    {timelineEvents.map((event, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              'h-3 w-3 rounded-full',
                              event.type === 'system' && 'bg-red-500',
                              event.type === 'user' && 'bg-blue-500',
                              event.type === 'action' && 'bg-green-500'
                            )}
                          />
                          {index < timelineEvents.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-300 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{event.time}</span>
                            <span className="font-medium">{event.title}</span>
                          </div>
                          <p className="text-sm text-gray-600">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3">Description</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {incident.description}
                    </p>
                  </div>
                </TabsContent>

                {/* Investigation Tab */}
                <TabsContent value="investigation" className="space-y-4">
                  {incident.status === 'OPEN' ? (
                    <div className="text-center py-12 text-gray-500">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Investigation not yet started</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-4">Root Cause Analysis (4M Method)</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Man</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-gray-600">
                                Human error, lack of training, fatigue
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Machine</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-gray-600">
                                Mechanical failure, guard missing
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Method</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-gray-600">
                                SOP not followed, wrong procedure
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Material</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-gray-600">
                                Defective tools, poor quality PPE
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-3">Findings</h3>
                        <Card>
                          <CardContent className="p-4">
                            <p className="text-sm text-gray-700">
                              Investigation findings will be displayed here once submitted.
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-3">Evidence</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                            Photo Gallery
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* CAPA Tracker Tab */}
                <TabsContent value="capa" className="space-y-4">
                  {capasLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : capas.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No CAPA items yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {capas.map((capa) => {
                        const isCompleted = capa.status === CAPAStatus.COMPLETED;
                        const isOverdue =
                          capa.status !== CAPAStatus.COMPLETED &&
                          new Date(capa.due_date) < new Date();

                        return (
                          <Card
                            key={capa.id}
                            className={cn(
                              'transition-all',
                              isCompleted && 'opacity-75'
                            )}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={isCompleted}
                                  onCheckedChange={() => handleCAPAToggle(capa)}
                                  disabled={capaStatusMutation.isPending}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4
                                      className={cn(
                                        'font-medium',
                                        isCompleted && 'line-through text-gray-500'
                                      )}
                                    >
                                      {capa.title}
                                    </h4>
                                    <Badge
                                      variant={
                                        isCompleted
                                          ? 'default'
                                          : isOverdue
                                          ? 'destructive'
                                          : 'secondary'
                                      }
                                      className="text-xs"
                                    >
                                      {capa.status}
                                    </Badge>
                                  </div>
                                  <p
                                    className={cn(
                                      'text-sm text-gray-600 mb-2',
                                      isCompleted && 'line-through'
                                    )}
                                  >
                                    {capa.description}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      <span>{capa.assigned_to}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>
                                        Due: {format(new Date(capa.due_date), 'MMM dd, yyyy')}
                                      </span>
                                    </div>
                                    {capa.completed_date && (
                                      <div className="flex items-center gap-1 text-green-600">
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span>
                                          Completed:{' '}
                                          {format(new Date(capa.completed_date), 'MMM dd, yyyy')}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetail;
