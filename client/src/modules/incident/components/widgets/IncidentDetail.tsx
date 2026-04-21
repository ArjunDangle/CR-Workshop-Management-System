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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import {
  getIncidentById,
  getCAPAsByIncidentId,
  updateCAPAStatus,
  submitInvestigation,
  addWitness,
  Incident,
  CAPA,
  CAPAStatus,
  IncidentSeverity,
  RootCauseCategory
} from '../../api';

import { useAuthStore } from '@/modules/auth/authStore';

// --- Helper Components ---

const SLATimer = ({ dueAt, resolvedAt }: { dueAt?: string | null, resolvedAt?: string | null }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
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
    const timer = setInterval(calculateTime, 60000); 
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
  const { toast } = useToast();
  const { user } = useAuthStore();
  const[activeTab, setActiveTab] = useState('timeline');

  // --- Modal States ---
  const [isRcaOpen, setIsRcaOpen] = useState(false);
  const [rcaData, setRcaData] = useState({ category: '', analysis: '', conclusion: '' });

  const [isWitnessOpen, setIsWitnessOpen] = useState(false);
  const[witnessData, setWitnessData] = useState({ name: '', statement: '' });

  // --- Data Queries ---
  const { data: incident, isLoading: incidentLoading } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => getIncidentById(id!),
    enabled: !!id,
  });

  const { data: capas = [], isLoading: capasLoading } = useQuery({
    queryKey:['incident-capas', id],
    queryFn: () => getCAPAsByIncidentId(id!),
    enabled: !!id,
  });

  // --- Mutations ---
  const capaStatusMutation = useMutation({
    mutationFn: ({ capaId, status }: { capaId: string; status: CAPAStatus }) =>
      updateCAPAStatus(capaId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey:['incident-capas', id] });
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
    },
  });

  const rcaMutation = useMutation({
    mutationFn: () => submitInvestigation(id!, {
      root_cause_category: rcaData.category as RootCauseCategory || null,
      root_cause_analysis: rcaData.analysis,
      conclusion: rcaData.conclusion
    }),
    onSuccess: () => {
      toast({ title: 'Success', description: '4M RCA Report submitted successfully.' });
      setIsRcaOpen(false);
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' })
  });

  const witnessMutation = useMutation({
    mutationFn: () => addWitness(id!, {
      witness_name: witnessData.name,
      statement: witnessData.statement
    }),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Witness statement recorded.' });
      setIsWitnessOpen(false);
      setWitnessData({ name: '', statement: '' });
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' })
  });

  const handleCAPAToggle = (capa: any) => {
    const newStatus = capa.status === CAPAStatus.COMPLETED ? CAPAStatus.IN_PROGRESS : CAPAStatus.COMPLETED;
    capaStatusMutation.mutate({ capaId: capa.id, status: newStatus });
  };

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

          {/* Details Card */}
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
                        <p className="text-base text-gray-800 leading-relaxed bg-white p-5 rounded-xl border shadow-sm border-gray-100 whitespace-pre-wrap">
                          {incident.description}
                        </p>
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
                        </div>
                    </div>
                </TabsContent>

                {/* TAB 2: INVESTIGATION / 4M RCA */}
                <TabsContent value="investigation" className="m-0">
                    {!incident.investigation ? (
                        <div className="text-center py-16 px-4">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                                <Edit3 className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Investigation Pending</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">The formal Root Cause Analysis (RCA) has not been completed for this incident yet.</p>
                            {isSafetyOfficer && (
                                <Button onClick={() => setIsRcaOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-md">
                                  Start 4M RCA Report
                                </Button>
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
                                    <CardContent className="p-4 text-sm text-gray-700">{incident.investigation.root_cause_category === 'MAN' ? incident.investigation.root_cause_analysis : 'No human error detected.'}</CardContent>
                                </Card>
                                <Card className="bg-gray-50 shadow-none border-gray-200">
                                    <CardHeader className="py-3 px-4 border-b bg-gray-100/50"><CardTitle className="text-sm">⚙️ MACHINE (Equipment)</CardTitle></CardHeader>
                                    <CardContent className="p-4 text-sm text-gray-700">{incident.investigation.root_cause_category === 'MACHINE' ? incident.investigation.root_cause_analysis : 'No machine fault isolated here.'}</CardContent>
                                </Card>
                                <Card className="bg-gray-50 shadow-none border-gray-200">
                                    <CardHeader className="py-3 px-4 border-b bg-gray-100/50"><CardTitle className="text-sm">📋 METHOD (Process)</CardTitle></CardHeader>
                                    <CardContent className="p-4 text-sm text-gray-700">{incident.investigation.root_cause_category === 'METHOD' ? incident.investigation.root_cause_analysis : 'SOP followed.'}</CardContent>
                                </Card>
                                <Card className="bg-gray-50 shadow-none border-gray-200">
                                    <CardHeader className="py-3 px-4 border-b bg-gray-100/50"><CardTitle className="text-sm">🧱 MATERIAL (Inputs)</CardTitle></CardHeader>
                                    <CardContent className="p-4 text-sm text-gray-700">{incident.investigation.root_cause_category === 'MATERIAL' ? incident.investigation.root_cause_analysis : 'Material standard.'}</CardContent>
                                </Card>
                            </div>

                            <div className="mt-6">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Final Conclusion</h3>
                                <p className="p-4 bg-white border rounded-lg text-sm text-gray-800 leading-relaxed shadow-sm whitespace-pre-wrap">
                                    {incident.investigation.conclusion}
                                </p>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* TAB 3: CAPA TRACKER */}
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
                          <Card key={capa.id} className={cn('transition-all shadow-sm border-gray-200', isCompleted && 'opacity-75 bg-gray-50')}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Checkbox checked={isCompleted} onCheckedChange={() => handleCAPAToggle(capa)} disabled={capaStatusMutation.isPending} className="mt-1" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className={cn('font-bold', isCompleted && 'line-through text-gray-500')}>{capa.title || 'CAPA Action'}</h4>
                                    <Badge variant={isCompleted ? 'default' : isOverdue ? 'destructive' : 'secondary'} className="text-[10px]">{capa.status}</Badge>
                                  </div>
                                  <p className={cn('text-sm text-gray-600 mb-2', isCompleted && 'line-through')}>{capa.description || capa.action_description}</p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                                    <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span>Due: {format(new Date(capa.deadline || capa.due_date), 'MMM dd, yyyy')}</span></div>
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
                            <Button onClick={() => setIsWitnessOpen(true)} variant="outline" size="sm"><PlusCircle className="w-4 h-4 mr-2"/> Add Statement</Button>
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
                                    <p className="text-sm text-gray-700 italic bg-gray-50 p-4 rounded-lg border border-gray-100 mt-2 shadow-inner leading-relaxed whitespace-pre-wrap">"{w.statement}"</p>
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

      {/* --- DIALOGS FOR DEAD BUTTONS --- */}
      
      {/* 4M RCA Dialog */}
      <Dialog open={isRcaOpen} onOpenChange={setIsRcaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit 4M Root Cause Analysis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Primary Root Cause Category</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm mt-1"
                value={rcaData.category}
                onChange={(e) => setRcaData({...rcaData, category: e.target.value})}
              >
                <option value="">-- Select Category --</option>
                {Object.values(RootCauseCategory).map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>
            <div>
              <Label>Root Cause Notes</Label>
              <Textarea 
                placeholder="Explain the failure in detail..." 
                value={rcaData.analysis}
                onChange={(e) => setRcaData({...rcaData, analysis: e.target.value})}
                rows={3} 
              />
            </div>
            <div>
              <Label>Final Conclusion (Required) *</Label>
              <Textarea 
                placeholder="Official conclusion for the incident dossier..." 
                value={rcaData.conclusion}
                onChange={(e) => setRcaData({...rcaData, conclusion: e.target.value})}
                rows={3} 
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsRcaOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => rcaMutation.mutate()} 
              disabled={rcaMutation.isPending || !rcaData.conclusion.trim()}
            >
              {rcaMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null} Submit RCA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Witness Statement Dialog */}
      <Dialog open={isWitnessOpen} onOpenChange={setIsWitnessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Witness Statement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Witness Name *</Label>
              <Input 
                placeholder="Full Name" 
                value={witnessData.name}
                onChange={(e) => setWitnessData({...witnessData, name: e.target.value})}
              />
            </div>
            <div>
              <Label>Statement *</Label>
              <Textarea 
                placeholder="Exact words of the witness..." 
                value={witnessData.statement}
                onChange={(e) => setWitnessData({...witnessData, statement: e.target.value})}
                rows={4} 
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsWitnessOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => witnessMutation.mutate()} 
              disabled={witnessMutation.isPending || !witnessData.name.trim() || !witnessData.statement.trim()}
            >
              {witnessMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null} Save Statement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default IncidentDetail;