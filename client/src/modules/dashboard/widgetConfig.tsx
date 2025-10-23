import { LucideIcon, Settings, FileText, AlertTriangle, FileSignature, Briefcase, Zap, ShieldCheck, Map } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface Widget {
  id: string;
  title: string;
  Icon: LucideIcon;
  color: string;
  description: string;
}

export const ALL_WIDGETS: Widget[] = [
  {
    id: 'machine',
    title: 'Machine management',
    Icon: Settings,
    color: 'text-widget-blue',
    description: 'Track and maintain workshop machinery',
  },
  {
    id: 'permit',
    title: 'Permit management',
    Icon: FileText,
    color: 'text-widget-green',
    description: 'Handle work permits and approvals',
  },
  {
    id: 'incident',
    title: 'Incident reporting',
    Icon: AlertTriangle,
    color: 'text-widget-orange',
    description: 'Report and track safety incidents',
  },
  {
    id: 'contract',
    title: 'Contract management',
    Icon: FileSignature,
    color: 'text-widget-purple',
    description: 'Manage vendor contracts and agreements',
  },
  {
    id: 'project',
    title: 'Project tracking',
    Icon: Briefcase,
    color: 'text-widget-teal',
    description: 'Monitor workshop projects and tasks',
  },
  {
    id: 'power',
    title: 'Power monitoring',
    Icon: Zap,
    color: 'text-widget-yellow',
    description: 'Track electrical systems and usage',
  },
  {
    id: 'compliance',
    title: 'Compliance tracking',
    Icon: ShieldCheck,
    color: 'text-widget-red',
    description: 'Ensure regulatory compliance',
  },
  {
    id: 'mapping',
    title: 'Workshop mapping',
    Icon: Map,
    color: 'text-widget-pink',
    description: 'View workshop layout and zones',
  },
];

interface WidgetCardProps {
  widget: Widget;
}

export const WidgetCard = ({ widget }: WidgetCardProps) => {
  const { title, Icon, color, description } = widget;

  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Icon className={`h-8 w-8 ${color}`} strokeWidth={1.5} />
        </div>
        <CardTitle className="text-lg font-semibold text-left mt-4">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-left text-sm text-muted-foreground mb-4">
          {description}
        </CardDescription>
        <div className="text-3xl font-light text-left text-foreground">--</div>
      </CardContent>
    </Card>
  );
};
