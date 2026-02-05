import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardWidgetProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass: string; // e.g., "text-blue-500 bg-blue-50"
}

export const StatCardWidget: React.FC<StatCardWidgetProps> = ({
  title,
  value,
  icon: Icon,
  colorClass,
}) => {
  return (
    <Card className="bg-white rounded-3xl shadow-sm border-gray-100 hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-6">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", colorClass)}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-4xl font-bold text-gray-900 tracking-tight">{value}</div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">{title}</div>
      </CardContent>
    </Card>
  );
};

export default StatCardWidget;