// FILE: client/src/modules/permit/components/dashboards/SSEOfficePermitDashboard.tsx
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, FileCheck, History, BarChart3, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/authStore';
import { ErrorBoundary } from '@/components/common/ErrorBoundary'; 

import { getPermits } from '../../permitApi';
import PermitListWidget from '../widgets/PermitListWidget';
import StatCardWidget from '../widgets/StatCardWidget';

const WidgetLoading = () => (
  <Card><CardContent className="flex justify-center items-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent></Card>
);

const SSEOfficePermitDashboard = () => {
  const { user } = useAuthStore();

  const { data: permits = [] } = useQuery({
    queryKey:['permits', 'office-stats'],
    queryFn: getPermits,
    refetchInterval: 15000,
  });

  const stats = useMemo(() => {
    return {
      pendingAuth: permits.filter(p => p.status === 'Pending Authorization').length,
      pendingSafety: permits.filter(p => p.status === 'Pending Approval').length,
      active: permits.filter(p => p.status === 'Active' || p.status === 'Approved').length,
      history: permits.filter(p =>['Closed', 'Expired', 'Rejected'].includes(p.status)).length,
    };
  },[permits]);

  const handleRetry = () => window.location.reload(); 

  if (!user) return <WidgetLoading />;
  
  return (
    <div className="space-y-6 pb-12 max-w-full overflow-x-hidden">
      <div>
         <h1 className="text-3xl font-bold tracking-tight text-gray-900">SSE-Office Permit Dashboard</h1>
         <p className="text-gray-500 mt-1">Manage permit authorizations and administrative sign-offs.</p>
      </div>
      
      {/* Horizontal Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <ErrorBoundary fallbackTitle="Stat Error">
          <StatCardWidget title="Awaiting My Auth" value={stats.pendingAuth} icon={FileCheck} colorClass="bg-yellow-50 text-yellow-600 border-yellow-200" />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Stat Error">
          <StatCardWidget title="Awaiting Safety" value={stats.pendingSafety} icon={ShieldCheck} colorClass="bg-orange-50 text-orange-600 border-orange-200" />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Stat Error">
          <StatCardWidget title="Active Work" value={stats.active} icon={BarChart3} colorClass="bg-blue-50 text-blue-600 border-blue-200" />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Stat Error">
          <StatCardWidget title="Historical" value={stats.history} icon={History} colorClass="bg-gray-50 text-gray-600 border-gray-200" />
        </ErrorBoundary>
      </div>
      
      {/* Vertically Stacked Lists */}
      <div className="space-y-6">
        <ErrorBoundary fallbackTitle="Authorization List Error" onReset={handleRetry}>
            <PermitListWidget
            title="🚨 Permits Awaiting My Authorization"
            queryKey="pending_authorization_permits"
            statusFilter={['Pending Authorization']}
            filterByCurrentUser={false}
            noPermitsMessage="No permits are currently awaiting your authorization."
            />
        </ErrorBoundary>
        
        <ErrorBoundary fallbackTitle="Recent History Error" onReset={handleRetry}>
            <PermitListWidget
            title="Authorized & Active Permits"
            queryKey="authorized_active_permits"
            statusFilter={['Pending Approval', 'Approved', 'Active']}
            filterByCurrentUser={false}
            noPermitsMessage="No recently authorized permits found."
            />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default SSEOfficePermitDashboard;