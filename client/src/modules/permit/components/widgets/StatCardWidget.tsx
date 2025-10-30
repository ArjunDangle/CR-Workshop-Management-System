import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardWidgetProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
}

export const StatCardWidget: React.FC<StatCardWidgetProps> = ({
  title,
  value,
  icon: Icon,
  className,
}) => {
  return (
    // This is the "normal" white shadcn/ui card
    <Card className={cn('p-4', className)}>
      <CardContent className="p-0">
        <Icon className={cn('h-6 w-6 mb-2 text-muted-foreground')} />
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </CardContent>
    </Card>
  );
};

export default StatCardWidget;

