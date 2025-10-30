// FILE: client/src/modules/permit/pages/PermitDetailPage.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Layout & Components
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { PermitStatusBadge } from '../components/widgets/PermitListWidget'; // Import the badge

// API & Types
import { getPermitById, authorizePermit, approvePermit } from '../permitApi';
import type { Permit } from '../permitTypes';
import { useAuthStore } from '@/modules/auth/authStore';

// Icons
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  User,
  Calendar,
  Clock,
  MapPin,
  ClipboardList,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Circle,
  HardHat,
  Users,
  Building,
  Key,
} from 'lucide-react';

// --- Helper Components ---

// Helper for displaying a row of information
const InfoRow: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <div className="flex items-start">
    <Icon className="h-5 w-5 text-muted-foreground mr-3 mt-1 flex-shrink-0" />
    <div className="flex-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-base font-semibold text-foreground">{value || 'N/A'}</p>
    </div>
  </div>
);

// Helper for displaying lifecycle steps
const LifecycleStep: React.FC<{
  icon: React.ElementType;
  title: string;
  user: string | null | undefined;
  date: string | null | undefined;
  status: 'pending' | 'complete' | 'rejected';
  remarks?: string | null;
}> = ({ icon: Icon, title, user, date, status, remarks }) => {
  const getStatusColor = () => {
    if (status === 'complete') return 'text-green-600';
    if (status === 'rejected') return 'text-destructive';
    return 'text-yellow-500';
  };
  const StatusIcon =
    status === 'complete' ? CheckCircle : status === 'rejected' ? XCircle : Circle;

  return (
    <div className="flex">
      <Icon className="h-6 w-6 text-primary mr-4 mt-1" />
      <div className="flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{user || 'Pending...'}</p>
        {date && (
          <p className="text-xs text-muted-foreground">
            {format(new Date(date), 'dd-MMM-yyyy @ h:mm a')}
          </p>
        )}
        {remarks && (
          <div className="mt-2 text-xs border-l-2 border-primary/20 pl-2">
            <p className="font-medium">Remarks:</p>
            <p className="italic text-muted-foreground">{remarks}</p>
          </div>
        )}
      </div>
      <StatusIcon className={`h-5 w-5 ml-2 ${getStatusColor()}`} />
    </div>
  );
};

// Helper for loading state
const PermitDetailSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-7 w-28 rounded-full" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-32 w-full" /></CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

// --- Main Component ---
const PermitDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [remarks, setRemarks] = useState('');

  // Fetch Permit Data
  const {
    data: permit,
    isLoading,
    isError,
    error,
  } = useQuery<Permit>({
    queryKey: ['permit', id],
    queryFn: () => getPermitById(id!),
    enabled: !!id,
  });

  // Mutation for Authorizing (SSE-Office)
  const authorizeMutation = useMutation({
    mutationFn: () => authorizePermit(id!),
    onSuccess: (data) => {
      toast.success('Permit Authorized!', {
        description: `Permit #${data.permit_no} forwarded to Safety Officer.`,
      });
      // Refresh this page's data
      queryClient.invalidateQueries({ queryKey: ['permit', id] });
      // Refresh the list on the dashboard
      queryClient.invalidateQueries({ queryKey: ['permits'] });
    },
    onError: (err) => {
      toast.error('Authorization Failed', {
        description: err.message,
      });
    },
  });

  // Mutation for Approving (Safety Officer)
  const approveMutation = useMutation({
    mutationFn: (data: { approver_remarks: string }) => approvePermit(id!, data),
    onSuccess: (data) => {
      toast.success('Permit Approved!', {
        description: `Permit #${data.permit_no} is now ready for issuance.`,
      });
      setRemarks('');
      queryClient.invalidateQueries({ queryKey: ['permit', id] });
      queryClient.invalidateQueries({ queryKey: ['permits'] });
    },
    onError: (err) => {
      toast.error('Approval Failed', {
        description: err.message,
      });
    },
  });

  // --- Render Logic ---
  if (isLoading) {
    return (
      <DashboardLayout>
        <PermitDetailSkeleton />
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Permit</AlertTitle>
          <AlertDescription>
            {error.message}
            <Button variant="outline" size="sm" onClick={() => navigate('/permits')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  if (!permit) {
    return (
      <DashboardLayout>
        <Alert>
          <AlertTitle>Permit Not Found</AlertTitle>
          <AlertDescription>
            The permit you are looking for does not exist.
            <Button variant="outline" size="sm" onClick={() => navigate('/permits')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  // --- Conditional Action Logic ---
  const canAuthorize =
    user?.role?.name === 'SSE-Office' && permit.status === 'Pending Authorization';
  
  const canApprove =
    user?.role?.name === 'Safety Officer' && permit.status === 'Pending Approval';
  
  // Format dates/times, handling nulls
  const formatDate = (date: string | null | undefined) =>
    date ? format(new Date(date), 'dd-MMM-yyyy') : 'N/A';
  
  const formatTime = (time: string | null | undefined) => {
    if (!time) return 'N/A';
    // Backend time is "HH:MM:SS", need to parse it correctly
    const [h, m] = time.split(':');
    const d = new Date();
    d.setHours(parseInt(h, 10), parseInt(m, 10), 0);
    return format(d, 'h:mm a');
  };

  return (
    <DashboardLayout>
      {/* --- Page Header --- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/permits')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Permit #{permit.permit_no || permit.id.substring(0, 8)}
            </h1>
            <p className="text-muted-foreground">{permit.permit_type} Permit</p>
          </div>
        </div>
        <PermitStatusBadge status={permit.status} />
      </div>

      {/* --- Page Content Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- Main Content (Left) --- */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Work Details</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <InfoRow
                icon={MapPin}
                label="Work Location"
                value={permit.work_location}
              />
              <InfoRow
                icon={ClipboardList}
                label="Work Description"
                value={permit.work_description}
              />
              <InfoRow
                icon={User}
                label="Person Responsible"
                value={permit.person_responsible}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InfoRow
                icon={Calendar}
                label="Start Date"
                value={formatDate(permit.start_date)}
              />
              <InfoRow
                icon={Clock}
                label="Start Time"
                value={formatTime(permit.start_time)}
              />
              <InfoRow
                icon={Calendar}
                label="Finish Date"
                value={formatDate(permit.finish_date)}
              />
              <InfoRow
                icon={Clock}
                label="Finish Time"
                value={formatTime(permit.finish_time)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Personal Protective Equipment (PPE)</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Issued On</TableHead>
                    <TableHead>Checked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permit.ppes.length > 0 ? permit.ppes.map(ppe => (
                    <TableRow key={ppe.id}>
                      <TableCell>{ppe.name}</TableCell>
                      <TableCell>{formatDate(ppe.issued_on)}</TableCell>
                      <TableCell>
                        {ppe.checked ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No PPE items listed.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Attendees</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permit.attendees.length > 0 ? permit.attendees.map(att => (
                    <TableRow key={att.id}>
                      <TableCell>{att.name}</TableCell>
                      <TableCell>{att.phone}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        No attendees listed.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* --- Sidebar (Right) --- */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* --- ACTION CARD --- */}
          {(canAuthorize || canApprove) && (
            <Card className="border-primary bg-primary/5">
              <CardHeader>
                <CardTitle>Actions Required</CardTitle>
                <CardDescription>
                  Your action is required to move this permit to the next step.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {canAuthorize && (
                  <Button
                    className="w-full"
                    onClick={() => authorizeMutation.mutate()}
                    disabled={authorizeMutation.isPending}
                  >
                    {authorizeMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="h-4 w-4 mr-2" />
                    )}
                    Authorize Permit
                  </Button>
                )}

                {canApprove && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full" variant="default">
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Approve Permit
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        approveMutation.mutate({ approver_remarks: remarks });
                      }}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Approve Permit</AlertDialogTitle>
                          <AlertDialogDescription>
                            Please add any final remarks before approving this permit.
                            This action is final.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="my-4">
                          <Textarea
                            placeholder="Add optional remarks..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            type="submit"
                            disabled={approveMutation.isPending}
                          >
                            {approveMutation.isPending && (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Approve
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </form>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardContent>
            </Card>
          )}

          {/* --- LIFECYCLE CARD --- */}
          <Card>
            <CardHeader><CardTitle>Permit Lifecycle</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <LifecycleStep
                icon={HardHat}
                title="Initiated"
                user={permit.permittee?.full_name}
                date={permit.created_at}
                status="complete"
              />
              <Separator />
              <LifecycleStep
                icon={Building}
                title="Authorized"
                user={permit.authorizer?.full_name}
                date={permit.authorized_at}
                status={permit.authorizer ? 'complete' : 'pending'}
              />
              <Separator />
              <LifecycleStep
                icon={ShieldCheck}
                title="Approved"
                user={permit.approver?.full_name}
                date={permit.approved_at}
                status={permit.approver ? 'complete' : 'pending'}
                remarks={permit.approver_remarks}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PermitDetailPage;
