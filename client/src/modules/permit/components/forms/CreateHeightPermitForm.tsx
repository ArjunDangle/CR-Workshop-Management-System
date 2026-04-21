// FILE: client/src/modules/permit/components/forms/CreateHeightPermitForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, ShieldAlert, CheckSquare, Link as LinkIcon } from 'lucide-react';

// --- Our API and Types ---
import { createPermit } from '../../permitApi';
import { permitCreateSchema, PermitCreateData } from '../../permitTypes';
import { linkResolutionPermit } from '@/modules/incident/api';
import { useAuthStore } from '@/modules/auth/authStore';

// --- Modules Integration ---
import MachineSelect from '@/modules/machine/components/MachineSelect';
import { getMachineChecklist, machineApi } from '@/modules/machine/machineApi';
import ContractorSelect from '@/modules/contractor/components/ContractorSelect';
import WorkerMultiSelect from '@/modules/contractor/components/WorkerMultiSelect';
import { Contractor } from '@/modules/contractor/api';

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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const CreateHeightPermitForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // --- NEW: Context Aware Routing ---
  const [searchParams] = useSearchParams();
  const incidentId = searchParams.get('incidentId');
  const contextMachineId = searchParams.get('machineId');
  const contextTitle = searchParams.get('title');

  // --- State for Smart Selectors ---
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(contextMachineId || null);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);

  // --- Form Hook ---
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<PermitCreateData>({
    resolver: zodResolver(permitCreateSchema),
    defaultValues: {
      person_responsible: user?.role?.name.includes('MW') ? 'SSE (MW)' : 'SSW (Substation)',
      work_description: contextTitle ? `Resolving Incident: ${contextTitle}` : '',
      ppes:[
        { name: 'Full body harness (fall arresting type)', checked: false, issued_on: '' },
        { name: 'Safety Shoes', checked: false, issued_on: '' },
        { name: 'Safety Helmet', checked: false, issued_on: '' },
      ],
      attendees: Array(5).fill({ name: '', phone: '' }),
      certified_crane_near_ladder: false,
      hazard_assessed: false,
      work_can_proceed: false,
      method_access_fixed_ladder: false,
      method_access_elevated_platform: false,
      method_access_scissor_lift: false,
      method_access_boom_lifter: false,
      method_access_catwalk: false,
      other_block_required: false,
    },
  });

  useEffect(() => {
    if (contextMachineId) {
      machineApi.getById(contextMachineId).then((m) => {
         setValue('work_location', `${m.shop_name || 'Workshop'} - ${m.name}`);
      }).catch(console.error);
    }
  }, [contextMachineId, setValue]);

  const { fields: ppeFields } = useFieldArray({ control, name: 'ppes' });
  const { fields: attendeeFields, append: appendAttendee, remove: removeAttendee } = useFieldArray({ control, name: 'attendees' });

  const { data: checklist, isLoading: isLoadingChecklist } = useQuery({
    queryKey:['checklist', selectedMachineId],
    queryFn: () => getMachineChecklist(selectedMachineId!),
    enabled: !!selectedMachineId,
  });
  
  const hasCriticalTasks = checklist?.some(task => task.is_critical);

  // --- API Mutation ---
  const mutation = useMutation({
    mutationFn: async (cleanData: any) => {
      const permit = await createPermit(cleanData);
      if (incidentId) {
         await linkResolutionPermit(incidentId, permit.id);
      }
      return permit;
    },
    onSuccess: (data) => {
      toast.success(`Permit #${data.permit_no || 'Created'} Successfully`, {
        description: incidentId ? 'Forwarded to SSE-Office & linked to Incident.' : 'Forwarded to SSE-Office for authorization.',
      });
      queryClient.invalidateQueries({ queryKey: ['permits'] });
      if (incidentId) queryClient.invalidateQueries({ queryKey: ['incident', incidentId] }); 

      if (incidentId) navigate(`/incidents/${incidentId}`);
      else navigate('/dashboard'); 
    },
    onError: (error: any) => {
      toast.error('Failed to Create Permit', {
        description: error.message || 'An unknown error occurred.',
      });
    },
  });

  const onSubmit = (data: PermitCreateData) => {
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
      ppes: data.ppes?.map(ppe => ({ ...ppe, issued_on: ppe.issued_on || null })),
    };
    mutation.mutate(cleanData);
  };

  const getError = (fieldName: any) => {
    const error = errors[fieldName as keyof PermitCreateData];
    return error ? <p className="text-sm text-destructive mt-1">{String(error.message)}</p> : null;
  };

  return (
    <Card className="max-w-6xl mx-auto shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-3xl font-extrabold text-gray-800">
              Create Height Permit
            </CardTitle>
            <p className="text-gray-500 mt-2">
              Fill the form below to create a Work at Height permit
            </p>
          </div>
          <div className="text-right text-sm text-gray-600 bg-gray-50 p-2 rounded">
             <div className="font-bold">Issuing Authority</div>
             <div>{user?.full_name}</div>
             <div className="text-xs text-gray-400">{user?.role?.name}</div>
          </div>
        </div>

        {/* NEW: Context Banner */}
        {incidentId && (
            <Alert className="mt-4 bg-blue-50 border-blue-200">
                <LinkIcon className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800 font-bold">Drafting Repair Permit for Incident</AlertTitle>
                <AlertDescription className="text-blue-700 text-sm">
                    This permit will be automatically linked to resolving Incident <strong>{contextTitle}</strong>. Please complete the contractor assignment and verify all height safety checks below.
                </AlertDescription>
            </Alert>
        )}
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-8">
          {mutation.isError && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{mutation.error.message}</AlertDescription>
            </Alert>
          )}

          {/* --- SECTION: Asset & Contractor Identification (Smart) --- */}
          <section className="space-y-6 bg-blue-50/50 p-6 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-lg text-blue-900 border-b border-blue-200 pb-2">
              Asset & Workforce Verification (System)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="mb-2 block font-semibold text-gray-700">Select Machine / Plant Asset *</Label>
                <MachineSelect 
                  value={selectedMachineId} 
                  onSelect={(id, machine) => {
                    setSelectedMachineId(id);
                    setValue('work_location', `${machine.shop_name} - ${machine.name}`);
                  }} 
                />
              </div>

              <div>
                <Label className="mb-2 block font-semibold text-gray-700">Select Contractor *</Label>
                <ContractorSelect 
                  value={selectedContractor?.id}
                  onChange={(id, contractor) => {
                    setSelectedContractor(contractor);
                    setValue('contractor_id', contractor.id);
                    setSelectedWorkerIds([]); 
                  }}
                  showSafetyStatus={true}
                />
              </div>
            </div>

            <div>
               <Label className="mb-2 block font-semibold text-gray-700">Assign Qualified Workers (DB Verified) *</Label>
               <WorkerMultiSelect 
                  contractorId={selectedContractor?.id}
                  selectedWorkerIds={selectedWorkerIds}
                  onChange={(ids) => {
                    setSelectedWorkerIds(ids);
                    setValue('worker_ids', ids);
                  }}
                  disabled={!selectedContractor}
               />
               <p className="text-xs text-gray-500 mt-1">
                 Note: Only workers with valid medical and training records are shown.
               </p>
            </div>

            {selectedMachineId && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <Alert className={`${hasCriticalTasks ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-white'}`}>
                  {hasCriticalTasks ? <ShieldAlert className="h-4 w-4 text-red-600" /> : <CheckSquare className="h-4 w-4 text-blue-600" />}
                  <AlertTitle className={`text-sm font-bold ${hasCriticalTasks ? 'text-red-700' : 'text-blue-700'}`}>
                    {hasCriticalTasks ? 'CRITICAL SAFETY CHECKS REQUIRED' : 'Standard SOPs Loaded'}
                  </AlertTitle>
                  <ScrollArea className="h-[100px] w-full mt-2 pr-4">
                    {isLoadingChecklist ? <Loader2 className="animate-spin h-4 w-4"/> : (
                      <ul className="space-y-1">
                        {checklist?.map(task => (
                          <li key={task.id} className="text-xs flex items-center gap-2 text-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            {task.description}
                            {task.is_critical && <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded font-bold">CRITICAL</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </ScrollArea>
                </Alert>
              </div>
            )}
          </section>

          <Separator />

          {/* --- SECTION: Permit No / Date / Responsible --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="permit_no">Permit No.</Label>
              <Input id="permit_no" {...register('permit_no')} className="mt-1" placeholder="Auto-Generated" />
              {getError('permit_no')}
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input type="date" id="date" {...register('date')} className="mt-1" />
              {getError('date')}
            </div>
            <div>
              <Label>Person responsible for work</Label>
              <Controller
                name="person_responsible"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value || ''}
                    className="mt-2 flex space-x-4 items-center"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SSE (MW)" id="r1" />
                      <Label htmlFor="r1">SSE (MW)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SSW (Substation)" id="r2" />
                      <Label htmlFor="r2">SSW (Substation)</Label>
                    </div>
                  </RadioGroup>
                )}
              />
              {getError('person_responsible')}
            </div>
          </div>

          {/* --- SECTION: Work Details --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="work_location">Work Location</Label>
              <Input id="work_location" {...register('work_location')} className="mt-1" />
              {getError('work_location')}
            </div>
            <div>
              <Label htmlFor="work_description">Work Description</Label>
              <Input id="work_description" {...register('work_description')} className="mt-1" />
              {getError('work_description')}
            </div>
          </div>
          
          <Separator />

          {/* --- SECTION: Schedule --- */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-700">Schedule</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input type="date" id="start_date" {...register('start_date')} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input type="time" id="start_time" {...register('start_time')} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="finish_date">Finish Date</Label>
                <Input type="date" id="finish_date" {...register('finish_date')} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="finish_time">Finish Time</Label>
                <Input type="time" id="finish_time" {...register('finish_time')} className="mt-1" />
              </div>
            </div>
          </section>

          <Separator />

          {/* --- SECTION: Fall protection system --- */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-700">Indicate Fall Protection System</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="fall_system_description">Type of system / Description</Label>
                <Input id="fall_system_description" {...register('fall_system_description')} className="mt-1" />
              </div>
              <div className="space-y-2">
                <Label>Does not arrest fall (catches after fall)</Label>
                <Controller
                  name="fall_does_not_arrest"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value || ''}
                      className="flex space-x-4 items-center"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="arrest_yes" />
                        <Label htmlFor="arrest_yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="arrest_no" />
                        <Label htmlFor="arrest_no">No</Label>
                      </div>
                    </RadioGroup>
                  )}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="certified_crane_near_ladder" {...register('certified_crane_near_ladder')} />
              <Label htmlFor="certified_crane_near_ladder">Certified that crane is placed near Fixed ladder</Label>
            </div>
          </section>

          <Separator />
          
          {/* --- SECTION: Work Context --- */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-700">Work Context</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="on_crane_describe">On a crane: Describe</Label>
                <Input id="on_crane_describe" {...register('on_crane_describe')} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="other_describe">On other: Describe</Label>
                <Input id="other_describe" {...register('other_describe')} className="mt-1" />
              </div>
            </div>
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox id="hazard_assessed" {...register('hazard_assessed')} />
                <Label htmlFor="hazard_assessed">Hazard assessed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="work_can_proceed" {...register('work_can_proceed')} />
                <Label htmlFor="work_can_proceed">Work can Proceed</Label>
              </div>
            </div>
          </section>

          <Separator />

          {/* --- SECTION: PPEs --- */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-700">Indicate type of fall protection to be used (PPE's)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ppeFields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg space-y-3 bg-white shadow-sm">
                  <Label className="font-medium">{field.name}</Label>
                  <div>
                    <Label htmlFor={`ppes.${index}.issued_on`} className="text-xs text-gray-500">Issued On Date</Label>
                    <Input
                      type="date"
                      id={`ppes.${index}.issued_on`}
                      {...register(`ppes.${index}.issued_on`)}
                      className="mt-1 h-8"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`ppes.${index}.checked`}
                      {...register(`ppes.${index}.checked`)}
                    />
                    <Label htmlFor={`ppes.${index}.checked`} className="text-sm">Checked / inspected</Label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* --- SECTION: Method of access --- */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-700">Method of Access to Target Work Position</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 border rounded-lg space-y-3 bg-gray-50/50">
                <Label className="font-medium underline">Select Method(s)</Label>
                <div className="flex items-center justify-between">
                  <Label htmlFor="method_access_fixed_ladder">Fixed Ladder</Label>
                  <Checkbox id="method_access_fixed_ladder" {...register('method_access_fixed_ladder')} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="method_access_elevated_platform">Elevated work platform</Label>
                  <Checkbox id="method_access_elevated_platform" {...register('method_access_elevated_platform')} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="method_access_scissor_lift">Scissor lift</Label>
                  <Checkbox id="method_access_scissor_lift" {...register('method_access_scissor_lift')} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="method_access_boom_lifter">Boom Lifter platform</Label>
                  <Checkbox id="method_access_boom_lifter" {...register('method_access_boom_lifter')} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="method_access_catwalk">Catwalk</Label>
                  <Checkbox id="method_access_catwalk" {...register('method_access_catwalk')} />
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <Label htmlFor="fixed_ladder_other_person_at_foot" className="font-medium">Checked / Surrounding Hazard control</Label>
                <Textarea
                  id="fixed_ladder_other_person_at_foot"
                  {...register('fixed_ladder_other_person_at_foot')}
                  className="mt-2 h-32"
                  placeholder="Notes on surrounding hazard control"
                />
              </div>
              <div className="p-4 border rounded-lg">
                <Label htmlFor="fixed_ladder_adjustable_lanyard" className="font-medium">Key Control measure</Label>
                <Textarea
                  id="fixed_ladder_adjustable_lanyard"
                  {...register('fixed_ladder_adjustable_lanyard')}
                  className="mt-2 h-32"
                  placeholder="e.g. Other person available at foot of ladder..."
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* --- SECTION: Isolation and block required --- */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-700">Isolation and Block Required</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 border rounded-lg space-y-3">
                <Label>Electrical Isolation / Block obtained</Label>
                <Controller
                  name="electrical_isolation_obtained"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value || ''}
                      className="flex space-x-4 items-center"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="iso_yes" />
                        <Label htmlFor="iso_yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="iso_no" />
                        <Label htmlFor="iso_no">No</Label>
                      </div>
                    </RadioGroup>
                  )}
                />
                <Label className="text-xs text-gray-500">If Yes, indicate Isolation Time</Label>
                <div className="flex gap-2">
                  <Input type="text" placeholder="From" {...register('isolation_from')} />
                  <Input type="text" placeholder="To" {...register('isolation_to')} />
                </div>
              </div>
              <div className="p-4 border rounded-lg md:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Other Kind of Block / isolation required</Label>
                  <Checkbox id="other_block_required" {...register('other_block_required')} />
                </div>
                <Textarea
                  id="other_block_describe"
                  {...register('other_block_describe')}
                  className="h-28"
                  placeholder="Describe other block/isolation"
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* --- SECTION: Declarations --- */}
          <section className="space-y-4 bg-gray-50 p-6 rounded-lg">
            <h4 className="font-semibold text-gray-800">Declarations</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>I am aware about the Associated Hazards and risk...</li>
              <li>Safety precaution for the associated Hazard ensured and are sufficient.</li>
              <li>Machine and tools which will be used are inspected and are suitable to work.</li>
            </ul>
          </section>
          
          <Separator />

          {/* --- SECTION: Signatures & attendees --- */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-700">Permission to work</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>I agree to work within the condition indicated on this permit...</li>
              <li>I declare that all work at height will be carried out under close supervision...</li>
              <li>The following staff are nominated to work for crane maintenance...</li>
              <li>They have been communicated about hazards and risk...</li>
            </ul>
            
            <h3 className="font-semibold text-lg text-gray-700 mt-4">Authorisation / Signatures</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="authorizer_name">Name of person authorising for work (SSE-Office)</Label>
                <Input id="authorizer_name" {...register('authorizer_name')} className="mt-1" placeholder="Will be signed by SSE-Office" disabled />
              </div>
              <div>
                <Label htmlFor="authorizer_signature_date">Date (authoriser signature)</Label>
                <Input type="date" id="authorizer_signature_date" {...register('authorizer_signature_date')} className="mt-1" disabled />
              </div>
            </div>

            <h3 className="font-semibold text-lg text-gray-700 mt-6">Attendees Details (Toolbox Talk)</h3>
            <p className="text-sm text-gray-500 mb-2">List all staff present for the briefing.</p>
            <div className="border rounded-md">
              <Table>
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead className="w-[50px]">Sr. No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone No</TableHead>
                    <TableHead className="w-[50px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendeeFields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Input {...register(`attendees.${index}.name`)} className="border-0 bg-transparent focus-visible:ring-0" placeholder="Name"/>
                      </TableCell>
                      <TableCell>
                        <Input {...register(`attendees.${index}.phone`)} className="border-0 bg-transparent focus-visible:ring-0" placeholder="Phone"/>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAttendee(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => appendAttendee({ name: '', phone: '' })}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </section>

          <Separator />
          
          {/* --- SECTION: Perimeter Authorization --- */}
          <section>
            <h3 className="font-semibold text-lg text-gray-700">Perimeter Authorization (User Shop)</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>All staff working in the related area...</li>
                <li>Working area below the camera is declared...</li>
            </ul>
          </section>

        </CardContent>
        <CardFooter className="bg-gray-50 border-t p-6 flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => incidentId ? navigate(`/incidents/${incidentId}`) : navigate('/dashboard')}>
            Cancel
          </Button>
          <Button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white min-w-[200px]" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
            ) : (
              incidentId ? 'Create Repair Permit & Link' : 'Create Permit Request'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CreateHeightPermitForm;