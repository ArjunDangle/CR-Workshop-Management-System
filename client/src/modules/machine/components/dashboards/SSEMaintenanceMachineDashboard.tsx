// client/src/modules/machine/components/dashboards/SSEMaintenanceMachineDashboard.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wrench, 
  Lock, 
  AlertOctagon, 
  Loader2, 
  MapPin, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAllMachines, Machine } from '../../machineApi';

export const SSEMaintenanceMachineDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shopFilter, setShopFilter] = useState<string>('all');

  const { data: machines = [], isLoading } = useQuery({
    queryKey: ['machines-module-list'],
    queryFn: getAllMachines,
    refetchInterval: 10000,
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
  const outOfServiceMachines = machines.filter(m => m.status === 'OUT_OF_SERVICE').length;
  const redTaggedMachines = machines.filter(m => m.safety_lock_status === 'RED_TAG').length;

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
        return <Wrench className="h-6 w-6 text-green-600" />;
    }
  };

  const getSafetyLockBadge = (machine: Machine) => {
    switch (machine.safety_lock_status) {
      case 'RED_TAG':
        return <Badge variant="destructive" className="text-xs">RED TAG</Badge>;
      case 'SAFETY_LOCK':
        return <Badge className="bg-orange-100 text-orange-800 text-xs">SAFETY LOCK</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Machine & Plant Assets</h1>
        <p className="text-gray-600 mt-1">Maintenance view - Manage machine operations</p>
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
              <Wrench className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Service</p>
                <p className="text-2xl font-bold text-gray-600">{outOfServiceMachines}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-500" />
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

      {/* Safety Lock Alert */}
      {redTaggedMachines > 0 && (
        <Alert className="bg-red-50 border-red-200">
          <AlertOctagon className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {redTaggedMachines} machine(s) are RED TAGGED. These cannot be operated under any circumstances.
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
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
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
                const isUnderMaintenance = machine.status === 'UNDER_MAINTENANCE';
                
                return (
                  <Card 
                    key={machine.id} 
                    className={cn(
                      "relative transition-all hover:shadow-md",
                      isRedTagged && "border-2 border-red-500 bg-red-50",
                      isSafetyLocked && "border-2 border-orange-500 bg-orange-50",
                      isUnderMaintenance && "border-yellow-300 bg-yellow-50",
                      !isRedTagged && !isSafetyLocked && !isUnderMaintenance && "bg-green-50/30"
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        disabled={isRedTagged}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {isRedTagged ? 'Locked' : 'View'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))
      )}

      {/* Info Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Safety Lock Information</h3>
              <p className="text-blue-700 text-sm mt-1">
                RED TAGGED machines cannot be operated. SAFETY LOCKED machines require safety officer clearance. 
                Contact Safety Officer for any safety lock removal requests.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};