import React from 'react';
import ServiceCard from './ServiceCard';
import { format } from 'date-fns';
import { 
  Cpu, FileText, AlertTriangle, Users, 
  Briefcase, Zap, Map as MapIcon, ClipboardCheck 
} from 'lucide-react';

const safetyServices = [
    { 
        title: 'Safety Inspections', 
        description: 'Audit machine safety locks, red tags, and operational risks.', 
        Icon: Cpu, 
        bgColorClass: 'bg-[#4378f1]', 
        href: '/machines' 
    },
    { 
        title: 'Permit Approval', 
        description: 'Final safety verification and sign-off for high-risk work.', 
        Icon: FileText, 
        bgColorClass: 'bg-[#a344fb]', 
        href: '/permits' 
    },
    { 
        title: 'Investigation Hub', 
        description: 'Incident reporting, root cause analysis, and safety triage.', 
        Icon: AlertTriangle, 
        bgColorClass: 'bg-[#e53d3d]', 
        href: '/incidents' 
    },
    { 
        title: 'Worker Compliance', 
        description: 'Verify contractor safety training and medical records.', 
        Icon: Users, 
        bgColorClass: 'bg-[#1cb572]', 
        href: '/contractors' 
    },
    { 
        title: 'Safety Projects', 
        description: 'Infrastructure improvements focused on hazard reduction.', 
        Icon: Briefcase, 
        bgColorClass: 'bg-[#f78b2e]', 
        href: '/projects' 
    },
    { 
        title: 'Electrical Safety', 
        description: 'Isolation monitoring and substation access control.', 
        Icon: Zap, 
        bgColorClass: 'bg-[#fbc531]', 
        href: '/power' 
    },
    { 
        title: 'Hazard Mapping', 
        description: 'Visual 3D location of danger zones and active permits.', 
        Icon: MapIcon, 
        bgColorClass: 'bg-[#4b5563]', 
        href: '/mapping' 
    },
    { 
        title: 'Compliance Audit', 
        description: 'Detailed records for safety inspections and regulatory audits.', 
        Icon: ClipboardCheck, 
        bgColorClass: 'bg-[#21a8d8]', 
        href: '/compliance' 
    },
];

const SafetyDashboard = () => {
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
            Welcome back, <span className="text-[#8E8E93]">Safety Officer.</span>
          </h1>
          <p className="text-xl text-[#8E8E93] max-w-2xl font-medium leading-relaxed">
            Oversee workshop safety standards and ensure compliance across all operations.
          </p>
        </div>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-20">
         {safetyServices.map((service) => (
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

export default SafetyDashboard;