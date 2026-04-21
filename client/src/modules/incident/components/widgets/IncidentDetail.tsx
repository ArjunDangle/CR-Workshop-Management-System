// FILE: client/src/modules/incident/components/widgets/IncidentDetail.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import {
  ArrowLeft, Calendar, MapPin, User, Phone, Wrench, FileText,
  CheckCircle2, Clock, AlertTriangle, Building, Loader2, 
  PlusCircle, ShieldCheck, Link as LinkIcon, AlertOctagon, ShieldAlert,
  Users, Edit3
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  getIncidentById,
  getCAPAsByIncidentId,
  updateCAPAStatus,
  Incident,
  CAPA,
  CAPAStatus,
  IncidentSeverity
} from '../../api';

import { useAuthStore } from '@/modules/auth/authStore';

// --- Helper Components ---

const SLATimer = ({ dueAt, resolvedAt }: { dueAt?: string | null, resolvedAt?: string | null }) => {
  const[timeLeft, setTimeLeft] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!dueAt || resolvedAt) return;
    
    const calculateTime = () => {
      const now = new Date();
      const due = new Date(dueAt);
      const hours = differenceInHours(due, now);
      const minutes = differenceInMinutes(due, now) % 60;
      
      if (now > due) {
        setIsOverdue(true);
        setTimeLeft(`Overdue by ${Math.abs(hours)}h ${Math.abs(minutes)}m`);
      } else {
        setIsOverdue(false);
        setTimeLeft(`${hours}h ${minutes}m remaining`);
      }
    };
    
    calculateTime();
    const timer = setInterval(calculateTime, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [dueAt, resolvedAt]);

  if (resolvedAt) return <Badge className="bg-green-500 border-0">Resolved Within SLA</Badge>;
  if (!dueAt) return null;

  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-sm font-bold border", isOverdue ? "bg-red-50 text-red-700 border-red-200" : "bg-yellow-50 text-yellow-700 border-yellow-200")}>
      <Clock className="w-4 h-4" />
      {timeLeft}
    </div>
  );
};

const TimelineItem = ({ time, title, desc, icon: Icon, colorClass, isLast = false }: any) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className={cn("flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white z-10", colorClass)}>
        <Icon className="w-4 h-4" />
      </div>
      {!isLast && <div className="w-0.5 h-full bg-gray-200 mt-2" />}
    </div>
    <div className="flex-1 pb-6 pt-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-gray-900">{title}</span>
        {time && <span className="text-xs text-gray-500 font-mono">{format(new Date(time), 'dd MMM yyyy, HH:mm')}</span>}
      </div>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  </div>
);

// --- Main Component ---

const IncidentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('timeline');

  // --- Data Queries ---
  const { data: incident, isLoading: incidentLoading } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => getIncidentById(id!),
    enabled: !!id,
  });

  const { data: capas =[], isLoading: capasLoading } = useQuery({
    queryKey: ['incident-capas', id],
    queryFn: () => getCAPAsByIncidentId(id!),
    enabled: !!id,
  });

  // --- Mutations (Preserved from original) ---
  const capaStatusMutation = useMutation({
    mutationFn: ({ capaId, status }: { capaId: string; status: CAPAStatus }) =>
      updateCAPAStatus(capaId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey:['incident-capas', id] });
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
    },
  });

  const handleCAPAToggle = (capa: any) => {
    const newStatus =
      capa.status === CAPAStatus.COMPLETED
        ? CAPAStatus.IN_PROGRESS
        : CAPAStatus.COMPLETED;
    capaStatusMutation.mutate({ capaId: capa.id, status: newStatus });
  };

  // --- New Fault-to-Fix Workflow Action ---
  const handleDraftRepairPermit = () => {
    if (!incident) return;
    const queryParams = new URLSearchParams({
        incidentId: incident.id,
        title: incident.title,
    });
    if (incident.machine_id) queryParams.append('machineId', incident.machine_id);
    navigate(`/permits/new?${queryParams.toString()}`);
  };

  if (incidentLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1"><Skeleton className="h-96 w-full" /></div>
          <div className="lg:col-span-2"><Skeleton className="h-96 w-full" /></div>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Incident not found</p>
        <Button onClick={() => navigate('/incidents')} className="mt-4">Back to Incidents</Button>
      </div>
    );
  }

  const isMaintenanceUser = user?.role?.name?.startsWith('SSE-Maintenance');
  const isSafetyOfficer = user?.role?.name === 'Safety Officer';

  // Dynamic Header Styling based on Severity
  const getHeaderStyle = (severity: string) => {
      switch(severity) {
          case 'FATAL': return "bg-black text-white";
          case 'CRITICAL': 
          case 'MAJOR': return "bg-red-600 text-white";
          case 'MINOR': return "bg-yellow-500 text-yellow-950";
          case 'NEAR_MISS': return "bg-blue-500 text-white";
          default: return "bg-gray-800 text-white";
      }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. SEVERITY HEATMAP HEADER */}
      <div className={cn("p-6 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-500", getHeaderStyle(incident.severity))}>
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/incidents')} className="hover:bg-black/20 text-inherit">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                  <Badge variant="outline" className="bg-white/20 border-white/30 text-inherit uppercase tracking-widest text-xs border-0">{incident.severity} INCIDENT</Badge>
                  <Badge variant="outline" className="bg-white/20 border-white/30 text-inherit border-0">{incident.status.replace(/_/g, ' ')}</Badge>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">{incident.title}</h1>
              <p className="text-white/80 font-mono mt-1 text-sm">{incident.incident_code} • {incident.category.replace(/_/g, ' ')}</p>
            </div>
          </div>
          
          <div className="bg-white/10 p-3 rounded-xl border border-white/20 backdrop-blur-sm text-right">
              <p className="text-xs uppercase tracking-wider text-white/70 mb-1">Compliance SLA Timer</p>
              <SLATimer dueAt={incident.investigation_due_at} resolvedAt={incident.resolved_at} />
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Metadata & Actions */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Action: Resolution Workflow */}
          {incident.status !== 'CLOSED' && (
              <Card className="border-blue-200 bg-gradient-to-b from-blue-50 to-white shadow-sm overflow-hidden">
                  <div className="h-1 w-full bg-blue-500"></div>
                  <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                          <Wrench className="w-5 h-5"/> Fault-to-Fix Workflow
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      {incident.resolution_permit_id ? (
                          <div className="p-3 bg-white border border-blue-200 rounded-lg flex items-start gap-3 shadow-sm">
                             <ShieldCheck className="w-6 h-6 text-green-500 mt-1" />
                             <div>
                                 <p className="text-sm font-bold text-gray-800">Repair Permit Issued & Active</p>
                                 <p className="text-xs text-gray-500 mt-1 mb-2">A permit has been drafted to resolve this issue.</p>
                                 <Button variant="outline" size="sm" className="w-full text-blue-700 border-blue-200 hover:bg-blue-50" onClick={() => navigate(`/permits/${incident.resolution_permit_id}`)}>
                                     View Connected Permit <LinkIcon className="w-3 h-3 ml-2"/>
                                 </Button>
                             </div>
                          </div>
                      ) : (
                          <div className="space-y-3">
                             <p className="text-sm text-gray-600 leading-relaxed">This physical fault requires an authorized Permit to Work before repairs can commence.</p>
                             {isMaintenanceUser ? (
                                 <Button onClick={handleDraftRepairPermit} className="w-full bg-blue-600 hover:bg-blue-700 shadow-md">
                                     <PlusCircle className="w-4 h-4 mr-2" /> Draft Repair Permit
                                 </Button>
                             ) : (
                                 <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
                                     <Clock className="w-4 h-4 text-orange-600" />
                                     <p className="text-xs text-orange-800 font-medium">Awaiting SSE-Maintenance to initiate repair workflow.</p>
                                 </div>
                             )}
                          </div>
                      )}
                  </CardContent>
              </Card>
          )}

          {/* Details Card (Preserved ALL Original Fields) */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Incident Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div><p className="text-sm text-gray-600">Location / Zone</p><p className="font-medium">{incident.location_details || (incident as any).location}</p></div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div><p className="text-sm text-gray-600">Occurred At</p><p className="font-medium">{format(new Date(incident.occurred_at || (incident as any).incident_date), 'MMM dd, yyyy h:mm a')}</p></div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Reported By</p>
                    <p className="font-medium">{incident.reported_by?.full_name || (incident as any).reported_by || 'System'}</p>
                  </div>
                </div>
                {/* Fallback for old contact_number field if it exists */}
                {(incident as any).contact_number && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Contact</p>
                        <p className="font-medium">{(incident as any).contact_number}</p>
                      </div>
                    </div>
                  </>
                )}
                {incident.machine_id && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Wrench className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div><p className="text-sm text-gray-600">Linked Asset</p><p className="font-medium font-mono">{incident.machine?.asset_id || incident.machine_id}</p></div>
                    </div>
                  </>
                )}
                {incident.permit_id && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div><p className="text-sm text-gray-600">Original Permit</p><p className="font-medium">{incident.permit?.permit_no || incident.permit_id}</p></div>
                    </div>
                  </>
                )}
                {incident.contractor_id && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div><p className="text-sm text-gray-600">Contractor Involved</p><p className="font-medium">{incident.contractor?.company_name || incident.contractor_id}</p></div>
                    </div>
                  </>
                )}
            </CardContent>
          </Card>

          {/* Stakeholder Matrix (Chain of Custody) */}
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5"/> Chain of Custody</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg border">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Reported By</p>
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">{incident.reported_by?.full_name || (incident as any).reported_by || 'System'}</span>
                    </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Investigation Authority</p>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">{incident.investigation?.investigated_by_id ? 'Safety Officer Assigned' : 'Pending Assignment'}</span>
                    </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Final Review / Sign-off</p>
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium">{incident.reviewed_by_id ? 'Reviewed & Closed' : 'Pending Review'}</span>
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: The Dossier Content */}
        <div className="lg:col-span-2">
          <Card className="h-full shadow-md overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <CardHeader className="bg-gray-50/80 border-b pb-0 pt-2 px-2">
                <TabsList className="bg-transparent space-x-1 h-auto p-1 overflow-x-auto w-full justify-start">
                  <TabsTrigger value="timeline" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4 py-2">Overview & Timeline</TabsTrigger>
                  <TabsTrigger value="investigation" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4 py-2">4M Root Cause Analysis</TabsTrigger>
                  <TabsTrigger value="capa" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4 py-2">CAPA Tracker</TabsTrigger>
                  <TabsTrigger value="witnesses" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4 py-2">Witness Statements</TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <CardContent className="pt-6 flex-grow">
                
                {/* TAB 1: OVERVIEW & TIMELINE */}
                <TabsContent value="timeline" className="m-0 space-y-8">
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Event Description</h3>
                        <p className="text-base text-gray-800 leading-relaxed bg-white p-5 rounded-xl border shadow-sm border-gray-100">{incident.description}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Master Timeline</h3>
                        <div className="pl-2">
                            <TimelineItem 
                                time={incident.occurred_at || (incident as any).incident_date} 
                                title="Accident / Incident Reported" 
                                desc={`Reported by ${incident.reported_by?.full_name || (incident as any).reported_by || 'System'}`}
                                icon={AlertOctagon} 
                                colorClass="border-yellow-500 text-yellow-600" 
                            />
                            
                            {(incident.is_work_stopped || incident.severity === 'MAJOR' || incident.severity === 'FATAL') && (
                                <TimelineItem 
                                    time={incident.reported_at || (incident as any).created_at} 
                                    title="SYSTEM LOCKDOWN Triggered" 
                                    desc="Machine LOTO enforced and immediate perimeter permits suspended." 
                                    icon={ShieldAlert} 
                                    colorClass="border-red-500 text-red-600" 
                                />
                            )}

                            {(incident.investigation?.started_at || incident.status === 'INVESTIGATING' || incident.status === 'CAPA_PENDING') && (
                                <TimelineItem 
                                    time={incident.investigation?.started_at || (incident as any).updated_at} 
                                    title="Investigation Started" 
                                    desc="Safety Officer assigned to investigate root cause." 
                                    icon={ShieldCheck} 
                                    colorClass="border-blue-500 text-blue-600" 
                                />
                            )}

                            {incident.resolution_permit_id && (
                                <TimelineItem 
                                    time={incident.reported_at} // Ideally from permit object
                                    title="Resolution Permit Drafted" 
                                    desc="SSE-Maintenance initiated the repair workflow." 
                                    icon={Wrench} 
                                    colorClass="border-purple-500 text-purple-600" 
                                />
                            )}

                            {incident.status === 'CLOSED' && (
                                <TimelineItem 
                                    time={incident.resolved_at || (incident as any).updated_at} 
                                    title="Incident Resolved & Closed" 
                                    desc="Repairs completed, investigations signed off, and system normalized." 
                                    icon={CheckCircle2} 
                                    colorClass="border-green-500 text-green-600" 
                                    isLast={true}
                                />
                            )}
                            
                            {incident.status !== 'CLOSED' && (
                                <div className="flex gap-4 opacity-50">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="flex-1 pb-6 pt-1">
                                        <p className="font-semibold text-gray-500">Awaiting Final Resolution</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* TAB 2: INVESTIGATION / 4M RCA */}
                <TabsContent value="investigation" className="m-0">
                    {!incident.investigation && incident.status === 'OPEN' ? (
                        <div className="text-center py-16 px-4">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                                <Edit3 className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Investigation Pending</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">The formal Root Cause Analysis (RCA) has not been completed for this incident yet.</p>
                            {isSafetyOfficer && (
                                <Button className="bg-blue-600 hover:bg-blue-700 shadow-md">Start 4M RCA Report</Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <Alert className="bg-blue-50 border-blue-200">
                                <ShieldCheck className="h-4 w-4 text-blue-600" />
                                <AlertTitle className="text-blue-800">Investigation Complete</AlertTitle>
                                <AlertDescription className="text-blue-700">Root Cause Analysis finalized by Safety Department.</AlertDescription>
                            </Alert>

                            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">4M Analysis Matrix</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="bg-gray-50 shadow-none border-gray-200">
                                    <CardHeader className="py-3 px-4 border-b bg-gray-100/50"><CardTitle className="text-sm">👨‍🔧 MAN (Human Factor)</CardTitle></CardHeader>
                                    <CardContent className="p-4 text-sm text-gray-700">{incident.investigation?.root_cause_category === 'MAN' ? incident.investigation?.root_cause_analysis : 'No human error detected.'}</CardContent>
                                </Card>
                                <Card className="bg-gray-50 shadow-none border-gray-200">
                                    <CardHeader className="py-3 px-4 border-b bg-gray-100/50"><CardTitle className="text-sm">⚙️ MACHINE (Equipment)</CardTitle></CardHeader>
                                    <CardContent className="p-4 text-sm text-gray-700">{incident.investigation?.root_cause_category === 'MACHINE' ? incident.investigation?.root_cause_analysis : 'No machine fault isolated here.'}</CardContent>
                                </Card>
                                <Card className="bg-gray-50 shadow-none border-gray-200">
                                    <CardHeader className="py-3 px-4 border-b bg-gray-100/50"><CardTitle className="text-sm">📋 METHOD (Process)</CardTitle></CardHeader>
                                    <CardContent className="p-4 text-sm text-gray-700">{incident.investigation?.root_cause_category === 'METHOD' ? incident.investigation?.root_cause_analysis : 'SOP followed.'}</CardContent>
                                </Card>
                                <Card className="bg-gray-50 shadow-none border-gray-200">
                                    <CardHeader className="py-3 px-4 border-b bg-gray-100/50"><CardTitle className="text-sm">🧱 MATERIAL (Inputs)</CardTitle></CardHeader>
                                    <CardContent className="p-4 text-sm text-gray-700">{incident.investigation?.root_cause_category === 'MATERIAL' ? incident.investigation?.root_cause_analysis : 'Material standard.'}</CardContent>
                                </Card>
                            </div>

                            <div className="mt-6">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Final Conclusion</h3>
                                <p className="p-4 bg-white border rounded-lg text-sm text-gray-800 leading-relaxed shadow-sm">
                                    {incident.investigation?.conclusion || "Investigation findings finalized. Awaiting CAPA execution."}
                                </p>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* TAB 3: CAPA TRACKER (Preserved Original Functionality) */}
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
                      {capas.map((capa: any) => {
                        const isCompleted = capa.status === CAPAStatus.COMPLETED;
                        const isOverdue =
                          capa.status !== CAPAStatus.COMPLETED &&
                          new Date(capa.deadline || capa.due_date) < new Date();

                        return (
                          <Card
                            key={capa.id}
                            className={cn(
                              'transition-all shadow-sm border-gray-200',
                              isCompleted && 'opacity-75 bg-gray-50'
                            )}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={isCompleted}
                                  onCheckedChange={() => handleCAPAToggle(capa)}
                                  disabled={capaStatusMutation.isPending}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className={cn('font-bold', isCompleted && 'line-through text-gray-500')}>
                                      {capa.title || 'CAPA Action'}
                                    </h4>
                                    <Badge variant={isCompleted ? 'default' : isOverdue ? 'destructive' : 'secondary'} className="text-[10px]">
                                      {capa.status}
                                    </Badge>
                                  </div>
                                  <p className={cn('text-sm text-gray-600 mb-2', isCompleted && 'line-through')}>
                                    {capa.description || capa.action_description}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      <span>{capa.assigned_to || 'Facilities Team'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>Due: {format(new Date(capa.deadline || capa.due_date), 'MMM dd, yyyy')}</span>
                                    </div>
                                    {(capa.completed_at || capa.completed_date) && (
                                      <div className="flex items-center gap-1 text-green-600">
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span>Completed: {format(new Date(capa.completed_at || capa.completed_date), 'MMM dd, yyyy')}</span>
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

                {/* TAB 4: WITNESSES */}
                <TabsContent value="witnesses" className="m-0">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Recorded Statements</h3>
                            <p className="text-sm text-gray-500">Official logs from personnel present at the scene.</p>
                        </div>
                        {isSafetyOfficer && (
                            <Button variant="outline" size="sm"><PlusCircle className="w-4 h-4 mr-2"/> Add Statement</Button>
                        )}
                    </div>

                    {!incident.witnesses || incident.witnesses.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl border-gray-200 bg-gray-50/50">
                            <p className="text-gray-500">No formal witness statements recorded.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {incident.witnesses.map(w => (
                                <div key={w.id} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                                {w.witness_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{w.witness_name}</p>
                                                <p className="text-xs text-gray-500">{format(new Date(w.recorded_at), 'dd MMM yyyy, HH:mm')}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700 italic bg-gray-50 p-4 rounded-lg border border-gray-100 mt-2 shadow-inner leading-relaxed">"{w.statement}"</p>
                                </div>
                            ))}
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