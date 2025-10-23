// src/modules/dashboard/components/ServiceCard.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom'; // Import Link for navigation

interface ServiceCardProps {
  title: string;
  Icon: LucideIcon;
  bgColorClass: string; // Tailwind class like 'bg-[hsl(var(--service-card-1-bg))]'
  href: string; // Destination URL
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, Icon, bgColorClass, href }) => {
  return (
    <Link to={href} className="block group"> {/* Wrap card in a Link */}
      <Card className={cn(
          "rounded-lg shadow-sm overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-lg group-hover:-translate-y-1 h-32 md:h-36", // Fixed height
          bgColorClass // Apply background color/gradient
      )}>
        <CardContent className="p-4 flex flex-col justify-between h-full">
            <Icon className="h-8 w-8 text-white opacity-90 mb-2" strokeWidth={1.5}/>
            <h3 className="text-base md:text-lg font-semibold tracking-tight text-white mt-auto leading-tight">
                {title}
            </h3>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ServiceCard;