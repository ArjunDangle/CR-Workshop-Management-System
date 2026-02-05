// src/modules/dashboard/components/MaintenanceDashboard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import ServiceCard from './ServiceCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Wrench, 
  HardHat, 
  AlertTriangle, 
  ClipboardCheck, 
  FolderKanban, 
  Zap, 
  ShieldCheck, 
  MapPinned,
  Lock,
  CheckCircle2,
  AlertOctagon,
  RefreshCw
} from 'lucide-react';

// --- API Import ---
import { getAllMachines } from '@/modules/machine/machineApi';

// Define service cards specific to the Maintenance dashboard
const maintenanceServices = [
    { title: 'Machine & Plant', Icon: Wrench, bgColorClass: 'bg-[hsl(var(--service-card-1-bg))]', href: '/machines' },
    { title: 'Permit Management', Icon: HardHat, bgColorClass: 'bg-[hsl(var(--service-card-2-bg))]', href: '/permits' },
    { title: 'Incident Management', Icon: AlertTriangle, bgColorClass: 'bg-[hsl(var(--service-card-3-bg))]', href: '/incidents' },
    { title: 'Contractors', Icon: ClipboardCheck, bgColorClass: 'bg-[hsl(var(--service-card-4-bg))]', href: '/contractors' }, // FIX: Was '/contracts'
    { title: 'Projects', Icon: FolderKanban, bgColorClass: 'bg-[hsl(var(--service-card-5-bg))]', href: '/projects' },
    { title: 'Power Systems', Icon: Zap, bgColorClass: 'bg-[hsl(var(--service-card-6-bg))]', href: '/power' },
    { title: 'Compliance', Icon: ShieldCheck, bgColorClass: 'bg-[hsl(var(--service-card-7-bg))]', href: '/compliance' },
    { title: 'Mapping', Icon: MapPinned, bgColorClass: 'bg-[hsl(var(--service-card-8-bg))]', href: '/mapping' },
];

const MaintenanceDashboard = () => {
  // --- Live Machine Status Fetching ---
  const { data: machines, isLoading } = useQuery({
    queryKey: ['machines-live-status'],
    queryFn: getAllMachines,
    refetchInterval: 5000, // Poll every 5 seconds for live LOTO updates
  });

  // Calculate stats
  const totalMachines = machines?.length || 0;
  const lockedMachines = machines?.filter(m => m.status === 'UNDER_MAINTENANCE').length || 0;
  const operationalMachines = machines?.filter(m => m.status === 'OPERATIONAL').length || 0;

  return (
    <div className="space-y-8">
      {/* Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-700">
            Welcome, Maintenance Team!
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of workshop operations and safety status.
          </p>
        </div>
        
        {/* Quick Stats Pills */}
        {!isLoading && (
          <div className="flex gap-3">
            <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="w-3 h-3 mr-2" />
              {operationalMachines} Operational
            </Badge>
            <Badge variant="outline" className={`px-3 py-1 border-red-200 ${lockedMachines > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-50 text-gray-500'}`}>
              <Lock className="w-3 h-3 mr-2" />
              {lockedMachines} Locked (LOTO)
            </Badge>
          </div>
        )}
      </div>

       {/* Section 1: Core Services */}
       <h2 className="text-xl font-medium text-gray-600">Core Services</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
         {maintenanceServices.map((service) => (
            <ServiceCard
                key={service.title}
                title={service.title}
                Icon={service.Icon}
                bgColorClass={service.bgColorClass}
                href={service.href}
            />
         ))}
      </div>
    </div>
  );
};

export default MaintenanceDashboard;