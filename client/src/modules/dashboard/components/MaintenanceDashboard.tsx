import React from 'react';
import ServiceCard from './ServiceCard';
import { format } from 'date-fns';
import { 
  Cpu, FileText, AlertTriangle, Users, 
  Briefcase, Zap, Map as MapIcon, ClipboardCheck 
} from 'lucide-react';

const maintenanceServices = [
    { 
        title: 'Machines & Assets', 
        description: 'Registry of workshop machinery and operational status.', 
        Icon: Cpu, 
        bgColorClass: 'bg-[#4378f1]', 
        href: '/machines' 
    },
    { 
        title: 'Permit Management', 
        description: 'Digital safety permits, authorization, and approvals.', 
        Icon: FileText, 
        bgColorClass: 'bg-[#a344fb]', 
        href: '/permits' 
    },
    { 
        title: 'Incident Reports', 
        description: 'Accident logging, investigations, and safety alerts.', 
        Icon: AlertTriangle, 
        bgColorClass: 'bg-[#e53d3d]', 
        href: '/incidents' 
    },
    { 
        title: 'Contractor Hub', 
        description: 'Approved vendor list and worker compliance records.', 
        Icon: Users, 
        bgColorClass: 'bg-[#1cb572]', 
        href: '/contractors' 
    },
    { 
        title: 'Project Tracker', 
        description: 'Infrastructure development and improvement monitoring.', 
        Icon: Briefcase, 
        bgColorClass: 'bg-[#f78b2e]', 
        href: '/projects' 
    },
    { 
        title: 'Power Grid', 
        description: 'Electrical panels, solar generation, and panel access.', 
        Icon: Zap, 
        bgColorClass: 'bg-[#fbc531]', 
        href: '/power' 
    },
    { 
        title: 'Workshop Map', 
        description: 'Visual 3D plant layout and active hazard zones.', 
        Icon: MapIcon, 
        bgColorClass: 'bg-[#4b5563]', 
        href: '/mapping' 
    },
    { 
        title: 'Compliance', 
        description: 'Safety audits, legal documents, and labor records.', 
        Icon: ClipboardCheck, 
        bgColorClass: 'bg-[#21a8d8]', 
        href: '/compliance' 
    },
];

const MaintenanceDashboard = () => {
  return (
    <div className="space-y-12">
      {/* HEADER SECTION - EXACT REPLICA */}
      <div className="space-y-6">
        {/* Date Capsule */}
        <div className="inline-block px-4 py-1.5 rounded-full bg-[#E8E8E8] border border-gray-200">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#707070]">
                {format(new Date(), 'EEEE d MMMM')}
            </span>
        </div>

        {/* Big Greeting */}
        <div className="space-y-4">
          <h1 className="text-7xl font-medium tracking-tight text-gray-900">
            Welcome back, <span className="text-[#8E8E93]">MW.</span>
          </h1>
          <p className="text-xl text-[#8E8E93] max-w-2xl font-medium leading-relaxed">
            The Workshop Management System is operational. Select a module to manage safety and assets.
          </p>
        </div>
      </div>

      {/* GRID SECTION - EXACT GAP AND COLUMN COUNT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-20">
         {maintenanceServices.map((service) => (
            <ServiceCard
                key={service.title}
                title={service.title}
                description={service.description}
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