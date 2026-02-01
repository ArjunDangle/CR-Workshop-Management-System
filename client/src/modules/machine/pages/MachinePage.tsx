import React from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getAllMachines, Machine } from '../machineApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Wrench, AlertOctagon, Loader2, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const MachinePage = () => {
  const { data: machines, isLoading } = useQuery({
    queryKey: ['machines-module-list'],
    queryFn: getAllMachines,
    refetchInterval: 10000,
  });

  // Helper Logic: Group machines by Shop Name
  const groupedMachines = machines?.reduce((acc, machine) => {
    const shop = machine.shop_name || 'Unassigned Shop';
    if (!acc[shop]) acc[shop] = [];
    acc[shop].push(machine);
    return acc;
  }, {} as Record<string, any[]>) || {};

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Machine & Plant Assets</h1>
          <Badge variant="outline" className="bg-blue-50">Total Assets: {machines?.length || 0}</Badge>
        </div>

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
                  const isLocked = machine.status === 'UNDER_MAINTENANCE';
                  return (
                    <Card key={machine.id} className={`${isLocked ? 'border-red-300 bg-red-50' : 'bg-green-50/30'}`}>
                      <CardContent className="p-4 flex flex-col items-center gap-2">
                        {isLocked ? 
                          <Lock className="h-6 w-6 text-red-600 animate-pulse" /> : 
                          <Wrench className="h-6 w-6 text-green-600" />
                        }
                        <div className="text-center">
                           <p className="font-bold text-xs">{machine.asset_id}</p>
                           <p className="text-[10px] text-muted-foreground truncate w-24">{machine.name}</p>
                        </div>
                        {isLocked && <Badge variant="destructive" className="text-[8px] h-4">LOTO ACTIVE</Badge>}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default MachinePage;