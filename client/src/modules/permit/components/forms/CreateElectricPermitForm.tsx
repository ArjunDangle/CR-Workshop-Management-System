// FILE: client/src/modules/permit/components/forms/CreateElectricPermitForm.tsx
import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, AlertTriangle, CheckSquare, ShieldAlert } from 'lucide-react';

// --- Our API and Types ---
import { createPermit } from '../../permitApi';
import { permitCreateSchema, PermitCreateData } from '../../permitTypes';
// --- New Machine Integration ---
import MachineSelect from '@/modules/machine/components/MachineSelect';
import { getMachineChecklist, MaintenanceTask } from '@/modules/machine/machineApi';

// --- Shadcn UI Components ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
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

const CreateElectricPermitForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);

  // --- Form Hook ---
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<PermitCreateData & { machine_id?: string }>({
    resolver: zodResolver(permitCreateSchema),
    defaultValues: {
      ppes: [
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

  // --- Fetch SOP Checklist Logic ---
  const { data: checklist, isLoading: isLoadingChecklist } = useQuery({
    queryKey: ['checklist', selectedMachineId],
    queryFn: () => getMachineChecklist(selectedMachineId!),
    enabled: !!selectedMachineId,
  });

  // Check if any task is critical
  const hasCriticalTasks = checklist?.some(task => task.is_critical);

  // --- Field Array Hooks ---
  const { fields: ppeFields } = useFieldArray({ control, name: 'ppes' });
  const { fields: attendeeFields, append: appendAttendee, remove: removeAttendee } = useFieldArray({ control, name: 'attendees' });

  // --- API Mutation ---
  const mutation = useMutation({
    mutationFn: createPermit,
    onSuccess: (data) => {
      toast.success(`Permit #${data.permit_no || data.id} Created!`, {
        description: 'Forwarded to SSE-Office for authorization.',
      });
      queryClient.invalidateQueries({ queryKey: ['permits'] });
      navigate('/dashboard');
    },
    onError: (error) => {
      toast.error('Failed to Create Permit', {
        description: error.message || 'An unknown error occurred.',
      });
    },
  });

  // --- Submit Handler ---
  const onSubmit = (data: any) => {
    // Inject the machine_id into the payload
    const cleanData = {
      ...data,
      machine_id: selectedMachineId, // Add the machine link
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

  const getError = (fieldName: any) => {
    const error = errors[fieldName as keyof PermitCreateData];
    return error ? <p className="text-sm text-destructive mt-1">{String(error.message)}</p> : null;
  };

  return (
    <Card className="max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl font-extrabold text-gray-800">
          Create Electrical Permit
        </CardTitle>
        <p className="text-gray-500 mt-2">
          Select a machine to load safety protocols and create a permit.
        </p>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-8">
          {/* Global Error */}
          {mutation.isError && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{mutation.error.message}</AlertDescription>
            </Alert>
          )}

          {/* Machine Selection Section (Replaces old text input) */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-700 border-b pb-2">1. Asset Identification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="machine_select" className="mb-2 block">Select Machine / Plant Asset</Label>
                <MachineSelect 
                  value={selectedMachineId}
                  onSelect={(id, machine) => {
                    setSelectedMachineId(id);
                    // Auto-fill the old "work_location" field for backward compatibility/display
                    setValue('work_location', `${machine.shop_id} - ${machine.name}`);
                  }}
                />
                {/* Hidden input to satisfy Zod schema if strictly required, or handled in onSubmit */}
                <input type="hidden" {...register('work_location')} />
                {getError('work_location')}
              </div>
              
              <div>
                <Label htmlFor="work_description">Work Description</Label>
                <Input id="work_description" {...register('work_description')} className="mt-1" placeholder="Describe the repair/maintenance work..." />
                {getError('work_description')}
              </div>
            </div>
          </section>

          {/* SOP Checklist Visualization */}
          {selectedMachineId && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <Alert className={`border-l-4 ${hasCriticalTasks ? 'border-l-red-600 bg-red-50' : 'border-l-blue-500 bg-blue-50'}`}>
                {hasCriticalTasks ? <ShieldAlert className="h-5 w-5 text-red-600" /> : <CheckSquare className="h-5 w-5 text-blue-600" />}
                <AlertTitle className={`text-lg font-bold ${hasCriticalTasks ? 'text-red-700' : 'text-blue-700'}`}>
                  {hasCriticalTasks ? 'CRITICAL SAFETY CHECKS REQUIRED' : 'Standard Operating Procedures (SOP)'}
                </AlertTitle>
                <AlertDescription className="text-gray-700 mt-2">
                  The following safety tasks are mandatory for this machine type.
                </AlertDescription>
                
                <ScrollArea className="h-[200px] w-full rounded-md border bg-white p-4 mt-4">
                  {isLoadingChecklist ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading SOPs...
                    </div>
                  ) : checklist && checklist.length > 0 ? (
                    <div className="space-y-3">
                      {checklist.map((task) => (
                        <div key={task.id} className="flex items-start space-x-3 pb-3 border-b last:border-0">
                          <Checkbox id={`sop-${task.id}`} disabled checked={true} />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor={`sop-${task.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {task.description}
                            </label>
                            <div className="flex gap-2">
                              {task.is_critical && <Badge variant="destructive" className="text-[10px] px-1 py-0 h-5">CRITICAL</Badge>}
                              {task.requires_ppe && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5">PPE REQUIRED</Badge>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No specific SOPs found for this machine type.</p>
                  )}
                </ScrollArea>
              </Alert>
            </div>
          )}

          {/* Standard Form Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="permit_no">Permit No. (Auto/Manual)</Label>
              <Input id="permit_no" {...register('permit_no')} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input type="date" id="date" {...register('date')} className="mt-1" />
            </div>
            <div>
              <Label>Person responsible</Label>
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
            </div>
          </div>

          <Separator />

          {/* Schedule */}
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

          {/* Fall protection system */}
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
          
          {/* Work Context */}
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

          {/* PPEs */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-700">Required PPEs (Verified from SOP)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ppeFields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg space-y-3">
                  <Label className="font-medium">{field.name}</Label>
                  <div>
                    <Label htmlFor={`ppes.${index}.issued_on`} className="text-xs text-gray-500">Issued On Date</Label>
                    <Input
                      type="date"
                      id={`ppes.${index}.issued_on`}
                      {...register(`ppes.${index}.issued_on`)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`ppes.${index}.checked`}
                      {...register(`ppes.${index}.checked`)}
                    />
                    <Label htmlFor={`ppes.${index}.checked`}>Checked / inspected</Label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Isolation and block required */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-700">LOTO: Isolation and Block</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 border rounded-lg space-y-3 bg-red-50 border-red-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <Label className="font-bold text-red-700">Electrical Isolation Required?</Label>
                </div>
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

          {/* Signatures & attendees */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-700">Authorization / Signatures</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="authorizer_name">Name of person authorising for work</Label>
                <Input id="authorizer_name" {...register('authorizer_name')} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="authorizer_signature_date">Date (authoriser signature)</Label>
                <Input type="date" id="authorizer_signature_date" {...register('authorizer_signature_date')} className="mt-1" />
              </div>
            </div>

            <h3 className="font-semibold text-lg text-gray-700 mt-4">Attendees Details</h3>
            <Table>
              <TableHeader>
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
                      <Input {...register(`attendees.${index}.name`)} />
                    </TableCell>
                    <TableCell>
                      <Input {...register(`attendees.${index}.phone`)} />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeAttendee(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full md:w-auto h-12 text-lg" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Permit...
              </>
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