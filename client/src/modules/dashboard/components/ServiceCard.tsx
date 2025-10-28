// src/modules/dashboard/components/ServiceCard.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom'; // Import Link for navigation

interface ServiceCardProps {
  title: string;
  Icon: LucideIcon;
  bgColorClass: string; // Tailwind class like 'bg-[hsl(var(--service-card-1-bg))]' or 'bg-gradient-...'
  href: string; // Destination URL
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, Icon, bgColorClass, href }) => {
  return (
    // Wrap the card in a Link component for navigation
    <Link to={href} className="block group transition-transform duration-200 ease-in-out hover:-translate-y-1">
      <Card className={cn(
          "rounded-lg shadow-sm overflow-hidden h-32 md:h-36", // Fixed height, rounded corners
          bgColorClass // Apply background color/gradient passed as prop
      )}>
        <CardContent className="p-4 flex flex-col justify-between h-full text-white relative"> {/* Ensure text is white and use flexbox */}
            {/* Icon positioned top-left */}
            <Icon className="h-7 w-7 md:h-8 md:w-8 text-white opacity-80 mb-2" strokeWidth={1.5}/>
            {/* Title positioned bottom-left */}
            <h3 className="text-sm md:text-base font-semibold tracking-tight mt-auto leading-tight line-clamp-2 text-left"> {/* Text left aligned */}
                {title}
            </h3>
            {/* Optional: Add a subtle overlay or pattern if needed */}
            {/* <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors duration-200"></div> */}
        </CardContent>
      </Card>
    </Link>
  );
};

export default ServiceCard;