// FILE: client/src/modules/incident/components/widgets/ReportIncidentDialog.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

import { createIncident, IncidentSeverity, IncidentCategory, IncidentCreate } from '../../api';
import { getPermits } from '@/modules/permit/permitApi';
import type { Permit } from '@/modules/permit/permitTypes'; 
import { getAllMachines, Machine } from '@/modules/machine/machineApi';
import { getWorkers, Worker, getContractors, Contractor } from '@/modules/contractor/api';

// FIX: Updated schema to match backend expectations exactly
const incidentFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.nativeEnum(IncidentSeverity),
  category: z.nativeEnum(IncidentCategory),
  occurred_at: z.string().min(1, 'Incident date is required'),
  location_details: z.string().min(1, 'Location is required'),
  permit_id: z.string().optional().nullable(),
  machine_id: z.string().optional().nullable(),
  contractor_id: z.string().optional().nullable(),
  victim_ids: z.array(z.string()).optional().default([]),
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
  const[selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const[selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [selectedVictims, setSelectedVictims] = useState<Worker[]>([]);
  
  const [permitSearchOpen, setPermitSearchOpen] = useState(false);
  const[machineSearchOpen, setMachineSearchOpen] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<IncidentFormData>({
    resolver: zodResolver(incidentFormSchema),
  });

  const watchedSeverity = watch('severity');

  const { data: permits =[] } = useQuery<Permit[]>({ queryKey: ['permits'], queryFn: () => getPermits(), enabled: open });
  const { data: machines =[] } = useQuery<Machine[]>({ queryKey: ['machines'], queryFn: () => getAllMachines(), enabled: open });
  const { data: contractors = [] } = useQuery<Contractor[]>({ queryKey: ['contractors'], queryFn: () => getContractors(), enabled: open });

  useEffect(() => {
    if (open) {
      if (initialMachine) {
        setSelectedMachine(initialMachine);
        reset({
          title: `Equipment Fault: ${initialMachine.name} (${initialMachine.asset_id})`,
          description: '',
          severity: IncidentSeverity.MINOR,
          category: IncidentCategory.MECHANICAL, 
          occurred_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"), // FIX: mapped to occurred_at
          location_details: initialMachine.workspace_zone || initialMachine.shop_name || '', // FIX: mapped to location_details
          permit_id: null,
          machine_id: initialMachine.id,
          contractor_id: null,
          victim_ids:[],
        });
      } else {
        reset({
          title: '',
          description: '',
          severity: IncidentSeverity.MINOR,
          category: IncidentCategory.UNSAFE_CONDITION,
          occurred_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          location_details: '',
          permit_id: null,
          machine_id: null,
          contractor_id: null,
          victim_ids:[],
        });
      }
    } else {
      setSelectedMachine(null);
      setSelectedPermit(null);
      setSelectedContractor(null);
      setSelectedVictims([]);
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
  }, [selectedPermit, contractors, setValue]);

  useEffect(() => {
    if (selectedMachine && !initialMachine) {
      setValue('machine_id', selectedMachine.id);
      setValue('location_details', selectedMachine.workspace_zone || selectedMachine.shop_name || '');
    }
  }, [selectedMachine, initialMachine, setValue]);

  useEffect(() => {
    if (watchedSeverity) setSelectedSeverity(watchedSeverity);
  }, [watchedSeverity]);

  const mutation = useMutation({
    mutationFn: (data: IncidentCreate) => createIncident(data),
    onSuccess: (incident) => {
      toast({ title: 'Incident Reported', description: 'The incident has been successfully logged.' });
      if (incident.severity === IncidentSeverity.MAJOR || incident.severity === IncidentSeverity.FATAL) {
        toast({
          title: '⚠️ CRITICAL: WORK STOPPED',
          description: `Machine locked and permits suspended due to ${incident.severity} incident.`,
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
    // FIX: Perfect match with Backend Schema
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
      victim_ids: selectedVictims.map(v => v.id),
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
      <DialogContent className={cn("max-w-3xl max-h-[90vh] overflow-y-auto", isCritical && "border-2 border-red-500")}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Report Incident / Fault</DialogTitle>
          <DialogDescription>Report a safety incident or machine fault. Critical reports will trigger automatic safety measures.</DialogDescription>
        </DialogHeader>

        {isCritical && (
          <Alert className="bg-red-600 text-white border-red-700 animate-in slide-in-from-top-2">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="font-bold text-base">⚠️ CRITICAL WARNING: Submitting this will IMMEDIATELY STOP WORK and LOCK the machine.</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Context */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Step 1: Context</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Search Active Permit</Label>
                <Popover open={permitSearchOpen} onOpenChange={setPermitSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
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
                <Label>Search Machine</Label>
                <Popover open={machineSearchOpen} onOpenChange={setMachineSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between" disabled={!!initialMachine}>
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
          </div>

          {/* Step 2: Severity */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Step 2: Severity</Label>
            <div className="grid grid-cols-3 gap-4">
              {severityOptions.map((option) => {
                const isSelected = selectedSeverity === option.value;
                return (
                  <Card key={option.value} className={cn("cursor-pointer transition-all hover:shadow-md", isSelected && `${option.borderColor} border-2`, option.pulse && isSelected && "animate-pulse")} onClick={() => { setSelectedSeverity(option.value); setValue('severity', option.value); }}>
                    <CardContent className="p-4 text-center">
                      <div className={cn("text-2xl font-bold mb-2", option.color === 'yellow' && "text-yellow-600", option.color === 'red' && "text-red-600", option.color === 'black' && "text-black")}>{option.label}</div>
                      {isSelected && <Check className="h-5 w-5 mx-auto text-green-600" />}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {errors.severity && <p className="text-sm text-red-600">{errors.severity.message}</p>}
          </div>

          {/* Step 3: Details */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Step 3: Details</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" {...register('title')} placeholder="Brief incident title" />
                {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="occurred_at">Date & Time *</Label>
                <Input id="occurred_at" type="datetime-local" {...register('occurred_at')} />
                {errors.occurred_at && <p className="text-sm text-red-600">{errors.occurred_at.message}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" {...register('description')} placeholder="Detailed description of the incident/fault..." rows={4} />
              {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location_details">Location / Zone *</Label>
                <Input id="location_details" {...register('location_details')} placeholder="Incident location" />
                {errors.location_details && <p className="text-sm text-red-600">{errors.location_details.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select id="category" {...register('category')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                  {Object.values(IncidentCategory).map((cat) => (<option key={cat} value={cat}>{cat.replace('_', ' ')}</option>))}
                </select>
                {errors.category && <p className="text-sm text-red-600">{errors.category.message}</p>}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending} className={cn(isCritical && "bg-red-600 hover:bg-red-700")}>
              {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : 'Submit Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};