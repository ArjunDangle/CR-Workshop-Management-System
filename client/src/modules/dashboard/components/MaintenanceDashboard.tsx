// src/modules/dashboard/components/MaintenanceDashboard.tsx
import React from 'react';
import ServiceCard from './ServiceCard'; // Import the correct ServiceCard
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// Import relevant icons for Maintenance
import { Wrench, HardHat, AlertTriangle, ClipboardCheck, FolderKanban, Zap, ShieldCheck, MapPinned } from 'lucide-react';

// Define service cards specific to the Maintenance dashboard
const maintenanceServices = [
    { title: 'Machine & Plant', Icon: Wrench, bgColorClass: 'bg-[hsl(var(--service-card-1-bg))]', href: '/machines' },
    // --- THIS LINK IS NOW SET ---
    { title: 'Permit Management', Icon: HardHat, bgColorClass: 'bg-[hsl(var(--service-card-2-bg))]', href: '/permits' },
    // ---
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
                href={service.href} // This will now correctly link to /permits
            />
         ))}
      </div>

      {/* Placeholder for other sections like "Recent Activity" */}
       <div className="mt-10">
           <h2 className="text-xl font-medium text-gray-600 mb-4">Recent Activity</h2>
           <Card>
               <CardContent className="pt-6"> {/* Add padding top if header is removed */}
                 <p className="text-muted-foreground">Activity log or relevant maintenance data will appear here...</p>
               </CardContent>
           </Card>
       </div>
    </div>
  );
};

export default MaintenanceDashboard;
