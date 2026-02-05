// client/src/modules/machine/components/dashboards/SafetyOfficerMachineDashboard.tsx
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Eye,
  Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAllMachines, Machine } from '../../machineApi';

export const SafetyOfficerMachineDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shopFilter, setShopFilter] = useState<string>('all');
  const [safetyLockDialogOpen, setSafetyLockDialogOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [lockAction, setLockAction] = useState<'lock' | 'unlock'>('lock');
  const [lockReason, setLockReason] = useState('');
  const { toast } = useToast();

  const { data: machines = [], isLoading, refetch } = useQuery({
    queryKey: ['machines-module-list'],
    queryFn: getAllMachines,
    refetchInterval: 10000,
  });

  // Mock mutation for safety lock operations
  const safetyLockMutation = useMutation({
    mutationFn: async ({ machineId, action, reason }: { machineId: string; action: 'lock' | 'unlock'; reason?: string }) => {
      // This would call the actual API endpoint
      console.log(`${action} machine ${machineId} with reason: ${reason}`);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Safety Lock Updated',
        description: `Machine safety status has been updated.`,
      });
      setSafetyLockDialogOpen(false);
      setSelectedMachine(null);
      setLockReason('');
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update safety lock',
        variant: 'destructive',
      });
    },
  });

  // Filter machines
  const filteredMachines = machines.filter(machine => {
    const matchesSearch = machine.asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         machine.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || machine.status === statusFilter;
    const matchesShop = shopFilter === 'all' || machine.shop_name === shopFilter;
    return matchesSearch && matchesStatus && matchesShop;
  });

  // Group machines by shop
  const groupedMachines = filteredMachines.reduce((acc, machine) => {
    const shop = machine.shop_name || 'Unassigned Shop';
    if (!acc[shop]) acc[shop] = [];
    acc[shop].push(machine);
    return acc;
  }, {} as Record<string, Machine[]>);

  // Get unique shops for filter
  const uniqueShops = Array.from(new Set(machines.map(m => m.shop_name).filter(Boolean)));

  // Status counts
  const operationalMachines = machines.filter(m => m.status === 'OPERATIONAL').length;
  const underMaintenanceMachines = machines.filter(m => m.status === 'UNDER_MAINTENANCE').length;
  const redTaggedMachines = machines.filter(m => m.safety_lock_status === 'RED_TAG').length;
  const safetyLockedMachines = machines.filter(m => m.safety_lock_status === 'SAFETY_LOCK').length;

  const handleSafetyLock = (machine: Machine, action: 'lock' | 'unlock') => {
    setSelectedMachine(machine);
    setLockAction(action);
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

  const getMachineStatusColor = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return 'bg-green-100 text-green-800';
      case 'UNDER_MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      case 'OUT_OF_SERVICE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSafetyLockIcon = (machine: Machine) => {
    switch (machine.safety_lock_status) {
      case 'RED_TAG':
        return <AlertOctagon className="h-6 w-6 text-red-600 animate-pulse" />;
      case 'SAFETY_LOCK':
        return <Lock className="h-6 w-6 text-orange-600" />;
      default:
        return <Shield className="h-6 w-6 text-green-600" />;
    }
  };

  const getSafetyLockBadge = (machine: Machine) => {
    switch (machine.safety_lock_status) {
      case 'RED_TAG':
        return <Badge variant="destructive" className="text-xs">RED TAG</Badge>;
      case 'SAFETY_LOCK':
        return <Badge className="bg-orange-100 text-orange-800 text-xs">SAFETY LOCK</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800 text-xs">CLEARED</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Machine Safety Control</h1>
        <p className="text-gray-600 mt-1">Safety Officer view - Manage machine safety locks</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Operational</p>
                <p className="text-2xl font-bold text-green-600">{operationalMachines}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Under Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">{underMaintenanceMachines}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Safety Locked</p>
                <p className="text-2xl font-bold text-orange-600">{safetyLockedMachines}</p>
              </div>
              <Lock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Red Tagged</p>
                <p className="text-2xl font-bold text-red-600">{redTaggedMachines}</p>
              </div>
              <AlertOctagon className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Safety Alert */}
      {(redTaggedMachines > 0 || safetyLockedMachines > 0) && (
        <Alert className="bg-orange-50 border-orange-200">
          <Shield className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {redTaggedMachines} RED TAGGED and {safetyLockedMachines} SAFETY LOCKED machines require your attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search machines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
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
              <SelectTrigger className="w-48">
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by shop" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shops</SelectItem>
                {uniqueShops.map((shop) => (
                  <SelectItem key={shop} value={shop}>{shop}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Machines by Shop */}
      {isLoading ? (
        <div className="space-y-8">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ) : (
        Object.entries(groupedMachines).map(([shopName, shopMachines]) => (
          <section key={shopName} className="space-y-4">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold uppercase tracking-wider">{shopName}</h2>
              <span className="text-sm font-normal text-muted-foreground">({shopMachines.length} units)</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {shopMachines.map((machine) => {
                const isRedTagged = machine.safety_lock_status === 'RED_TAG';
                const isSafetyLocked = machine.safety_lock_status === 'SAFETY_LOCK';
                
                return (
                  <Card 
                    key={machine.id} 
                    className={cn(
                      "relative transition-all hover:shadow-md",
                      isRedTagged && "border-2 border-red-500 bg-red-50",
                      isSafetyLocked && "border-2 border-orange-500 bg-orange-50",
                      !isRedTagged && !isSafetyLocked && "bg-green-50/30"
                    )}
                  >
                    <CardContent className="p-4 flex flex-col items-center gap-2">
                      {getSafetyLockIcon(machine)}
                      <div className="text-center">
                        <p className="font-bold text-xs">{machine.asset_id}</p>
                        <p className="text-[10px] text-muted-foreground truncate w-24">{machine.name}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge className={getMachineStatusColor(machine.status)} variant="outline">
                          {machine.status.replace('_', ' ')}
                        </Badge>
                        {getSafetyLockBadge(machine)}
                      </div>
                      <div className="flex gap-1 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {isRedTagged || isSafetyLocked ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-green-600 hover:text-green-700"
                            onClick={() => handleSafetyLock(machine, 'unlock')}
                          >
                            <Unlock className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-red-600 hover:text-red-700"
                            onClick={() => handleSafetyLock(machine, 'lock')}
                          >
                            <Ban className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))
      )}

      {/* Safety Lock Dialog */}
      <Dialog open={safetyLockDialogOpen} onOpenChange={setSafetyLockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {lockAction === 'lock' ? 'Apply Safety Lock' : 'Remove Safety Lock'}
            </DialogTitle>
          </DialogHeader>
          {selectedMachine && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedMachine.asset_id}</p>
                <p className="text-sm text-gray-600">{selectedMachine.name}</p>
                <p className="text-sm text-gray-600">{selectedMachine.shop_name}</p>
              </div>
              
              {lockAction === 'lock' && (
                <div>
                  <Label htmlFor="lockReason">Reason for Safety Lock *</Label>
                  <Textarea
                    id="lockReason"
                    placeholder="Enter reason for applying safety lock..."
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {lockAction === 'unlock' && (
                <Alert>
                  <Unlock className="h-4 w-4" />
                  <AlertDescription>
                    Are you sure you want to remove the safety lock from this machine? 
                    This will allow maintenance personnel to operate the machine.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-3">
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
                  {safetyLockMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {lockAction === 'lock' ? 'Apply Lock' : 'Remove Lock'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};