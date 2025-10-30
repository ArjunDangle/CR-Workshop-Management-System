import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getPermits } from '../../permitApi';
import type { Permit } from '../../permitTypes';
import { useAuthStore } from '@/modules/auth/authStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, AlertCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

// --- Status Badge Helper ---
type StatusVariant = 'default' | 'destructive' | 'secondary' | 'outline';

// --- FIX: Change to subtle outline badges ---
const getStatusVariant = (status: string): { variant: StatusVariant; className: string } => {
  switch (status) {
    case 'Pending Authorization':
      return { variant: 'outline', className: 'text-yellow-600 border-yellow-500' };
    case 'Pending Approval':
      return { variant: 'outline', className: 'text-orange-600 border-orange-500' };
    case 'Approved':
      return { variant: 'outline', className: 'text-green-600 border-green-500' };
    case 'Active':
      return { variant: 'outline', className: 'text-blue-600 border-blue-500' };
    case 'Closed':
      return { variant: 'secondary', className: '' };
    case 'Rejected':
      return { variant: 'destructive', className: '' };
    case 'Expired':
      return { variant: 'outline', className: '' };
    default:
      return { variant: 'default', className: 'text-gray-600 border-gray-400' };
  }
};
// --- END FIX ---

export const PermitStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const { variant, className } = getStatusVariant(status);
  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  );
};

// --- Widget Props ---
interface PermitListWidgetProps {
  title: string;
  queryKey: string; // Unique key for TanStack Query, e.g., "pendingOfficePermits"
  statusFilter: string[]; // e.g., ["Pending Authorization"]
  filterByCurrentUser?: boolean; // If true, only shows permits where user is permittee
  noPermitsMessage?: string;
  className?: string;
}

// --- Loading Skeleton ---
const ListLoadingSkeleton = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex justify-between items-center p-2 rounded-lg">
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    ))}
  </div>
);

// --- Main Widget Component ---
export const PermitListWidget: React.FC<PermitListWidgetProps> = ({
  title,
  queryKey,
  statusFilter,
  filterByCurrentUser = false,
  noPermitsMessage = 'No permits found.',
  className,
}) => {
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  const { data, isLoading, isError, error } = useQuery<Permit[]>({
    queryKey: ['permits', queryKey],
    queryFn: getPermits, // Fetches *all* permits
    
    // --- THIS IS THE FIX ---
    // This stops react-query from refetching on window focus, etc.
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Fetches when the component first loads
    refetchOnReconnect: false, // Disables refetching on network reconnect
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
    // --- END FIX ---

    select: (allPermits) => {
      // Filter *after* fetching
      return allPermits.filter(permit => {
        const matchesStatus = statusFilter.includes(permit.status);
        if (filterByCurrentUser) {
          return matchesStatus && permit.permittee_id === currentUserId;
        }
        return matchesStatus;
      });
    },
  });

  const renderContent = () => {
    if (isLoading) {
      return <ListLoadingSkeleton />;
    }

    if (isError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Permits</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-24 text-muted-foreground">
          <FileText className="h-5 w-5 mr-2" />
          <p>{noPermitsMessage}</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Permit #</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((permit) => (
            <TableRow key={permit.id}>
              <TableCell className="font-medium">{permit.permit_no || permit.id.substring(0, 8)}</TableCell>
              <TableCell>
                <PermitStatusBadge status={permit.status} />
              </TableCell>
              <TableCell>{permit.work_description}</TableCell>
              <TableCell>{format(new Date(permit.created_at), 'dd-MMM-yyyy')}</TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/permits/${permit.id}`}>
                    View <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default PermitListWidget;

