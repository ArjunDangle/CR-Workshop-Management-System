import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ServiceCardProps {
  title: string;
  description: string;
  Icon: LucideIcon;
  bgColorClass: string; 
  href: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, Icon, bgColorClass, href }) => {
  return (
    <Link to={href} className="block group transition-all duration-300 ease-in-out hover:-translate-y-2">
      <Card className={cn(
          "relative border-0 shadow-sm overflow-hidden h-[280px] rounded-[2.5rem] transition-all group-hover:shadow-2xl", 
          bgColorClass
      )}>
        <CardContent className="p-8 flex flex-col justify-between h-full text-white">
            {/* Top Left Icon Container */}
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner">
                <Icon className="h-7 w-7 text-white" strokeWidth={1.5} />
            </div>

            {/* Bottom Left Text Container */}
            <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight leading-tight text-left">
                    {title}
                </h3>
                <p className="text-sm font-medium text-white/80 leading-relaxed text-left line-clamp-2">
                    {description}
                </p>
            </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ServiceCard;