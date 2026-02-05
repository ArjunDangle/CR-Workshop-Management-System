import React from 'react';
import ServiceCard from './ServiceCard';
import { format } from 'date-fns';
import { 
  Cpu, FileText, AlertTriangle, Users, 
  Briefcase, Zap, Map as MapIcon, ClipboardCheck 
} from 'lucide-react';

const officeServices = [
    { 
        title: 'Machines & Assets', 
        description: 'Inventory management and lifecycle tracking of workshop assets.', 
        Icon: Cpu, 
        bgColorClass: 'bg-[#4378f1]', 
        href: '/machines' 
    },
    { 
        title: 'Permit Management', 
        description: 'Administrative oversight of active and pending work authorizations.', 
        Icon: FileText, 
        bgColorClass: 'bg-[#a344fb]', 
        href: '/permits' 
    },
    { 
        title: 'Incident Logs', 
        description: 'Review of safety alerts and historical accident reports.', 
        Icon: AlertTriangle, 
        bgColorClass: 'bg-[#e53d3d]', 
        href: '/incidents' 
    },
    { 
        title: 'Contractor Management', 
        description: 'Vendor onboarding, insurance renewal, and document compliance.', 
        Icon: Users, 
        bgColorClass: 'bg-[#1cb572]', 
        href: '/contractors' 
    },
    { 
        title: 'Workforce Tracker', 
        description: 'Monitoring project timelines and staff resource allocation.', 
        Icon: Briefcase, 
        bgColorClass: 'bg-[#f78b2e]', 
        href: '/projects' 
    },
    { 
        title: 'Utility Grid', 
        description: 'Power consumption monitoring and electrical panel records.', 
        Icon: Zap, 
        bgColorClass: 'bg-[#fbc531]', 
        href: '/power' 
    },
    { 
        title: 'Global Plant View', 
        description: 'Digital twin interface for overall workshop status monitoring.', 
        Icon: MapIcon, 
        bgColorClass: 'bg-[#4b5563]', 
        href: '/mapping' 
    },
    { 
        title: 'Legal Compliance', 
        description: 'Audit logs, labor law documents, and statutory records.', 
        Icon: ClipboardCheck, 
        bgColorClass: 'bg-[#21a8d8]', 
        href: '/compliance' 
    },
];

const OfficeDashboard = () => {
  return (
    <div className="max-w-[1600px] mx-auto space-y-16 py-8 px-4">
      {/* Header Section */}
      <div className="space-y-6 text-left">
        <div className="inline-block px-4 py-1.5 rounded-full bg-[#E8E8E8] border border-gray-200">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#707070]">
                {format(new Date(), 'EEEE d MMMM')}
            </span>
        </div>
        <div className="space-y-4">
          <h1 className="text-7xl font-medium tracking-tight text-gray-900">
            Welcome back, <span className="text-[#8E8E93]">Office Team.</span>
          </h1>
          <p className="text-xl text-[#8E8E93] max-w-2xl font-medium leading-relaxed">
            Manage your administrative workflows and operational oversight from the central hub.
          </p>
        </div>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-20">
         {officeServices.map((service) => (
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

export default OfficeDashboard;