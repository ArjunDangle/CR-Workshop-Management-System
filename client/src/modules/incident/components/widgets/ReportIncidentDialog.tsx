// FILE: client/src/modules/incident/components/widgets/ReportIncidentDialog.tsx
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Loader2, Check, ChevronsUpDown, ChevronDown, Plus, Trash2, ShieldCheck, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

// FIX: Added IncidentWitnessCreate and CAPACreate to the imports
import { createIncident, IncidentSeverity, IncidentCategory, IncidentCreate, RootCauseCategory, CAPAType, IncidentWitnessCreate, CAPACreate } from '../../api';
import { getPermits } from '@/modules/permit/permitApi';
import type { Permit } from '@/modules/permit/permitTypes'; 
import { getAllMachines, Machine } from '@/modules/machine/machineApi';
import { getWorkers, Worker, getContractors, Contractor } from '@/modules/contractor/api';
import WorkerMultiSelect from '@/modules/contractor/components/WorkerMultiSelect';

// Schema defining the Progressive Mega-Dialog
const incidentFormSchema = z.object({
  // Section 1: Core
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.nativeEnum(IncidentSeverity),
  category: z.nativeEnum(IncidentCategory),
  occurred_at: z.string().min(1, 'Incident date is required'),
  location_details: z.string().min(1, 'Location is required'),
  permit_id: z.string().optional().nullable(),
  machine_id: z.string().optional().nullable(),
  contractor_id: z.string().optional().nullable(),
  
  // Section 2: Personnel
  victim_ids: z.array(z.string()).optional().default([]),
  witnesses: z.array(z.object({
    witness_name: z.string().min(1, "Name required"),
    statement: z.string().min(1, "Statement required")
  })).optional().default([]),
  
  // Section 3: 4M Root Cause Analysis
  investigation: z.object({
    root_cause_category: z.nativeEnum(RootCauseCategory).optional().nullable(),
    root_cause_analysis: z.string().optional().nullable(),
    conclusion: z.string().optional()
  }).optional(),
  
  // Section 4: CAPA
  capas: z.array(z.object({
    action_description: z.string().min(1, "Description required"),
    type: z.nativeEnum(CAPAType),
    deadline: z.string().min(1, "Deadline required")
  })).optional().default([])
});

type IncidentFormData = z.infer<typeof incidentFormSchema>;

interface ReportIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMachine?: Machine | null;
}

export const ReportIncidentDialog: React.FC<ReportIncidentDialogProps> = ({
  open,
  onOpenChange,
  initialMachine = null,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedSeverity, setSelectedSeverity] = useState<IncidentSeverity | null>(null);
  const[selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const[selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [selectedVictims, setSelectedVictims] = useState<string[]>([]);
  
  const [permitSearchOpen, setPermitSearchOpen] = useState(false);
  const[machineSearchOpen, setMachineSearchOpen] = useState(false);

  // Expanding Sections State
  const [expandPersonnel, setExpandPersonnel] = useState(false);
  const[expandRCA, setExpandRCA] = useState(false);

  const { register, handleSubmit, control, formState: { errors }, setValue, watch, reset } = useForm<IncidentFormData>({
    resolver: zodResolver(incidentFormSchema),
  });

  const { fields: witnessFields, append: appendWitness, remove: removeWitness } = useFieldArray({ control, name: "witnesses" });
  const { fields: capaFields, append: appendCapa, remove: removeCapa } = useFieldArray({ control, name: "capas" });

  const watchedSeverity = watch('severity');

  const { data: permits =[] } = useQuery<Permit[]>({ queryKey: ['permits'], queryFn: () => getPermits(), enabled: open });
  const { data: machines = [] } = useQuery<Machine[]>({ queryKey: ['machines'], queryFn: () => getAllMachines(), enabled: open });
  const { data: contractors =[] } = useQuery<Contractor[]>({ queryKey: ['contractors'], queryFn: () => getContractors(), enabled: open });

  useEffect(() => {
    if (open) {
      setExpandPersonnel(false);
      setExpandRCA(false);
      setSelectedVictims([]);
      if (initialMachine) {
        setSelectedMachine(initialMachine);
        reset({
          title: `Equipment Fault: ${initialMachine.name} (${initialMachine.asset_id})`,
          description: '',
          severity: IncidentSeverity.MINOR,
          category: IncidentCategory.MECHANICAL, 
          occurred_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          location_details: initialMachine.workspace_zone || initialMachine.shop_name || '',
          machine_id: initialMachine.id,
          witnesses:[], capas:[], investigation: { conclusion: '' }
        });
      } else {
        reset({
          title: '', description: '',
          severity: IncidentSeverity.MINOR,
          category: IncidentCategory.UNSAFE_CONDITION,
          occurred_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          location_details: '',
          witnesses: [], capas:[], investigation: { conclusion: '' }
        });
      }
    } else {
      setSelectedMachine(null);
      setSelectedPermit(null);
      setSelectedContractor(null);
    }
  }, [open, initialMachine, reset]);

  useEffect(() => {
    if (selectedPermit) {
      setValue('permit_id', selectedPermit.id);
      setValue('location_details', selectedPermit.work_location || '');
      if (selectedPermit.contractor_id) {
        const contractor = contractors.find(c => c.id === selectedPermit.contractor_id);
        if (contractor) { setSelectedContractor(contractor); setValue('contractor_id', contractor.id); }
      }
    }
  },[selectedPermit, contractors, setValue]);

  useEffect(() => {
    if (selectedMachine && !initialMachine) {
      setValue('machine_id', selectedMachine.id);
      setValue('location_details', selectedMachine.workspace_zone || selectedMachine.shop_name || '');
    }
  },[selectedMachine, initialMachine, setValue]);

  useEffect(() => {
    if (watchedSeverity) setSelectedSeverity(watchedSeverity);
  },[watchedSeverity]);

  const mutation = useMutation({
    mutationFn: (data: IncidentCreate) => createIncident(data),
    onSuccess: (incident) => {
      toast({ title: 'Report Submitted', description: 'Incident and all detailed logs have been recorded.' });
      if (incident.severity === IncidentSeverity.MAJOR || incident.severity === IncidentSeverity.FATAL) {
        toast({
          title: '⚠️ CRITICAL: WORK STOPPED',
          description: `Machine locked and permits suspended automatically.`,
          variant: 'destructive',
          duration: Infinity,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['machines-module-list'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to report incident', variant: 'destructive' });
    },
  });

  const onSubmit = (data: IncidentFormData) => {
    // Process and clean nested optionals
    const incidentData: IncidentCreate = {
      title: data.title,
      description: data.description,
      severity: data.severity,
      category: data.category,
      occurred_at: data.occurred_at,
      location_details: data.location_details,
      permit_id: selectedPermit?.id || null,
      machine_id: selectedMachine?.id || null,
      contractor_id: selectedContractor?.id || null,
      victim_ids: selectedVictims,
      // FIX: Added type assertions to satisfy TypeScript and prevent optionality errors
      witnesses: data.witnesses && data.witnesses.length > 0 ? (data.witnesses as IncidentWitnessCreate[]) : undefined,
      capas: data.capas && data.capas.length > 0 ? (data.capas as CAPACreate[]) : undefined,
      // FIX: Changed Python 'None' to JavaScript 'null'
      investigation: (data.investigation && data.investigation.conclusion) ? {
        conclusion: data.investigation.conclusion,
        root_cause_analysis: data.investigation.root_cause_analysis || null,
        root_cause_category: data.investigation.root_cause_category || null
      } : undefined
    };
    mutation.mutate(incidentData);
  };

  const isCritical = selectedSeverity === IncidentSeverity.MAJOR || selectedSeverity === IncidentSeverity.FATAL;

  const severityOptions =[
    { value: IncidentSeverity.MINOR, label: 'MINOR', color: 'yellow', borderColor: 'border-yellow-400' },
    { value: IncidentSeverity.MAJOR, label: 'MAJOR', color: 'red', borderColor: 'border-red-500', pulse: true },
    { value: IncidentSeverity.FATAL, label: 'FATAL', color: 'black', borderColor: 'border-black' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-50", isCritical && "border-2 border-red-500")}>
        <DialogHeader className="bg-white p-4 -m-6 mb-4 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-blue-600 w-6 h-6" /> Incident & Investigation Reporting
          </DialogTitle>
          <DialogDescription>
            Report an emergency ticket quickly, or optionally expand the RCA sections to complete a full investigation dossier in one go.
          </DialogDescription>
        </DialogHeader>

        {isCritical && (
          <Alert className="bg-red-600 text-white border-red-700 mb-4 shadow-md">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="font-bold text-base">⚠️ CRITICAL WARNING: Submitting this will IMMEDIATELY STOP WORK and LOCK the machine.</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* SECTION 1: CORE (Mandatory) */}
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-bold text-gray-800">1. Core Incident Details</h3>
                <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Mandatory</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Linked Permit</Label>
                  <Popover open={permitSearchOpen} onOpenChange={setPermitSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between bg-white">
                        {selectedPermit ? <span className="truncate">{selectedPermit.permit_no || `Permit ${selectedPermit.id.slice(0, 8)}`}</span> : <span className="text-muted-foreground">Search permit...</span>}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Search active permit..." />
                        <CommandList>
                          <CommandEmpty>No permit found.</CommandEmpty>
                          <CommandGroup>
                            {permits.filter(p => p.status === 'Active').map((permit) => (
                              <CommandItem key={permit.id} value={`${permit.permit_no || permit.id} ${permit.work_location || ''}`} onSelect={() => { setSelectedPermit(permit); setPermitSearchOpen(false); }}>
                                <Check className={cn("mr-2 h-4 w-4", selectedPermit?.id === permit.id ? "opacity-100" : "opacity-0")} />
                                <div className="flex flex-col"><span className="font-medium">{permit.permit_no || `Permit ${permit.id.slice(0, 8)}`}</span><span className="text-xs text-muted-foreground">{permit.work_location}</span></div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Linked Machine</Label>
                  <Popover open={machineSearchOpen} onOpenChange={setMachineSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between bg-white" disabled={!!initialMachine}>
                        {selectedMachine ? <span className="truncate">{selectedMachine.asset_id}</span> : <span className="text-muted-foreground">Search machine...</span>}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Search machine..." />
                        <CommandList>
                          <CommandEmpty>No machine found.</CommandEmpty>
                          <CommandGroup>
                            {machines.map((machine) => (
                              <CommandItem key={machine.id} value={`${machine.asset_id} ${machine.name}`} onSelect={() => { setSelectedMachine(machine); setMachineSearchOpen(false); }}>
                                <Check className={cn("mr-2 h-4 w-4", selectedMachine?.id === machine.id ? "opacity-100" : "opacity-0")} />
                                <div className="flex flex-col"><span className="font-medium">{machine.asset_id}</span><span className="text-xs text-muted-foreground">{machine.name}</span></div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {severityOptions.map((option) => {
                  const isSelected = selectedSeverity === option.value;
                  return (
                    <div key={option.value} className={cn("cursor-pointer transition-all border rounded-lg p-3 text-center bg-white", isSelected && `${option.borderColor} border-2`, option.pulse && isSelected && "animate-pulse")} onClick={() => { setSelectedSeverity(option.value); setValue('severity', option.value); }}>
                      <div className={cn("text-lg font-bold", option.color === 'yellow' && "text-yellow-600", option.color === 'red' && "text-red-600", option.color === 'black' && "text-black")}>{option.label}</div>
                    </div>
                  );
                })}
              </div>
              {errors.severity && <p className="text-sm text-red-600">{errors.severity.message}</p>}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Title *</Label><Input {...register('title')} placeholder="Brief incident title" className="bg-white" />{errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}</div>
                <div className="space-y-2"><Label>Date & Time *</Label><Input type="datetime-local" {...register('occurred_at')} className="bg-white" />{errors.occurred_at && <p className="text-xs text-red-600">{errors.occurred_at.message}</p>}</div>
              </div>

              <div className="space-y-2"><Label>Description *</Label><Textarea {...register('description')} placeholder="Detailed description..." rows={3} className="bg-white" />{errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}</div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Location / Zone *</Label><Input {...register('location_details')} placeholder="Incident location" className="bg-white" /></div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <select {...register('category')} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                    {Object.values(IncidentCategory).map((cat) => (<option key={cat} value={cat}>{cat.replace('_', ' ')}</option>))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: PERSONNEL (Optional Expandable) */}
          <Card className="shadow-sm border-gray-200">
             <div 
               className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors rounded-lg"
               onClick={() => setExpandPersonnel(!expandPersonnel)}
             >
               <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-purple-600" /> 2. Personnel Involved & Witnesses</h3>
               <div className="flex items-center gap-3">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Optional</span>
                 <ChevronDown className={cn("w-5 h-5 transition-transform text-gray-500", expandPersonnel && "rotate-180")} />
               </div>
             </div>
             
             {expandPersonnel && (
               <CardContent className="p-6 border-t bg-gray-50/50 space-y-6">
                  {/* Select Victims from Contractor */}
                  <div className="space-y-3 bg-white p-4 rounded-xl border">
                    <Label className="font-bold text-gray-800">Identify Injured Workers (Victims)</Label>
                    <p className="text-xs text-gray-500">Filter by contractor to select affected workers.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs mb-1 block">Contractor</Label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm" onChange={(e) => {
                          const c = contractors.find(c => c.id === e.target.value);
                          setSelectedContractor(c || null);
                          setSelectedVictims([]);
                        }}>
                           <option value="">-- Select Contractor --</option>
                           {contractors.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Victims</Label>
                        <WorkerMultiSelect 
                           contractorId={selectedContractor?.id}
                           selectedWorkerIds={selectedVictims}
                           onChange={(ids) => setSelectedVictims(ids)}
                           disabled={!selectedContractor}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Add Witnesses */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                       <Label className="font-bold text-gray-800">Record Witness Statements</Label>
                       <Button type="button" variant="outline" size="sm" onClick={() => appendWitness({ witness_name: '', statement: '' })}>
                          <Plus className="w-4 h-4 mr-2" /> Add Witness
                       </Button>
                    </div>
                    {witnessFields.length === 0 && <p className="text-xs text-gray-400 italic">No witnesses added.</p>}
                    {witnessFields.map((field, index) => (
                      <div key={field.id} className="p-3 bg-white border rounded-xl flex items-start gap-3 shadow-sm">
                        <div className="flex-1 space-y-3">
                          <Input {...register(`witnesses.${index}.witness_name`)} placeholder="Witness Name" className="font-bold bg-gray-50" />
                          <Textarea {...register(`witnesses.${index}.statement`)} placeholder="Recorded Statement..." rows={2} />
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeWitness(index)} className="mt-1">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
               </CardContent>
             )}
          </Card>

          {/* SECTION 3: 4M RCA (Optional Expandable) */}
          <Card className="shadow-sm border-gray-200">
             <div 
               className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors rounded-lg"
               onClick={() => setExpandRCA(!expandRCA)}
             >
               <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-green-600" /> 3. Formal Investigation & RCA / CAPA</h3>
               <div className="flex items-center gap-3">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Optional</span>
                 <ChevronDown className={cn("w-5 h-5 transition-transform text-gray-500", expandRCA && "rotate-180")} />
               </div>
             </div>

             {expandRCA && (
               <CardContent className="p-6 border-t bg-gray-50/50 space-y-8">
                 
                 {/* RCA Matrix */}
                 <div className="space-y-4">
                    <Label className="font-bold text-lg border-b pb-1 border-gray-300 block">4M Root Cause Matrix</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Primary Fault Category</Label>
                        <select {...register('investigation.root_cause_category')} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm mt-1">
                          <option value="">-- Select Root Cause Type --</option>
                          {Object.values(RootCauseCategory).map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                        </select>
                      </div>
                    </div>
                    <div>
                       <Label>Root Cause Analysis Notes</Label>
                       <Textarea {...register('investigation.root_cause_analysis')} placeholder="Explain the underlying cause of failure..." className="mt-1 bg-white" rows={3} />
                    </div>
                    <div>
                       <Label>Final Conclusion (Required if submitting RCA) *</Label>
                       <Textarea {...register('investigation.conclusion')} placeholder="Final official conclusion of the event..." className="mt-1 bg-white border-blue-200" rows={3} />
                    </div>
                 </div>

                 <Separator />

                 {/* CAPA Tracker */}
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <Label className="font-bold text-lg border-b pb-1 border-gray-300 block">Corrective & Preventive Actions (CAPA)</Label>
                       <Button type="button" variant="outline" size="sm" onClick={() => appendCapa({ action_description: '', type: CAPAType.CORRECTIVE, deadline: '' })}>
                          <Plus className="w-4 h-4 mr-2" /> Add CAPA
                       </Button>
                    </div>
                    
                    {capaFields.length === 0 && <p className="text-xs text-gray-400 italic">No actions defined yet.</p>}
                    <div className="space-y-3">
                      {capaFields.map((field, index) => (
                        <div key={field.id} className="p-4 bg-white border rounded-xl shadow-sm space-y-3">
                          <div className="flex justify-between items-start">
                             <div className="grid grid-cols-2 gap-4 flex-1 pr-4">
                               <div>
                                 <Label className="text-xs mb-1 block">Action Type</Label>
                                 <select {...register(`capas.${index}.type`)} className="flex h-9 w-full rounded-md border border-input bg-gray-50 px-3 py-1 text-sm">
                                   <option value={CAPAType.CORRECTIVE}>Corrective (Fix the current issue)</option>
                                   <option value={CAPAType.PREVENTIVE}>Preventive (Stop future occurrences)</option>
                                 </select>
                               </div>
                               <div>
                                 <Label className="text-xs mb-1 block">Deadline</Label>
                                 <Input type="date" {...register(`capas.${index}.deadline`)} className="h-9 bg-gray-50" />
                               </div>
                             </div>
                             <Button type="button" variant="ghost" size="icon" onClick={() => removeCapa(index)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                             </Button>
                          </div>
                          <div>
                            <Label className="text-xs mb-1 block">Detailed Action Plan</Label>
                            <Input {...register(`capas.${index}.action_description`)} placeholder="Describe the action to be taken..." className="bg-gray-50" />
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               </CardContent>
             )}
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 pb-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            
            <Button type="submit" disabled={mutation.isPending} className={cn("min-w-[200px] h-12 text-lg", isCritical ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700")}>
              {mutation.isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</> : 'Submit Incident Dossier'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};