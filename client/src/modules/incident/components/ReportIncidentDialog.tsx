// client/src/modules/incident/components/ReportIncidentDialog.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  X, 
  Loader2, 
  Check,
  ChevronsUpDown,
  User,
  Building,
  Wrench
} from 'lucide-react';
import { format } from 'date-fns';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  createIncident,
  IncidentSeverity,
  IncidentCategory,
  IncidentCreate,
} from '../api';
import { getPermits, Permit } from '@/modules/permit/permitApi';
import { getAllMachines, Machine } from '@/modules/machine/machineApi';
import { getWorkers, Worker } from '@/modules/contractor/api';
import { getContractors, Contractor } from '@/modules/contractor/api';

// Zod schema for form validation
const incidentFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.nativeEnum(IncidentSeverity),
  category: z.nativeEnum(IncidentCategory),
  incident_date: z.string().min(1, 'Incident date is required'),
  location: z.string().min(1, 'Location is required'),
  reported_by: z.string().min(1, 'Reporter name is required'),
  contact_number: z.string().min(10, 'Valid contact number is required'),
  permit_id: z.string().optional().nullable(),
  machine_id: z.string().optional().nullable(),
  contractor_id: z.string().optional().nullable(),
  victim_ids: z.array(z.string()).optional().default([]),
});

type IncidentFormData = z.infer<typeof incidentFormSchema>;

interface ReportIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReportIncidentDialog: React.FC<ReportIncidentDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const [selectedSeverity, setSelectedSeverity] = useState<IncidentSeverity | null>(null);
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [selectedVictims, setSelectedVictims] = useState<Worker[]>([]);
  const [permitSearchOpen, setPermitSearchOpen] = useState(false);
  const [machineSearchOpen, setMachineSearchOpen] = useState(false);
  const [contractorSearchOpen, setContractorSearchOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<IncidentFormData>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
      severity: IncidentSeverity.MINOR,
      category: IncidentCategory.UNSAFE_ACT,
      incident_date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
      victim_ids: [],
    },
  });

  const watchedSeverity = watch('severity');

  // Fetch permits, machines, contractors
  const { data: permits = [] } = useQuery({
    queryKey: ['permits'],
    queryFn: () => getPermits(),
    enabled: open,
  });

  const { data: machines = [] } = useQuery({
    queryKey: ['machines'],
    queryFn: () => getAllMachines(),
    enabled: open,
  });

  const { data: contractors = [] } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => getContractors(),
    enabled: open,
  });

  const { data: workers = [] } = useQuery({
    queryKey: ['workers', selectedContractor?.id],
    queryFn: () => getWorkers(selectedContractor!.id),
    enabled: !!selectedContractor?.id && open,
  });

  // Auto-fill when permit is selected
  useEffect(() => {
    if (selectedPermit) {
      setValue('permit_id', selectedPermit.id);
      setValue('location', selectedPermit.work_location || '');
      if (selectedPermit.contractor_id) {
        const contractor = contractors.find(c => c.id === selectedPermit.contractor_id);
        if (contractor) {
          setSelectedContractor(contractor);
          setValue('contractor_id', contractor.id);
        }
      }
      // Note: Permit doesn't directly have machine_id, but we can try to find it
    }
  }, [selectedPermit, contractors, setValue]);

  // Auto-fill when machine is selected
  useEffect(() => {
    if (selectedMachine) {
      setValue('machine_id', selectedMachine.id);
      if (selectedMachine.shop_name) {
        setValue('location', selectedMachine.shop_name);
      }
    }
  }, [selectedMachine, setValue]);

  // Auto-fill when contractor is selected
  useEffect(() => {
    if (selectedContractor) {
      setValue('contractor_id', selectedContractor.id);
    }
  }, [selectedContractor, setValue]);

  // Update severity state
  useEffect(() => {
    if (watchedSeverity) {
      setSelectedSeverity(watchedSeverity);
    }
  }, [watchedSeverity]);

  const mutation = useMutation({
    mutationFn: (data: IncidentCreate) => createIncident(data),
    onSuccess: (incident) => {
      toast({
        title: 'Incident Reported',
        description: 'The incident has been successfully logged.',
      });
      
      // If MAJOR or FATAL, show critical toast
      if (incident.severity === IncidentSeverity.MAJOR || incident.severity === IncidentSeverity.FATAL) {
        toast({
          title: '⚠️ CRITICAL: WORK STOPPED',
          description: `Machine locked and permits suspended due to ${incident.severity} incident.`,
          variant: 'destructive',
          duration: Infinity, // Until dismissed
        });
      }
      
      reset();
      setSelectedPermit(null);
      setSelectedMachine(null);
      setSelectedContractor(null);
      setSelectedVictims([]);
      setSelectedSeverity(null);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to report incident',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: IncidentFormData) => {
    const incidentData: IncidentCreate = {
      ...data,
      permit_id: selectedPermit?.id || null,
      machine_id: selectedMachine?.id || null,
      contractor_id: selectedContractor?.id || null,
      victim_ids: selectedVictims.map(v => v.id),
    };
    mutation.mutate(incidentData);
  };

  const isCritical = selectedSeverity === IncidentSeverity.MAJOR || selectedSeverity === IncidentSeverity.FATAL;

  const severityOptions = [
    { value: IncidentSeverity.MINOR, label: 'MINOR', color: 'yellow', borderColor: 'border-yellow-400' },
    { value: IncidentSeverity.MAJOR, label: 'MAJOR', color: 'red', borderColor: 'border-red-500', pulse: true },
    { value: IncidentSeverity.FATAL, label: 'FATAL', color: 'black', borderColor: 'border-black' },
  ];

  const handleVictimToggle = (worker: Worker) => {
    if (selectedVictims.find(v => v.id === worker.id)) {
      setSelectedVictims(selectedVictims.filter(v => v.id !== worker.id));
    } else {
      setSelectedVictims([...selectedVictims, worker]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "max-w-3xl max-h-[90vh] overflow-y-auto",
          isCritical && "border-2 border-red-500"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Report Incident</DialogTitle>
          <DialogDescription>
            Report a safety incident. Critical incidents will trigger automatic safety measures.
          </DialogDescription>
        </DialogHeader>

        {/* Kill Switch Warning Banner */}
        {isCritical && (
          <Alert className="bg-red-600 text-white border-red-700 animate-in slide-in-from-top-2">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="font-bold text-base">
              ⚠️ CRITICAL WARNING: Submitting this will IMMEDIATELY STOP WORK and LOCK the machine.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Context Search (Permit/Machine) */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Step 1: Context</Label>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Permit Search */}
              <div className="space-y-2">
                <Label>Search Active Permit</Label>
                <Popover open={permitSearchOpen} onOpenChange={setPermitSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedPermit ? (
                        <span className="truncate">{selectedPermit.permit_no || `Permit ${selectedPermit.id.slice(0, 8)}`}</span>
                      ) : (
                        <span className="text-muted-foreground">Search permit...</span>
                      )}
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
                            <CommandItem
                              key={permit.id}
                              value={`${permit.permit_no || permit.id} ${permit.work_location || ''}`}
                              onSelect={() => {
                                setSelectedPermit(permit);
                                setPermitSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedPermit?.id === permit.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{permit.permit_no || `Permit ${permit.id.slice(0, 8)}`}</span>
                                <span className="text-xs text-muted-foreground">{permit.work_location}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Machine Search */}
              <div className="space-y-2">
                <Label>Search Machine</Label>
                <Popover open={machineSearchOpen} onOpenChange={setMachineSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedMachine ? (
                        <span className="truncate">{selectedMachine.asset_id}</span>
                      ) : (
                        <span className="text-muted-foreground">Search machine...</span>
                      )}
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
                            <CommandItem
                              key={machine.id}
                              value={`${machine.asset_id} ${machine.name}`}
                              onSelect={() => {
                                setSelectedMachine(machine);
                                setMachineSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedMachine?.id === machine.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{machine.asset_id}</span>
                                <span className="text-xs text-muted-foreground">{machine.name}</span>
                              </div>
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

          {/* Step 2: Severity Selector */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Step 2: Severity</Label>
            <div className="grid grid-cols-3 gap-4">
              {severityOptions.map((option) => {
                const isSelected = selectedSeverity === option.value;
                return (
                  <Card
                    key={option.value}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      isSelected && `${option.borderColor} border-2`,
                      option.pulse && isSelected && "animate-pulse"
                    )}
                    onClick={() => {
                      setSelectedSeverity(option.value);
                      setValue('severity', option.value);
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={cn(
                        "text-2xl font-bold mb-2",
                        option.color === 'yellow' && "text-yellow-600",
                        option.color === 'red' && "text-red-600",
                        option.color === 'black' && "text-black"
                      )}>
                        {option.label}
                      </div>
                      {isSelected && <Check className="h-5 w-5 mx-auto text-green-600" />}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {errors.severity && (
              <p className="text-sm text-red-600">{errors.severity.message}</p>
            )}
          </div>

          {/* Step 3: Basic Details */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Step 3: Details</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Brief incident title"
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="incident_date">Date & Time *</Label>
                <Input
                  id="incident_date"
                  type="datetime-local"
                  {...register('incident_date')}
                />
                {errors.incident_date && (
                  <p className="text-sm text-red-600">{errors.incident_date.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Detailed description of the incident..."
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="Incident location"
                />
                {errors.location && (
                  <p className="text-sm text-red-600">{errors.location.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  {...register('category')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {Object.values(IncidentCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reported_by">Reported By *</Label>
                <Input
                  id="reported_by"
                  {...register('reported_by')}
                  placeholder="Reporter name"
                />
                {errors.reported_by && (
                  <p className="text-sm text-red-600">{errors.reported_by.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_number">Contact Number *</Label>
                <Input
                  id="contact_number"
                  {...register('contact_number')}
                  placeholder="Phone number"
                />
                {errors.contact_number && (
                  <p className="text-sm text-red-600">{errors.contact_number.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Step 4: Victims */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Step 4: Victims (Optional)</Label>
            
            {/* Contractor Select for Victims */}
            <div className="space-y-2">
              <Label>Select Contractor</Label>
              <Popover open={contractorSearchOpen} onOpenChange={setContractorSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedContractor ? (
                      <span className="truncate">{selectedContractor.company_name}</span>
                    ) : (
                      <span className="text-muted-foreground">Select contractor...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search contractor..." />
                    <CommandList>
                      <CommandEmpty>No contractor found.</CommandEmpty>
                      <CommandGroup>
                        {contractors.map((contractor) => (
                          <CommandItem
                            key={contractor.id}
                            value={`${contractor.company_name} ${contractor.vendor_code}`}
                            onSelect={() => {
                              setSelectedContractor(contractor);
                              setContractorSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedContractor?.id === contractor.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{contractor.company_name}</span>
                              <span className="text-xs text-muted-foreground">{contractor.vendor_code}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Selected Victims Chips */}
            {selectedVictims.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                {selectedVictims.map((victim) => (
                  <Badge
                    key={victim.id}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-xs">
                        {victim.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{victim.full_name}</span>
                    <button
                      onClick={() => handleVictimToggle(victim)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Workers List */}
            {selectedContractor && workers.length > 0 && (
              <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                {workers.map((worker) => {
                  const isSelected = selectedVictims.find(v => v.id === worker.id);
                  return (
                    <div
                      key={worker.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100",
                        isSelected && "bg-blue-50"
                      )}
                      onClick={() => handleVictimToggle(worker)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {worker.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{worker.full_name}</div>
                        <div className="text-xs text-gray-500">{worker.trade}</div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-green-600" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className={cn(
                isCritical && "bg-red-600 hover:bg-red-700"
              )}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Incident'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
