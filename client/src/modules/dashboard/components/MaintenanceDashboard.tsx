// src/modules/dashboard/components/MaintenanceDashboard.tsx
import React from 'react';
import ServiceCard from './ServiceCard'; // Import the correct ServiceCard
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// Import relevant icons for Maintenance
import { Wrench, HardHat, AlertTriangle, ClipboardCheck, FolderKanban, Zap, ShieldCheck, MapPinned } from 'lucide-react';

// Define service cards specific to the Maintenance dashboard
// Use appropriate CSS variables or gradient classes for bgColorClass
const maintenanceServices = [
    { title: 'Machine & Plant', Icon: Wrench, bgColorClass: 'bg-[hsl(var(--service-card-1-bg))]', href: '/machines' },
    { title: 'Permit Management', Icon: HardHat, bgColorClass: 'bg-[hsl(var(--service-card-2-bg))]', href: '/permits' },
    { title: 'Incident Management', Icon: AlertTriangle, bgColorClass: 'bg-[hsl(var(--service-card-3-bg))]', href: '/incidents' },
    { title: 'Contractors', Icon: ClipboardCheck, bgColorClass: 'bg-[hsl(var(--service-card-4-bg))]', href: '/contracts' },
    { title: 'Projects', Icon: FolderKanban, bgColorClass: 'bg-[hsl(var(--service-card-5-bg))]', href: '/projects' }, // Purple
    { title: 'Power Systems', Icon: Zap, bgColorClass: 'bg-[hsl(var(--service-card-6-bg))]', href: '/power' },       // Teal
    { title: 'Compliance', Icon: ShieldCheck, bgColorClass: 'bg-[hsl(var(--service-card-7-bg))]', href: '/compliance' },// Pink
    { title: 'Mapping', Icon: MapPinned, bgColorClass: 'bg-[hsl(var(--service-card-8-bg))]', href: '/mapping' },      // Yellow
];

const MaintenanceDashboard = () => {
  return (
    <div className="space-y-8"> {/* Add vertical spacing */}

      {/* Welcome Title */}
      <div className="text-left">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-700">
          Welcome, Maintenance Team!
        </h1>
        {/* Optional: Subtitle */}
        {/* <p className="text-muted-foreground mt-1 text-base">Overview of workshop operations.</p> */}
      </div>

       {/* Section Title */}
       <h2 className="text-xl font-medium text-gray-600">Core Services</h2>

      {/* Service Cards Grid - Adjusted column count for responsiveness */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
         {maintenanceServices.map((service) => (
            <ServiceCard
                key={service.title}
                title={service.title}
                Icon={service.Icon}
                bgColorClass={service.bgColorClass}
                href={service.href} // Ensure routes exist or are placeholders
            />
         ))}
      </div>

      {/* Placeholder for other sections like "Recent Activity" */}
       <div className="mt-10">
           <h2 className="text-xl font-medium text-gray-600 mb-4">Recent Activity</h2>
           <Card>
               {/* <CardHeader><CardTitle className="text-lg font-medium">Recent Activity</CardTitle></CardHeader> */}
               <CardContent className="pt-6"> {/* Add padding top if header is removed */}
                 <p className="text-muted-foreground">Activity log or relevant maintenance data will appear here...</p>
                 {/* Example: List of recent work orders, alerts etc. */}
               </CardContent>
           </Card>
       </div>
    </div>
  );
};

export default MaintenanceDashboard;