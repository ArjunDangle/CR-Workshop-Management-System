// src/modules/dashboard/components/OfficeDashboard.tsx
import React from 'react';
import ServiceCard from './ServiceCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// Import icons relevant to Office tasks
import { Wrench, HardHat, AlertTriangle, ClipboardCheck, FolderKanban, Zap, ShieldCheck, MapPinned } from 'lucide-react';


// Define service cards specific to Office dashboard
const officeServices = [
     { title: 'Machine & Plant Management', Icon: Wrench, bgColorClass: 'bg-[hsl(var(--service-card-1-bg))]', href: '/machines' }, // Blue
    // --- THIS LINK IS NOW SET ---
    { title: 'Permit Management', Icon: HardHat, bgColorClass: 'bg-[hsl(var(--service-card-2-bg))]', href: '/permits' },          // Red
    // ---
    { title: 'Incident Management', Icon: AlertTriangle, bgColorClass: 'bg-[hsl(var(--service-card-3-bg))]', href: '/incidents' }, // Lime Green
    { title: 'Contract Management', Icon: ClipboardCheck, bgColorClass: 'bg-[hsl(var(--service-card-4-bg))]', href: '/contracts' }, // Orange
    { title: 'Project Management', Icon: FolderKanban, bgColorClass: 'bg-gradient-to-br from-yellow-400 to-amber-500', href: '/projects' }, // Example Gradient
    { title: 'Power Management', Icon: Zap, bgColorClass: 'bg-gradient-to-br from-cyan-400 to-sky-500', href: '/power' },       // Example Gradient
    { title: 'Compliance', Icon: ShieldCheck, bgColorClass: 'bg-gradient-to-br from-indigo-400 to-purple-500', href: '/compliance' },// Example Gradient
    { title: 'Mapping', Icon: MapPinned, bgColorClass: 'bg-gradient-to-br from-pink-400 to-rose-500', href: '/mapping' },      // Example Gradient
];

const OfficeDashboard = () => {
  return (
    <div className="space-y-8">
      <div className="text-left">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-700">
          Welcome, Office Team!
        </h1>
      </div>

       <h2 className="text-xl font-medium text-gray-600">Office Services</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
         {officeServices.map((service) => (
            <ServiceCard
                key={service.title}
                title={service.title}
                Icon={service.Icon}
                bgColorClass={service.bgColorClass}
                href={service.href} // This will now correctly link to /permits
            />
         ))}
      </div>

       <div className="mt-10">
           <Card>
               <CardHeader><CardTitle className="text-lg font-medium">Announcements</CardTitle></CardHeader>
               <CardContent><p className="text-muted-foreground">Recent announcements will appear here...</p></CardContent>
           </Card>
       </div>
    </div>
  );
};

export default OfficeDashboard;
