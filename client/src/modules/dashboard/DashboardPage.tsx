// src/modules/dashboard/components/MaintenanceDashboard.tsx
import React from 'react';
import ServiceCard from './components/ServiceCard'; // Correct path
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// --- End Add ---
import { Wrench, HardHat, AlertTriangle, ClipboardCheck, FolderKanban, Zap, ShieldCheck, MapPinned } from 'lucide-react';

// Define service cards specific to this dashboard
const maintenanceServices = [
    { title: 'Machine & Plant', Icon: Wrench, bgColorClass: 'bg-[hsl(var(--service-card-1-bg))]', href: '/machines' }, // Example route
    { title: 'Permit Mgmt', Icon: HardHat, bgColorClass: 'bg-[hsl(var(--service-card-2-bg))]', href: '/permits' },
    { title: 'Incident Mgmt', Icon: AlertTriangle, bgColorClass: 'bg-[hsl(var(--service-card-3-bg))]', href: '/incidents' },
    { title: 'Contractors', Icon: ClipboardCheck, bgColorClass: 'bg-[hsl(var(--service-card-4-bg))]', href: '/contracts' },
    // Add more up to 8 as needed
];

const MaintenanceDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Title */}
      <div className="text-left mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Welcome, Maintenance Team!
        </h1>
        {/* <p className="text-muted-foreground mt-1 text-base">Overview of your tasks.</p> */}
      </div>

       {/* Section Title */}
       <h2 className="text-xl font-medium text-foreground">Core Services</h2>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
         {maintenanceServices.map((service) => (
            <ServiceCard
                key={service.title}
                title={service.title}
                Icon={service.Icon}
                bgColorClass={service.bgColorClass}
                href={service.href}
            />
         ))}
         {/* Add more cards or placeholders if needed */}
      </div>

      {/* Add other sections like tables or charts below */}
       <div className="mt-8">
           {/* Placeholder for future tables/data */}
           <Card>
               <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
               <CardContent><p className="text-muted-foreground">Activity log will appear here...</p></CardContent>
           </Card>
       </div>
    </div>
  );
};

export default MaintenanceDashboard;