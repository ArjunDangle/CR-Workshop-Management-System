// FILE: client/src/modules/permit/components/dashboards/SafetyOfficerPermitDashboard.tsx
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ClipboardCheck, ShieldAlert, History, BarChartHorizontal } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/authStore';
import { ErrorBoundary } from '@/components/common/ErrorBoundary'; 

import { getPermits } from '../../permitApi';
import PermitListWidget from '../widgets/PermitListWidget';
import StatCardWidget from '../widgets/StatCardWidget';

const WidgetLoading = () => (
  <Card>
    <CardContent className="flex justify-center items-center h-48">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </CardContent>
  </Card>
);

const SafetyOfficerPermitDashboard = () => {
  const { user } = useAuthStore();

  const { data: permits =[] } = useQuery({
    queryKey:['permits', 'safety-officer-stats'],
    queryFn: getPermits,
    refetchInterval: 15000, 
  });

  const stats = useMemo(() => {
    return {
      pendingApproval: permits.filter(p => p.status === 'Pending Approval').length,
      activeAndApproved: permits.filter(p => ['Active', 'Approved'].includes(p.status)).length,
      pendingAuth: permits.filter(p => p.status === 'Pending Authorization').length,
      closedExpired: permits.filter(p => ['Closed', 'Expired', 'Rejected'].includes(p.status)).length,
    };
  }, [permits]);

  if (!user) {
    return <WidgetLoading />;
  }
  
  const handleRetry = () => window.location.reload(); 
  
  return (
    <div className="space-y-6 pb-12 max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Safety Officer Permit Dashboard</h1>
        <p className="text-gray-500 mt-1">Real-time overview of workshop permit compliance and approvals.</p>
      </div>
      
      {/* Row 1: Real Data Stats (Stays in a Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <ErrorBoundary fallbackTitle="Stats Failed">
          <StatCardWidget title="Pending My Approval" value={stats.pendingApproval} icon={ShieldAlert} colorClass="text-red-600 bg-red-50 border-red-200" />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Stats Failed">
          <StatCardWidget title="Approved & Active" value={stats.activeAndApproved} icon={ClipboardCheck} colorClass="text-green-600 bg-green-50 border-green-200" />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Stats Failed">
          <StatCardWidget title="Pending Office Auth" value={stats.pendingAuth} icon={BarChartHorizontal} colorClass="text-yellow-600 bg-yellow-50 border-yellow-200" />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Stats Failed">
          <StatCardWidget title="Historical / Closed" value={stats.closedExpired} icon={History} colorClass="text-gray-600 bg-gray-50 border-gray-200" />
        </ErrorBoundary>
      </div>
      
      {/* Row 2: Lists (Vertically Stacked = Full Width = No Squishing) */}
      <div className="space-y-6">
        <ErrorBoundary fallbackTitle="Approval List Error" onReset={handleRetry}>
            <PermitListWidget
            title="🚨 Action Required: Permits Awaiting My Approval"
            queryKey="pending_approval_permits"
            statusFilter={['Pending Approval']}
            filterByCurrentUser={false}
            noPermitsMessage="Great job! No permits are currently awaiting your approval."
            />
        </ErrorBoundary>

        <ErrorBoundary fallbackTitle="Live List Error" onReset={handleRetry}>
            <PermitListWidget
            title="Approved & Active Permits"
            queryKey="active_permits"
            statusFilter={['Approved', 'Active']} 
            filterByCurrentUser={false}
            noPermitsMessage="No permits are currently approved or active."
            />
        </ErrorBoundary>

        <ErrorBoundary fallbackTitle="History Load Error" onReset={handleRetry}>
            <PermitListWidget
            title="Master Permit History"
            queryKey="all_permit_history"
            statusFilter={['Closed', 'Expired', 'Rejected']}
            filterByCurrentUser={false}
            noPermitsMessage="No permit history found."
            />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default SafetyOfficerPermitDashboard;