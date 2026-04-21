// FILE: client/src/modules/permit/components/forms/CreateElectricPermitForm.tsx
import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, AlertTriangle, CheckSquare, ShieldAlert, Zap, Lock } from 'lucide-react';

// --- Our API and Types ---
import { createPermit } from '../../permitApi';
import { permitCreateSchema, PermitCreateData } from '../../permitTypes';
import { useAuthStore } from '@/modules/auth/authStore';

// --- Smart Machine Integration ---
import MachineSelect from '@/modules/machine/components/MachineSelect';
import { getMachineChecklist } from '@/modules/machine/machineApi';

// --- Smart Contractor Integration ---
import ContractorSelect from '@/modules/contractor/components/ContractorSelect';
import WorkerMultiSelect from '@/modules/contractor/components/WorkerMultiSelect';
import { Contractor, Worker } from '@/modules/contractor/api';

// --- Shadcn UI Components ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// --- TYPE EXTENSION: Fixes TS Errors for Electrical Fields ---
// We extend the base PermitCreateData to include the specific electrical fields
// that might not be in the shared global type yet.
type ElectricPermitFormData = PermitCreateData & {
  machine_id?: string;
  // Electrical Specifics
  circuit_identification: string;
  voltage_level: string;
  earthing_applied: boolean;
  test_before_touch: boolean;
  loto_applied: boolean;
  lock_box_number: string;
};

const CreateElectricPermitForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // --- Smart State ---
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);

  // --- Form Hook ---
  // We use the Extended Type <ElectricPermitFormData> here to satisfy TypeScript
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ElectricPermitFormData>({
    resolver: zodResolver(permitCreateSchema), // Note: Ensure your Zod schema allows unknown keys or these fields are added to it
    defaultValues: {
      person_responsible: user?.role?.name.includes('Substation') ? 'SSW (Substation)' : 'SSE (MW)',
      permit_no: 'AUTO-GENERATED',
      contractor_id: '',
      worker_ids: [],
      ppes: [
        { name: 'Electrical Insulating Gloves (Class 0/1)', checked: false, issued_on: '' },
        { name: 'Arc Flash Face Shield / Visor', checked: false, issued_on: '' },
        { name: 'Safety Shoes (Non-conductive)', checked: false, issued_on: '' },
        { name: 'Insulated Tools', checked: false, issued_on: '' },
      ],
      attendees: Array(3).fill({ name: '', phone: '' }),
      
      // Booleans
      certified_crane_near_ladder: false,
      hazard_assessed: false,
      work_can_proceed: false,
      other_block_required: false,
      
      // Electrical Specifics (Defaults now match the Type)
      electrical_isolation_obtained: 'no',
      earthing_applied: false,
      test_before_touch: false,
      loto_applied: false,
      lock_box_number: '',
      circuit_identification: '',
      voltage_level: '',
    },
  });

  // --- Fetch SOP Checklist Logic ---
  const { data: checklist, isLoading: isLoadingChecklist } = useQuery({
    queryKey: ['checklist', selectedMachineId],
    queryFn: () => getMachineChecklist(selectedMachineId!),
    enabled: !!selectedMachineId,
  });

  const hasCriticalTasks = checklist?.some(task => task.is_critical);

  // --- Field Array Hooks ---
  const { fields: ppeFields } = useFieldArray({ control, name: 'ppes' });
  const { fields: attendeeFields, append: appendAttendee, remove: removeAttendee } = useFieldArray({ control, name: 'attendees' });

  // --- API Mutation ---
  const mutation = useMutation({
    mutationFn: createPermit,
    onSuccess: (data) => {
      toast.success(`Permit #${data.permit_no || 'Created'} Successfully`, {
        description: 'Forwarded for authorization & LOTO verification.',
      });
      queryClient.invalidateQueries({ queryKey: ['permits'] });
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error('Failed to Create Permit', {
        description: error.message || 'An unknown error occurred.',
      });
    },
  });

  // --- Submit Handler ---
  const onSubmit = (data: ElectricPermitFormData) => {
    const cleanData = {
      ...data,
      machine_id: selectedMachineId,
      contractor_id: selectedContractor?.id,
      worker_ids: selectedWorkerIds,
      date: data.date || null,
      start_date: data.start_date || null,
      start_time: data.start_time || null,
      finish_date: data.finish_date || null,
      finish_time: data.finish_time || null,
      authorizer_signature_date: data.authorizer_signature_date || null,
      ppes: data.ppes?.map((ppe: any) => ({ ...ppe, issued_on: ppe.issued_on || null })),
    };
    mutation.mutate(cleanData);
  };

  const getError = (fieldName: keyof ElectricPermitFormData) => {
    const error = errors[fieldName];
    return error ? <p className="text-sm text-destructive mt-1">{String(error.message)}</p> : null;
  };

  return (
    <Card className="max-w-6xl mx-auto shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
              <Zap className="h-8 w-8 text-yellow-500 fill-yellow-500" />
              Create Electrical Permit
            </CardTitle>
            <p className="text-gray-500 mt-2">
              Standard E-101 Format • Work on Live/Isolated Circuits
            </p>
          </div>
          {/* Header Badge */}
          <div className="text-right text-sm text-gray-600 bg-gray-50 p-2 rounded">
             <div className="font-bold">Issuing Authority</div>
             <div>{user?.full_name}</div>
             <div className="text-xs text-gray-400">{user?.role?.name}</div>
          </div>
        </div>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-8 pt-6 px-8">
          {mutation.isError && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{mutation.error.message}</AlertDescription>
            </Alert>
          )}

          {/* 1. ASSET IDENTIFICATION (Smart) */}
          <section className="space-y-6 bg-yellow-50/40 p-6 rounded-lg border border-yellow-100">
            <h3 className="font-semibold text-lg text-yellow-900 border-b border-yellow-200 pb-2">
              1. Asset & Identification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="machine_select" className="mb-2 block font-semibold">Select Equipment / Panel *</Label>
                <MachineSelect 
                  value={selectedMachineId}
                  onSelect={(id, machine) => {
                    setSelectedMachineId(id);
                    setValue('work_location', `${machine.shop_name} - ${machine.name}`);
                  }}
                />
                <input type="hidden" {...register('work_location')} />
                {getError('work_location')}
              </div>
              
              <div>
                <Label htmlFor="work_description" className="mb-2 block font-semibold">Work Description *</Label>
                <Input id="work_description" {...register('work_description')} className="mt-1" placeholder="Describe the repair/maintenance work..." />
                {getError('work_description')}
              </div>
            </div>

            {/* SOP Checklist Visualization */}
            {selectedMachineId && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <Alert className={`mt-4 ${hasCriticalTasks ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-white'}`}>
                  {hasCriticalTasks ? <ShieldAlert className="h-4 w-4 text-red-600" /> : <CheckSquare className="h-4 w-4 text-yellow-600" />}
                  <AlertTitle className={`text-sm font-bold ${hasCriticalTasks ? 'text-red-700' : 'text-yellow-700'}`}>
                    {hasCriticalTasks ? 'CRITICAL ELECTRICAL CHECKS' : 'Electrical SOPs Loaded'}
                  </AlertTitle>
                  <ScrollArea className="h-24 w-full mt-2">
                     {isLoadingChecklist ? <Loader2 className="animate-spin h-4 w-4"/> : (
                       <div className="space-y-2">
                         {checklist?.map(t => (
                           <div key={t.id} className="text-xs text-gray-700 flex gap-2 items-center">
                             <span className="w-1.5 h-1.5 rounded-full bg-gray-400"/>
                             {t.description}
                             {t.is_critical && <Badge variant="destructive" className="text-[10px] px-1 h-5">HIGH VOLTAGE</Badge>}
                           </div>
                         ))}
                       </div>
                     )}
                  </ScrollArea>
                </Alert>
              </div>
            )}
          </section>

          {/* 2. CONTRACTOR & WORKER (Smart) */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-700 border-b pb-2">2. Contractor & Workforce</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="mb-2 block">Select Contractor *</Label>
                <ContractorSelect
                  value={selectedContractor?.id}
                  onChange={(id, contractor) => {
                    setSelectedContractor(contractor);
                    setValue('contractor_id', contractor.id);
                    setSelectedWorkerIds([]); // Safety Reset
                  }}
                  showSafetyStatus={true}
                />
                {getError('contractor_id')}
              </div>
              
              <div>
                <Label className="mb-2 block">Assign Competent Electricians *</Label>
                <WorkerMultiSelect
                  contractorId={selectedContractor?.id}
                  selectedWorkerIds={selectedWorkerIds}
                  onChange={(ids) => {
                    setSelectedWorkerIds(ids);
                    setValue('worker_ids', ids);
                  }}
                  disabled={!selectedContractor}
                />
                {selectedWorkerIds.length === 0 && selectedContractor && (
                  <p className="text-xs text-red-500 mt-1">At least one worker must be selected</p>
                )}
              </div>
            </div>
          </section>

          <Separator />

          {/* PERMIT DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><Label>Permit No.</Label><Input {...register('permit_no')} placeholder="Auto-Generated" /></div>
            <div><Label>Date</Label><Input type="date" {...register('date')} /></div>
            <div>
              <Label>Responsible Person</Label>
              <Controller
                name="person_responsible"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="mt-2 flex gap-4">
                    <div className="flex items-center gap-2"><RadioGroupItem value="SSE (MW)" id="r1"/><Label htmlFor="r1">SSE (MW)</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="SSW (Substation)" id="r2"/><Label htmlFor="r2">Substation</Label></div>
                  </RadioGroup>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* 3. SCHEDULE */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-700">3. Schedule</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div><Label>Start Date</Label><Input type="date" {...register('start_date')} /></div>
              <div><Label>Start Time</Label><Input type="time" {...register('start_time')} /></div>
              <div><Label>Finish Date</Label><Input type="date" {...register('finish_date')} /></div>
              <div><Label>Finish Time</Label><Input type="time" {...register('finish_time')} /></div>
            </div>
          </section>

          <Separator />

          {/* 4. FALL PROTECTION (PRESERVED FROM ORIGINAL) */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-700">4. Fall Protection System</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="fall_system_description">Type of system / Description</Label>
                <Input id="fall_system_description" {...register('fall_system_description')} />
              </div>
              <div className="space-y-2">
                <Label>Does not arrest fall?</Label>
                <Controller
                  name="fall_does_not_arrest"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} value={field.value || 'no'} className="flex gap-4">
                      <div className="flex items-center gap-2"><RadioGroupItem value="yes" id="fa_y"/><Label htmlFor="fa_y">Yes</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="no" id="fa_n"/><Label htmlFor="fa_n">No</Label></div>
                    </RadioGroup>
                  )}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="certified_crane_near_ladder" {...register('certified_crane_near_ladder')} />
              <Label htmlFor="certified_crane_near_ladder">Certified that crane is placed near Fixed ladder</Label>
            </div>
          </section>

          <Separator />
          
          {/* 5. WORK CONTEXT (PRESERVED FROM ORIGINAL) */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-700">5. Work Context</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><Label>On a crane: Describe</Label><Input {...register('on_crane_describe')} /></div>
              <div><Label>On other: Describe</Label><Input {...register('other_describe')} /></div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Checkbox id="hazard_assessed" {...register('hazard_assessed')} />
                <Label htmlFor="hazard_assessed">Hazard assessed</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="work_can_proceed" {...register('work_can_proceed')} />
                <Label htmlFor="work_can_proceed">Work can Proceed</Label>
              </div>
            </div>
          </section>

          <Separator />

          {/* 6. PPEs */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-700">6. Required PPEs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ppeFields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg bg-white flex justify-between items-center shadow-sm">
                  <Label className="font-medium">{field.name}</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col"><Label className="text-[10px] text-gray-500">Issued On</Label><Input type="date" {...register(`ppes.${index}.issued_on`)} className="h-8 w-32"/></div>
                    <div className="flex items-center gap-2"><Checkbox {...register(`ppes.${index}.checked`)} /><Label>Safe</Label></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* 7. LOTO & ISOLATION (AUGMENTED with Electrical Specifics) */}
          <section className="space-y-6">
            <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-600" />
              7. LOTO: Isolation and Block
            </h3>
            
            {/* NEW: Critical Electrical Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-red-50 border border-red-100 rounded-lg">
                <div>
                   <Label className="font-bold text-gray-800">Circuit Identification / Feeder</Label>
                   <Input {...register('circuit_identification')} placeholder="e.g. Feeder-1A, Panel 4" className="mt-1 bg-white" />
                   {getError('circuit_identification')}
                </div>
                <div>
                   <Label className="font-bold text-gray-800">Voltage Level</Label>
                   <Input {...register('voltage_level')} placeholder="e.g. 11kV, 415V" className="mt-1 bg-white" />
                   {getError('voltage_level')}
                </div>
                <div className="flex gap-6 col-span-2">
                   <div className="flex items-center gap-2">
                      <Checkbox id="tbt" {...register('test_before_touch')} />
                      <Label htmlFor="tbt" className="font-semibold">Test Before Touch (Dead Verified)</Label>
                   </div>
                   <div className="flex items-center gap-2">
                      <Checkbox id="earth" {...register('earthing_applied')} />
                      <Label htmlFor="earth" className="font-semibold">Temporary Earthing Applied</Label>
                   </div>
                </div>
            </div>

            {/* Original Isolation Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <Label className="font-bold text-orange-700">Electrical Isolation Obtained?</Label>
                </div>
                <Controller
                  name="electrical_isolation_obtained"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                      <div className="flex items-center gap-2"><RadioGroupItem value="yes" id="iso_y"/><Label htmlFor="iso_y">Yes</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="no" id="iso_n"/><Label htmlFor="iso_n">No</Label></div>
                    </RadioGroup>
                  )}
                />
                <div className="flex gap-2">
                   <Input placeholder="Time From" {...register('isolation_from')} />
                   <Input placeholder="Time To" {...register('isolation_to')} />
                </div>
              </div>

              {/* LOTO / Block Fields */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between">
                   <Label>Other Block / Lock Box Details</Label>
                   <div className="flex items-center gap-2">
                      <Checkbox {...register('loto_applied')} />
                      <span className="text-xs font-bold text-red-600">LOTO APPLIED</span>
                   </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                   <Checkbox id="other_block_required" {...register('other_block_required')} />
                   <Label htmlFor="other_block_required">Other Block Required</Label>
                </div>
                <Input {...register('lock_box_number')} placeholder="Lock Box No / Tag No" />
                <Textarea {...register('other_block_describe')} placeholder="Describe other block/isolation..." className="h-20 mt-2" />
              </div>
            </div>
          </section>

          <Separator />

          {/* 8. DECLARATIONS (Added for Completeness) */}
          <section className="bg-gray-50 p-6 rounded-lg border border-gray-100">
             <h4 className="font-bold text-gray-800 mb-2">Declarations</h4>
             <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>I certify that the equipment identified above has been isolated, locked, and tagged out (where applicable).</li>
              <li>Voltage has been tested and verified as ZERO (Dead).</li>
              <li>Temporary earthing has been applied where necessary for safety.</li>
              <li>I agree to work within the conditions indicated on this permit.</li>
            </ul>
          </section>

          {/* 9. AUTHORIZATION & SIGNATURES */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-700">9. Authorization / Signatures</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
              <div>
                <Label htmlFor="authorizer_name">Name of Authorizer (SSE-Office)</Label>
                <Input id="authorizer_name" {...register('authorizer_name')} className="mt-1" disabled placeholder="Pending Authorization..." />
              </div>
              <div>
                <Label htmlFor="authorizer_signature_date">Date</Label>
                <Input type="date" id="authorizer_signature_date" {...register('authorizer_signature_date')} className="mt-1" disabled />
              </div>
            </div>

            <h3 className="font-semibold text-lg text-gray-700 mt-4">Attendees Details (Toolbox Talk)</h3>
            <div className="border rounded-md">
                <Table>
                <TableHeader className="bg-gray-100">
                    <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone No</TableHead>
                    <TableHead className="w-[50px]">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {attendeeFields.map((field, index) => (
                    <TableRow key={field.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell><Input {...register(`attendees.${index}.name`)} className="border-0 bg-transparent" placeholder="Name"/></TableCell>
                        <TableCell><Input {...register(`attendees.${index}.phone`)} className="border-0 bg-transparent" placeholder="Phone"/></TableCell>
                        <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeAttendee(index)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
            <Button type="button" variant="outline" onClick={() => appendAttendee({ name: '', phone: '' })} className="mt-2">
              <Plus className="h-4 w-4 mr-2" /> Add Attendee
            </Button>
          </section>

          <Separator />
          
          {/* 10. PERIMETER (Added for Completeness) */}
          <section className="bg-gray-50 p-4 rounded border">
             <h4 className="font-bold text-gray-700">Perimeter & Area Safety</h4>
             <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                <li>Warning signs/barricades placed around the live electrical work area.</li>
                <li>Unauthorized personnel are restricted from entering the zone.</li>
             </ul>
          </section>

        </CardContent>
        <CardFooter className="bg-gray-50 border-t p-6 flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>Cancel</Button>
          <Button type="submit" className="w-full md:w-auto h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white min-w-[250px]" disabled={mutation.isPending || !selectedMachineId}>
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing Permit...</>
            ) : (
              'Create Permit & Trigger LOTO'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CreateElectricPermitForm;