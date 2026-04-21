// FILE: client/src/modules/machine/components/dashboards/SSEMaintenanceMachineDashboard.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Wrench, Lock, AlertOctagon, Loader2, MapPin, Search, Filter, CheckCircle2, Clock } from 'lucide-react';

import { machineApi, Machine } from '../../machineApi';
import { MachineCard } from '../MachineCard';
import { MachineDetailSheet } from '../MachineDetailSheet';

// NEW: Import the ReportIncidentDialog
import { ReportIncidentDialog } from '@/modules/incident/components/widgets/ReportIncidentDialog';

export const SSEMaintenanceMachineDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const[statusFilter, setStatusFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const[isSheetOpen, setIsSheetOpen] = useState(false);

  // NEW: State for Fault Reporting Dialog
  const [faultMachine, setFaultMachine] = useState<Machine | null>(null);
  const[isFaultDialogOpen, setIsFaultDialogOpen] = useState(false);

  const { data: machines =[], isLoading } = useQuery({
    queryKey: ['machines-module-list'],
    queryFn: machineApi.getAll,
    refetchInterval: 10000,
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
  const outOfServiceMachines = machines.filter(m => m.status === 'OUT_OF_SERVICE').length;
  const redTaggedMachines = machines.filter(m => m.status === 'RED_TAG').length;

  const handleView = (machine: Machine) => {
    setSelectedMachine(machine);
    setIsSheetOpen(true);
  };

  // NEW: Open Fault Dialog with the clicked machine
  const handleReportFault = (machine: Machine) => {
    setFaultMachine(machine);
    setIsFaultDialogOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-8 h-8 text-blue-600" /> Machine & Plant Assets
        </h1>
        <p className="text-gray-600 mt-1">Maintenance view - Monitor health and manage repairs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border-l-4 border-l-green-500 rounded-2xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 font-medium">Operational</p><p className="text-2xl font-bold text-green-600">{operationalMachines}</p></div><CheckCircle2 className="h-8 w-8 text-green-100" /></div></CardContent></Card>
        <Card className="bg-white shadow-sm border-l-4 border-l-yellow-500 rounded-2xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 font-medium">Under Maintenance</p><p className="text-2xl font-bold text-yellow-600">{underMaintenanceMachines}</p></div><Wrench className="h-8 w-8 text-yellow-100" /></div></CardContent></Card>
        <Card className="bg-white shadow-sm border-l-4 border-l-gray-500 rounded-2xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 font-medium">Out of Service</p><p className="text-2xl font-bold text-gray-600">{outOfServiceMachines}</p></div><Clock className="h-8 w-8 text-gray-100" /></div></CardContent></Card>
        <Card className="bg-white shadow-sm border-l-4 border-l-red-500 rounded-2xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 font-medium">Red Tagged</p><p className="text-2xl font-bold text-red-600">{redTaggedMachines}</p></div><AlertOctagon className="h-8 w-8 text-red-100" /></div></CardContent></Card>
      </div>

      {redTaggedMachines > 0 && (
        <Alert className="bg-red-50 border-red-200 rounded-xl">
          <AlertOctagon className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">CRITICAL: {redTaggedMachines} machine(s) are RED TAGGED. Operation is strictly prohibited.</AlertDescription>
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
                <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-blue-600" /><h2 className="text-xl font-bold text-gray-800">{zoneName}</h2></div>
                <Badge variant="secondary" className="rounded-full">{zoneMachines.length} Assets</Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {zoneMachines.map((machine) => (
                <MachineCard 
                    key={machine.id} 
                    machine={machine} 
                    onView={handleView}
                    showReportFault={true}
                    onReportFault={handleReportFault}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <MachineDetailSheet machine={selectedMachine} isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} />

      {/* NEW: Fault Reporting Dialog connected directly to the Incident Module */}
      <ReportIncidentDialog 
        open={isFaultDialogOpen} 
        onOpenChange={(open) => {
            setIsFaultDialogOpen(open);
            if (!open) setFaultMachine(null); 
        }} 
        initialMachine={faultMachine}
      />
    </div>
  );
};