// FILE: client/src/modules/permit/components/widgets/PermitListWidget.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getPermits } from '../../permitApi';
import type { Permit } from '../../permitTypes';
import { useAuthStore } from '@/modules/auth/authStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, AlertCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

type StatusVariant = 'default' | 'destructive' | 'secondary' | 'outline';

const getStatusVariant = (status: string, isOverdue: boolean = false): { variant: StatusVariant; className: string } => {
  if (isOverdue) return { variant: 'destructive', className: 'animate-pulse font-bold border-red-600' };
  switch (status) {
    case 'Pending Authorization': return { variant: 'outline', className: 'text-yellow-600 border-yellow-500' };
    case 'Pending Approval': return { variant: 'outline', className: 'text-orange-600 border-orange-500' };
    case 'Approved': return { variant: 'outline', className: 'text-green-600 border-green-500' };
    case 'Active': return { variant: 'outline', className: 'text-blue-600 border-blue-500' };
    case 'Pending Closure': return { variant: 'outline', className: 'text-purple-600 border-purple-500' };
    case 'Closed': return { variant: 'secondary', className: '' };
    case 'Rejected': return { variant: 'destructive', className: '' };
    case 'Expired': return { variant: 'outline', className: '' };
    default: return { variant: 'default', className: 'text-gray-600 border-gray-400' };
  }
};

const checkIsOverdue = (permit: Permit) => {
    if (permit.status !== 'Active') return false;
    if (!permit.finish_date || !permit.finish_time) return false;
    const finishDate = new Date(`${permit.finish_date}T${permit.finish_time}Z`);
    return new Date() > finishDate;
};

export const PermitStatusBadge: React.FC<{ status: string; isOverdue?: boolean }> = ({ status, isOverdue = false }) => {
  const { variant, className } = getStatusVariant(status, isOverdue);
  return <Badge variant={variant} className={className}>{isOverdue ? 'OVERDUE' : status}</Badge>;
};

interface PermitListWidgetProps {
  title: string; queryKey: string; statusFilter: string[]; filterByCurrentUser?: boolean; noPermitsMessage?: string; className?: string;
}

const ListLoadingSkeleton = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex justify-between items-center p-2 rounded-lg">
        <div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" /></div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    ))}
  </div>
);

export const PermitListWidget: React.FC<PermitListWidgetProps> = ({ title, queryKey, statusFilter, filterByCurrentUser = false, noPermitsMessage = 'No permits found.', className }) => {
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  const { data, isLoading, isError, error } = useQuery<Permit[]>({
    queryKey: ['permits', queryKey], queryFn: getPermits,
    refetchOnWindowFocus: false, refetchOnMount: true, refetchOnReconnect: false, staleTime: 1000 * 60 * 5,
    select: (allPermits) => {
      return allPermits.filter(permit => {
        const matchesStatus = statusFilter.includes(permit.status);
        if (filterByCurrentUser) return matchesStatus && permit.permittee_id === currentUserId;
        return matchesStatus;
      });
    },
  });

  const renderContent = () => {
    if (isLoading) return <ListLoadingSkeleton />;
    if (isError) return (
        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error Loading Permits</AlertTitle><AlertDescription>{error.message}</AlertDescription></Alert>
    );
    if (!data || data.length === 0) return (
        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground"><FileText className="h-8 w-8 mb-2 opacity-20" /><p>{noPermitsMessage}</p></div>
    );

    return (
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap w-[150px]">Permit #</TableHead>
              <TableHead className="whitespace-nowrap w-[150px]">Status</TableHead>
              <TableHead className="min-w-[250px]">Description</TableHead>
              <TableHead className="whitespace-nowrap w-[120px]">Created</TableHead>
              <TableHead className="text-right whitespace-nowrap w-[100px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((permit) => {
              const isOverdue = checkIsOverdue(permit);
              return (
                  <TableRow key={permit.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-bold text-gray-700 whitespace-nowrap">{permit.permit_no || permit.id.substring(0, 8)}</TableCell>
                  <TableCell className="whitespace-nowrap"><PermitStatusBadge status={permit.status} isOverdue={isOverdue} /></TableCell>
                  <TableCell className="text-gray-600 max-w-[300px] truncate">{permit.work_description}</TableCell>
                  <TableCell className="whitespace-nowrap text-gray-500 text-sm">{format(new Date(permit.created_at), 'dd-MMM-yyyy')}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                      <Button asChild variant="ghost" size="sm" className="font-semibold text-blue-600 hover:text-blue-800">
                      <Link to={`/permits/${permit.id}`}>View <ArrowRight className="h-4 w-4 ml-1" /></Link>
                      </Button>
                  </TableCell>
                  </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="bg-gray-50/50 border-b pb-4"><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent className="p-0">{renderContent()}</CardContent>
    </Card>
  );
};
export default PermitListWidget;