// FILE: client/src/modules/machine/components/dashboards/SafetyOfficerMachineDashboard.tsx
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge'; // FIX: Added missing Badge import
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock, AlertOctagon, Unlock, Loader2, MapPin, Search, Filter, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

import { machineApi, Machine } from '../../machineApi';
import { MachineCard } from '../MachineCard'; 
import { MachineDetailSheet } from '../MachineDetailSheet';

export const SafetyOfficerMachineDashboard: React.FC = () => {
  const[searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all'); 
  
  const[safetyLockDialogOpen, setSafetyLockDialogOpen] = useState(false);
  const [lockAction, setLockAction] = useState<'lock' | 'unlock'>('lock');
  const [lockReason, setLockReason] = useState('');
  
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null); 
  const [viewMachine, setViewMachine] = useState<Machine | null>(null);         
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { toast } = useToast();

  const { data: machines =[], isLoading, refetch } = useQuery({
    queryKey: ['machines-module-list'],
    queryFn: machineApi.getAll,
    refetchInterval: 10000,
  });

  const safetyLockMutation = useMutation({
    mutationFn: async ({ machineId, action, reason }: { machineId: string; action: 'lock' | 'unlock'; reason?: string }) => {
      console.log(`${action} machine ${machineId} with reason: ${reason}`);
      return { success: true };
    },
    onSuccess: () => {
      toast({ title: 'Safety Lock Updated', description: `Machine safety status has been updated successfully.` });
      setSafetyLockDialogOpen(false); setSelectedMachine(null); setLockReason(''); refetch(); 
    }
  });

  const filteredMachines = machines.filter(machine => {
    const matchesSearch = machine.asset_id.toLowerCase().includes(searchTerm.toLowerCase()) || machine.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || machine.status === statusFilter;
    const matchesZone = zoneFilter === 'all' || machine.workspace_zone === zoneFilter; 
    return matchesSearch && matchesStatus && matchesZone;
  });

  const groupedMachines = filteredMachines.reduce((acc, machine) => {
    const zone = machine.workspace_zone || 'General Zone';
    if (!acc[zone]) acc[zone] = [];
    acc[zone].push(machine);
    return acc;
  }, {} as Record<string, Machine[]>);

  const uniqueZones = Array.from(new Set(machines.map(m => m.workspace_zone).filter(Boolean)));

  const operationalMachines = machines.filter(m => m.status === 'OPERATIONAL').length;
  const underMaintenanceMachines = machines.filter(m => m.status === 'UNDER_MAINTENANCE').length;
  const redTaggedMachines = machines.filter(m => m.status === 'RED_TAG').length;
  const safetyLockedMachines = machines.filter(m => m.status === 'SAFETY_LOCK').length;

  const handleView = (machine: Machine) => { setViewMachine(machine); setIsSheetOpen(true); };

  const handleSafetyActionClick = (machine: Machine) => {
    const isLocked = machine.status === 'SAFETY_LOCK' || machine.status === 'RED_TAG';
    setSelectedMachine(machine); setLockAction(isLocked ? 'unlock' : 'lock'); setSafetyLockDialogOpen(true);
  };

  const confirmSafetyLock = () => {
    if (!selectedMachine) return;
    safetyLockMutation.mutate({ machineId: selectedMachine.id, action: lockAction, reason: lockReason });
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2"><ShieldAlert className="w-8 h-8 text-orange-600" /> Machine Safety Control</h1>
        <p className="text-gray-600 mt-1">Manage LOTO (Lock Out Tag Out) and safety compliance across workshop zones.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border-l-4 border-l-green-500 rounded-2xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 font-medium">Operational</p><p className="text-2xl font-bold text-green-600">{operationalMachines}</p></div><CheckCircle2 className="h-8 w-8 text-green-100" /></div></CardContent></Card>
        <Card className="bg-white shadow-sm border-l-4 border-l-yellow-500 rounded-2xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 font-medium">Under Maintenance</p><p className="text-2xl font-bold text-yellow-600">{underMaintenanceMachines}</p></div><Clock className="h-8 w-8 text-yellow-100" /></div></CardContent></Card>
        <Card className="bg-white shadow-sm border-l-4 border-l-orange-500 rounded-2xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 font-medium">Safety Locked</p><p className="text-2xl font-bold text-orange-600">{safetyLockedMachines}</p></div><Lock className="h-8 w-8 text-orange-100" /></div></CardContent></Card>
        <Card className="bg-white shadow-sm border-l-4 border-l-red-500 rounded-2xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 font-medium">Red Tagged</p><p className="text-2xl font-bold text-red-600">{redTaggedMachines}</p></div><AlertOctagon className="h-8 w-8 text-red-100" /></div></CardContent></Card>
      </div>

      {(redTaggedMachines > 0 || safetyLockedMachines > 0) && (
        <Alert className="bg-orange-50 border-orange-200 rounded-xl">
          <Shield className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 font-medium">Attention: {redTaggedMachines} Red Tagged and {safetyLockedMachines} Safety Locked machines currently on the floor.</AlertDescription>
        </Alert>
      )}

      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search by Asset ID or Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 rounded-xl" />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 rounded-xl"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPERATIONAL">Operational</SelectItem>
                <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
              </SelectContent>
            </Select>
            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="w-full md:w-48 rounded-xl"><MapPin className="h-4 w-4 mr-2" /><SelectValue placeholder="Filter by Zone" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {uniqueZones.map((zone) => (<SelectItem key={zone} value={zone as string}>{zone}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>
      ) : (
        Object.entries(groupedMachines).map(([zoneName, zoneMachines]) => (
          <section key={zoneName} className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-800">{zoneName}</h2>
                </div>
                <Badge variant="secondary" className="rounded-full">{zoneMachines.length} Assets</Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {zoneMachines.map((machine) => (
                <MachineCard key={machine.id} machine={machine} onView={handleView} showSafetyAction={true} onSafetyAction={handleSafetyActionClick} />
              ))}
            </div>
          </section>
        ))
      )}

      <MachineDetailSheet machine={viewMachine} isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} />

      <Dialog open={safetyLockDialogOpen} onOpenChange={setSafetyLockDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2">{lockAction === 'lock' ? <><Lock className="w-5 h-5 text-red-600"/> Apply Safety Lock</> : <><Unlock className="w-5 h-5 text-green-600"/> Remove Safety Lock</>}</DialogTitle></DialogHeader>
          {selectedMachine && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border">
                <p className="font-bold text-lg">{selectedMachine.asset_id}</p>
                <p className="text-sm text-gray-600">{selectedMachine.name}</p>
                <p className="text-xs text-gray-500 mt-1">{selectedMachine.workspace_zone}</p>
              </div>
              {lockAction === 'lock' && (
                <div className="space-y-2"><Label htmlFor="lockReason">Reason for LOTO (Lock Out) *</Label><Textarea id="lockReason" placeholder="E.g., Electrical fault investigation..." value={lockReason} onChange={(e) => setLockReason(e.target.value)} rows={3} className="resize-none rounded-xl" /></div>
              )}
              {lockAction === 'unlock' && (
                <Alert className="bg-green-50 border-green-200 rounded-xl"><Unlock className="h-4 w-4 text-green-600" /><AlertDescription className="text-green-800 text-sm">Confirm removal of safety lock? Ensure the machine is safe to operate.</AlertDescription></Alert>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setSafetyLockDialogOpen(false)}>Cancel</Button>
                <Button onClick={confirmSafetyLock} disabled={lockAction === 'lock' && !lockReason.trim()} className={lockAction === 'lock' ? 'bg-red-600 hover:bg-red-700 rounded-xl' : 'bg-green-600 hover:bg-green-700 rounded-xl'}>
                    {safetyLockMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} {lockAction === 'lock' ? 'Confirm Lock' : 'Confirm Unlock'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};