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
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Lock, 
  AlertOctagon, 
  Unlock, 
  Loader2, 
  MapPin, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  ShieldAlert
} from 'lucide-react';

// --- Imports from your architecture ---


// FIX: Change '../components/MachineCard' to '../MachineCard'
// Go UP 2 levels to find the API (out of dashboards -> out of components -> machine root)
import { getAllMachines, Machine } from '../../machineApi';

// Go UP 1 level to find the components (out of dashboards -> components folder)
import { MachineCard } from '../MachineCard'; 
import { MachineDetailSheet } from '../MachineDetailSheet';

export const SafetyOfficerMachineDashboard: React.FC = () => {
  // --- State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shopFilter, setShopFilter] = useState<string>('all');
  
  // Dialog State (Locking)
  const [safetyLockDialogOpen, setSafetyLockDialogOpen] = useState(false);
  const [lockAction, setLockAction] = useState<'lock' | 'unlock'>('lock');
  const [lockReason, setLockReason] = useState('');
  
  // Selection State
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null); // For Locking
  const [viewMachine, setViewMachine] = useState<Machine | null>(null);         // For Viewing Sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { toast } = useToast();

  // --- Data Fetching (React Query - Preserved) ---
  const { data: machines = [], isLoading, refetch } = useQuery({
    queryKey: ['machines-module-list'],
    queryFn: getAllMachines,
    refetchInterval: 10000,
  });

  // --- Mutation (Preserved) ---
  const safetyLockMutation = useMutation({
    mutationFn: async ({ machineId, action, reason }: { machineId: string; action: 'lock' | 'unlock'; reason?: string }) => {
      // NOTE: Connect this to your real API endpoint when ready.
      // await api.post(`/machines/${machineId}/safety-lock`, { action, reason });
      console.log(`${action} machine ${machineId} with reason: ${reason}`);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Safety Lock Updated',
        description: `Machine safety status has been updated successfully.`,
      });
      setSafetyLockDialogOpen(false);
      setSelectedMachine(null);
      setLockReason('');
      refetch(); // Refresh list
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update safety lock',
        variant: 'destructive',
      });
    },
  });

  // --- Filtering Logic (Preserved) ---
  const filteredMachines = machines.filter(machine => {
    const matchesSearch = machine.asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         machine.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || machine.status === statusFilter;
    const matchesShop = shopFilter === 'all' || machine.shop_name === shopFilter;
    return matchesSearch && matchesStatus && matchesShop;
  });

  // --- Grouping Logic (Preserved) ---
  const groupedMachines = filteredMachines.reduce((acc, machine) => {
    const shop = machine.shop_name || 'Unassigned Shop';
    if (!acc[shop]) acc[shop] = [];
    acc[shop].push(machine);
    return acc;
  }, {} as Record<string, Machine[]>);

  const uniqueShops = Array.from(new Set(machines.map(m => m.shop_name).filter(Boolean)));

  // --- KPI Counts (Preserved) ---
  const operationalMachines = machines.filter(m => m.status === 'OPERATIONAL').length;
  const underMaintenanceMachines = machines.filter(m => m.status === 'UNDER_MAINTENANCE').length;
  const redTaggedMachines = machines.filter(m => m.safety_lock_status === 'RED_TAG').length;
  const safetyLockedMachines = machines.filter(m => m.safety_lock_status === 'SAFETY_LOCK').length;

  // --- Handlers ---
  
  // Opens the slider (View Only)
  const handleView = (machine: Machine) => {
    setViewMachine(machine);
    setIsSheetOpen(true);
  };

  // Opens the Lock/Unlock Dialog
  const handleSafetyActionClick = (machine: Machine) => {
    const isLocked = machine.safety_lock_status === 'SAFETY_LOCK' || machine.safety_lock_status === 'RED_TAG';
    setSelectedMachine(machine);
    setLockAction(isLocked ? 'unlock' : 'lock');
    setSafetyLockDialogOpen(true);
  };

  const confirmSafetyLock = () => {
    if (!selectedMachine) return;
    safetyLockMutation.mutate({
      machineId: selectedMachine.id,
      action: lockAction,
      reason: lockReason
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
           <ShieldAlert className="w-8 h-8 text-orange-600" /> Machine Safety Control
        </h1>
        <p className="text-gray-600 mt-1">Manage LOTO (Lock Out Tag Out) and safety compliance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Operational</p>
                <p className="text-2xl font-bold text-green-600">{operationalMachines}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Under Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">{underMaintenanceMachines}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Safety Locked</p>
                <p className="text-2xl font-bold text-orange-600">{safetyLockedMachines}</p>
              </div>
              <Lock className="h-8 w-8 text-orange-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Red Tagged</p>
                <p className="text-2xl font-bold text-red-600">{redTaggedMachines}</p>
              </div>
              <AlertOctagon className="h-8 w-8 text-red-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Safety Alert Banner */}
      {(redTaggedMachines > 0 || safetyLockedMachines > 0) && (
        <Alert className="bg-orange-50 border-orange-200">
          <Shield className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 font-medium">
            Attention: {redTaggedMachines} Red Tagged and {safetyLockedMachines} Safety Locked machines currently on the floor.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by Asset ID or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPERATIONAL">Operational</SelectItem>
                <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
              </SelectContent>
            </Select>
            <Select value={shopFilter} onValueChange={setShopFilter}>
              <SelectTrigger className="w-full md:w-48">
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by shop" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shops</SelectItem>
                {uniqueShops.map((shop) => (
                  <SelectItem key={shop} value={shop as string}>{shop}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Machines grouped by Shop */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      ) : (
        Object.entries(groupedMachines).map(([shopName, shopMachines]) => (
          <section key={shopName} className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              <h2 className="text-xl font-bold uppercase tracking-wider text-gray-700">{shopName}</h2>
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                {shopMachines.length} units
              </span>
            </div>
            
            {/* Grid Layout using New MachineCard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {shopMachines.map((machine) => (
                <MachineCard 
                    key={machine.id} 
                    machine={machine} 
                    onView={handleView}
                    
                    // Safety Specific Props
                    showSafetyAction={true}
                    onSafetyAction={handleSafetyActionClick}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {/* --- Dialogs --- */}

      {/* 1. View Detail Slider */}
      <MachineDetailSheet 
        machine={viewMachine}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />

      {/* 2. Safety Lock Action Dialog (Preserved functionality) */}
      <Dialog open={safetyLockDialogOpen} onOpenChange={setSafetyLockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {lockAction === 'lock' ? (
                <><Lock className="w-5 h-5 text-red-600"/> Apply Safety Lock</>
              ) : (
                <><Unlock className="w-5 h-5 text-green-600"/> Remove Safety Lock</>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMachine && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg border">
                <p className="font-bold text-lg">{selectedMachine.asset_id}</p>
                <p className="text-sm text-gray-600">{selectedMachine.name}</p>
                <p className="text-xs text-gray-500 mt-1">{selectedMachine.shop_name}</p>
              </div>
              
              {lockAction === 'lock' && (
                <div className="space-y-2">
                  <Label htmlFor="lockReason">Reason for LOTO (Lock Out) *</Label>
                  <Textarea
                    id="lockReason"
                    placeholder="E.g., Electrical fault investigation, Moving parts exposed..."
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              )}

              {lockAction === 'unlock' && (
                <Alert className="bg-green-50 border-green-200">
                  <Unlock className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 text-sm">
                    Confirm removal of safety lock? Ensure the machine is safe to operate before proceeding.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSafetyLockDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmSafetyLock}
                  disabled={lockAction === 'lock' && !lockReason.trim()}
                  className={lockAction === 'lock' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                >
                  {safetyLockMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {lockAction === 'lock' ? 'Confirm Lock' : 'Confirm Unlock'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};