// client/src/modules/contractor/components/ContractorProfileSheet.tsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from "date-fns";
import { toast } from 'sonner';

// UI Components
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Icons
import { 
  Building2, ShieldCheck, AlertTriangle, FileText, Users, Network, 
  UserPlus, IdCard, Activity, HardHat, CheckCircle2, AlertCircle, Loader2
} from "lucide-react";

// API & Store
import { 
  Contractor, getContracts, getWorkers, createWorker, 
  WorkerSkill, WorkerTrade, GatePassState 
} from "../api";
import { useAuthStore } from "@/modules/auth/authStore";

interface Props { 
  contractor: Contractor | null; 
  isOpen: boolean; 
  onClose: () => void; 
}

export const ContractorProfileSheet: React.FC<Props> = ({ contractor, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);

  // Add Worker Form State
  const [workerForm, setWorkerForm] = useState({
    full_name: '',
    id_proof_number: '',
    skill_category: WorkerSkill.SKILLED,
    trade: WorkerTrade.FITTER,
    medical_valid_upto: '',
    safety_training_valid_upto: ''
  });

  // Queries
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', contractor?.id],
    queryFn: () => getContracts(contractor!.id),
    enabled: isOpen && !!contractor,
  });

  const { data: workers = [], isLoading: workersLoading } = useQuery({
    queryKey:['contractor-workers', contractor?.id],
    queryFn: () => getWorkers(contractor!.id),
    enabled: isOpen && !!contractor,
  });

  // Mutations
  const addWorkerMutation = useMutation({
    mutationFn: (data: typeof workerForm) => createWorker(contractor!.id, data),
    onSuccess: () => {
      toast.success("Worker registered successfully.");
      setIsAddWorkerOpen(false);
      setWorkerForm({
        full_name: '', id_proof_number: '', skill_category: WorkerSkill.SKILLED,
        trade: WorkerTrade.FITTER, medical_valid_upto: '', safety_training_valid_upto: ''
      });
      queryClient.invalidateQueries({ queryKey:['contractor-workers', contractor?.id] });
    },
    onError: (err: any) => toast.error("Failed to add worker", { description: err.message })
  });

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    addWorkerMutation.mutate(workerForm);
  };

  if (!contractor) return null;

  const isMedicalExpired = (dateStr: string) => new Date(dateStr) < new Date();
  const isSafetyExpired = (dateStr: string) => new Date(dateStr) < new Date();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[700px] md:max-w-[850px] overflow-y-auto p-0 bg-gray-50 border-l-0 shadow-2xl">
        
        {/* HERO BANNER */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-4 right-4">
             <Badge className={`px-3 py-1 text-sm ${contractor.reputation_score >= 80 ? 'bg-green-500' : 'bg-red-500'}`}>
               Trust Score: {contractor.reputation_score}/100
             </Badge>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-white/10 p-3 rounded-2xl border border-white/20">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">{contractor.company_name}</h2>
              <p className="text-slate-400 font-mono text-sm mt-1">
                {contractor.vendor_code} • {contractor.contractor_type}
              </p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="p-6">
          <Tabs defaultValue="workforce">
            <TabsList className="grid w-full grid-cols-4 bg-gray-200/50 mb-6 p-1 rounded-xl">
              <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
              <TabsTrigger value="contracts" className="rounded-lg">Contracts</TabsTrigger>
              <TabsTrigger value="workforce" className="rounded-lg">Workforce</TabsTrigger>
              <TabsTrigger value="hierarchy" className="rounded-lg">Hierarchy</TabsTrigger>
            </TabsList>

            {/* --- 1. OVERVIEW TAB --- */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border flex items-center gap-3 shadow-sm">
                  <ShieldCheck className="w-8 h-8 text-blue-500 bg-blue-50 p-1.5 rounded-lg"/>
                  <div><p className="text-xs text-gray-500">Empanelment</p><p className="font-bold">{contractor.empanelment_category}</p></div>
                </div>
                <div className="bg-white p-4 rounded-xl border flex items-center gap-3 shadow-sm">
                  <AlertTriangle className="w-8 h-8 text-orange-500 bg-orange-50 p-1.5 rounded-lg"/>
                  <div><p className="text-xs text-gray-500">Watchlist Status</p><p className="font-bold">{contractor.is_watchlist ? 'UNDER SCRUTINY' : 'CLEAR'}</p></div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                 <h3 className="font-bold mb-4 flex items-center"><FileText className="w-5 h-5 mr-2 text-gray-400"/> Regulatory Dates</h3>
                 <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Empanelment Valid Upto</span><span className="font-medium">{format(new Date(contractor.empanelment_valid_upto), 'dd MMM yyyy')}</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Insurance Policy No</span><span className="font-mono">{contractor.insurance_policy_no || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Insurance Valid Upto</span><span className="font-medium">{contractor.insurance_valid_upto ? format(new Date(contractor.insurance_valid_upto), 'dd MMM yyyy') : 'N/A'}</span></div>
                 </div>
              </div>
            </TabsContent>

            {/* --- 2. CONTRACTS TAB --- */}
            <TabsContent value="contracts">
              <ScrollArea className="h-[450px]">
                {contracts.length === 0 ? <p className="text-center text-gray-500 py-8 border-2 border-dashed rounded-xl">No active contracts linked to this vendor.</p> : (
                  <div className="space-y-4 pr-4">
                    {contracts.map(c => (
                      <div key={c.id} className="bg-white p-5 rounded-xl border shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-gray-900">{c.name}</h4>
                            <p className="text-xs font-mono text-gray-500 mt-0.5">{c.tender_number}</p>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{c.status}</Badge>
                        </div>
                        <div className="mt-4 pt-3 border-t">
                           <div className="flex justify-between text-xs mb-1.5">
                             <span className="text-gray-500">Mobilization Readiness</span>
                             <span className="font-bold">{c.mobilization_progress}%</span>
                           </div>
                           <Progress value={c.mobilization_progress} className="h-2 bg-gray-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* --- 3. WORKFORCE TAB (THE REGISTRY) --- */}
            <TabsContent value="workforce" className="space-y-4">
               {/* Workforce KPIs */}
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                   <p className="text-sm text-blue-600 font-bold flex items-center"><Users className="w-4 h-4 mr-2"/> Total Registered</p>
                   <p className="text-3xl font-black text-blue-900 mt-1">{workers.length}</p>
                 </div>
                 <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm">
                   <p className="text-sm text-green-600 font-bold flex items-center"><CheckCircle2 className="w-4 h-4 mr-2"/> Currently On Site</p>
                   <p className="text-3xl font-black text-green-900 mt-1">{workers.filter(w => w.gate_pass_state === GatePassState.INSIDE).length}</p>
                 </div>
               </div>

               {/* Roster Header & Add Button */}
               <div className="flex justify-between items-end pt-2 pb-2 border-b">
                 <div>
                    <h3 className="font-bold text-lg text-gray-900">Labor Roster</h3>
                    <p className="text-xs text-gray-500">Manage individual workers and verify compliance.</p>
                 </div>
                 {user?.role?.name === 'SSE-Office' && (
                    <Dialog open={isAddWorkerOpen} onOpenChange={setIsAddWorkerOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <UserPlus className="w-4 h-4 mr-2"/> Register Worker
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Register New Worker</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddWorker} className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Full Name *</Label>
                              <Input value={workerForm.full_name} onChange={e => setWorkerForm({...workerForm, full_name: e.target.value})} required />
                            </div>
                            <div className="space-y-2">
                              <Label>Aadhaar / ID Proof *</Label>
                              <Input value={workerForm.id_proof_number} onChange={e => setWorkerForm({...workerForm, id_proof_number: e.target.value})} required />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Trade *</Label>
                              <Select value={workerForm.trade} onValueChange={(v: WorkerTrade) => setWorkerForm({...workerForm, trade: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Object.values(WorkerTrade).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Skill Category *</Label>
                              <Select value={workerForm.skill_category} onValueChange={(v: WorkerSkill) => setWorkerForm({...workerForm, skill_category: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Object.values(WorkerSkill).map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                            <div className="space-y-2">
                              <Label>Medical Fitness Expiry *</Label>
                              <Input type="date" value={workerForm.medical_valid_upto} onChange={e => setWorkerForm({...workerForm, medical_valid_upto: e.target.value})} required />
                            </div>
                            <div className="space-y-2">
                              <Label>Safety Training Expiry *</Label>
                              <Input type="date" value={workerForm.safety_training_valid_upto} onChange={e => setWorkerForm({...workerForm, safety_training_valid_upto: e.target.value})} required />
                            </div>
                          </div>

                          <Button type="submit" className="w-full mt-4" disabled={addWorkerMutation.isPending}>
                            {addWorkerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                            Save Worker Profile
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                 )}
               </div>

               {/* Worker List */}
               <ScrollArea className="h-[350px]">
                 {workersLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>
                 ) : workers.length === 0 ? (
                    <div className="text-center p-8 border-2 border-dashed rounded-xl bg-white mt-4">
                      <HardHat className="w-12 h-12 mx-auto text-gray-300 mb-3"/>
                      <p className="text-gray-500">No workers registered under this contractor.</p>
                    </div>
                 ) : (
                    <div className="space-y-3 pr-4 mt-2">
                      {workers.map(w => {
                        const medExpired = isMedicalExpired(w.medical_valid_upto);
                        const safeExpired = isSafetyExpired(w.safety_training_valid_upto);
                        const isBlocked = w.is_blacklisted || medExpired || safeExpired;

                        return (
                          <div key={w.id} className={`bg-white p-4 rounded-xl border shadow-sm flex items-start justify-between gap-4 transition-colors ${isBlocked ? 'border-red-200 bg-red-50/30' : 'hover:border-blue-200'}`}>
                            <div className="flex items-start gap-4">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${w.gate_pass_state === GatePassState.INSIDE ? 'bg-green-100 text-green-700 ring-2 ring-green-500' : 'bg-gray-100 text-gray-500'}`}>
                                  {w.full_name.charAt(0)}
                               </div>
                               <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-gray-900">{w.full_name}</h4>
                                    {w.gate_pass_state === GatePassState.INSIDE && <Badge className="bg-green-500 text-[10px] h-5">ON SITE</Badge>}
                                    {w.is_blacklisted && <Badge variant="destructive" className="text-[10px] h-5">BLACKLISTED</Badge>}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                    <span className="flex items-center"><IdCard className="w-3 h-3 mr-1"/> {w.id_proof_number}</span>
                                    <span>•</span>
                                    <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{w.trade}</span>
                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">{w.skill_category.replace('_', ' ')}</span>
                                  </div>
                                  
                                  {/* Expiry Checks */}
                                  <div className="flex items-center gap-4 text-[10px] font-medium">
                                    <span className={`flex items-center px-2 py-1 rounded ${medExpired ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                       {medExpired ? <AlertCircle className="w-3 h-3 mr-1"/> : <Activity className="w-3 h-3 mr-1"/>}
                                       Med Expiry: {format(new Date(w.medical_valid_upto), 'dd/MM/yy')}
                                    </span>
                                    <span className={`flex items-center px-2 py-1 rounded ${safeExpired ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                       {safeExpired ? <AlertCircle className="w-3 h-3 mr-1"/> : <ShieldCheck className="w-3 h-3 mr-1"/>}
                                       Safety Expiry: {format(new Date(w.safety_training_valid_upto), 'dd/MM/yy')}
                                    </span>
                                  </div>
                               </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                 )}
               </ScrollArea>
            </TabsContent>

            {/* --- 4. HIERARCHY TAB --- */}
            <TabsContent value="hierarchy">
               <div className="bg-white p-6 rounded-xl border border-dashed border-gray-300 text-center py-12 shadow-sm">
                  <Network className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-800">Subcontractor Tree</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {contractor.subcontractors?.length ? `${contractor.subcontractors.length} registered subcontractors under this principal employer.` : 'No subcontractors linked.'}
                  </p>
               </div>
            </TabsContent>

          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};