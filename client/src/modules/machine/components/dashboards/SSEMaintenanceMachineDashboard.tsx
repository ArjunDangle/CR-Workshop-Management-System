import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
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
  ShieldAlert
} from 'lucide-react';

// Go UP 2 levels to find the API
import { machineApi, Machine } from '../../machineApi';

// Go UP 1 level to find the components
import { MachineCard } from '../MachineCard';
import { MachineDetailSheet } from '../MachineDetailSheet';

export const SSEMaintenanceMachineDashboard: React.FC = () => {
  // --- State (Preserved) ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shopFilter, setShopFilter] = useState<string>('all');
  
  // --- New State for Interactivity ---
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { toast } = useToast();

  // --- Data Fetching (Preserved) ---
  const { data: machines = [], isLoading } = useQuery({
    queryKey: ['machines-module-list'],
    queryFn: machineApi.getAll, // Uses your new API wrapper
    refetchInterval: 10000,
  });

  // --- Filter Logic (Preserved) ---
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
  const outOfServiceMachines = machines.filter(m => m.status === 'OUT_OF_SERVICE').length;
  const redTaggedMachines = machines.filter(m => m.safety_lock_status === 'RED_TAG').length;

  // --- Handlers ---
  const handleView = (machine: Machine) => {
    setSelectedMachine(machine);
    setIsSheetOpen(true);
  };

  const handleReportFault = (machine: Machine) => {
    // Placeholder for your future "Report Fault" Modal
    toast({
      title: "Fault Reporting",
      description: `Initiating fault report for ${machine.asset_id}...`,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-8 h-8 text-blue-600" /> Machine & Plant Assets
        </h1>
        <p className="text-gray-600 mt-1">Maintenance view - Monitor health and manage repairs</p>
      </div>

      {/* KPI Cards (Preserved Visuals) */}
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
              <Wrench className="h-8 w-8 text-yellow-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-l-4 border-l-gray-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Out of Service</p>
                <p className="text-2xl font-bold text-gray-600">{outOfServiceMachines}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-100" />
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

      {/* Red Tag Alert (Preserved) */}
      {redTaggedMachines > 0 && (
        <Alert className="bg-red-50 border-red-200">
          <AlertOctagon className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">
            CRITICAL: {redTaggedMachines} machine(s) are RED TAGGED. Operation is strictly prohibited.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters (Preserved) */}
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

      {/* Machines by Shop - VISUAL UPGRADE */}
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
            
            {/* Replaced Custom Grid with Standard MachineCard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {shopMachines.map((machine) => (
                <MachineCard 
                    key={machine.id} 
                    machine={machine} 
                    onView={handleView}
                    // Maintenance Specific Features
                    showReportFault={true}
                    onReportFault={handleReportFault}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {/* Info Notice (Preserved) */}
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

      {/* Slider Component */}
      <MachineDetailSheet 
        machine={selectedMachine} 
        isOpen={isSheetOpen} 
        onClose={() => setIsSheetOpen(false)} 
      />
    </div>
  );
};