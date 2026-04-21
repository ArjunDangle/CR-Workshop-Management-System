// client/src/modules/contractor/components/dashboards/SafetyOfficerContractorDashboard.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScanFace, ShieldAlert, LogIn, LogOut, AlertTriangle, CheckCircle2, Ban, Eye, FileText, Search, Filter, Shield } from 'lucide-react';
import { getContractors, scanGatePass, updateContractorStatus, ContractorStatus, Contractor } from '../../api';
import { toast } from 'sonner';
import { ContractorProfileSheet } from '../ContractorProfileSheet';

export const SafetyOfficerContractorDashboard: React.FC = () => {
  const [scanId, setScanId] = useState('');
  const[scanResult, setScanResult] = useState<{success: boolean, msg: string} | null>(null);
  
  // RESTORED: Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const[statusFilter, setStatusFilter] = useState<string>('all');
  const[selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);

  const queryClient = useQueryClient();

  const { data: contractors = [], isLoading } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => getContractors(),
  });

  // RESTORED: Filter Logic
  const filteredContractors = contractors.filter(contractor => {
    const matchesSearch = contractor.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contractor.vendor_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contractor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // RESTORED: KPI Calcs
  const activeContractors = contractors.filter(c => c.status === ContractorStatus.ACTIVE).length;
  const suspendedContractors = contractors.filter(c => c.status === ContractorStatus.SUSPENDED).length;
  const blacklistedContractors = contractors.filter(c => c.status === ContractorStatus.BLACKLISTED).length;
  const lowSafetyContractors = contractors.filter(c => c.reputation_score < 70).length;

  const scanMutation = useMutation({
    mutationFn: ({ id, dir }: { id: string, dir: 'IN' | 'OUT' }) => scanGatePass(id, dir),
    onSuccess: (data, variables) => {
      setScanResult({ success: true, msg: `ACCESS GRANTED: Worker scanned ${variables.dir}.` });
      setScanId('');
    },
    onError: (error: any) => { setScanResult({ success: false, msg: error.message || 'ACCESS DENIED.' }); }
  });

  const handleScan = (dir: 'IN' | 'OUT') => {
    if (!scanId) return;
    scanMutation.mutate({ id: scanId, dir });
  };

  // RESTORED: Status Update Mutations
  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string, status: ContractorStatus, reason: string }) => updateContractorStatus(id, status, reason),
    onSuccess: (_, variables) => {
      toast.success(`Contractor ${variables.status.toLowerCase()}`, { description: 'Safety status updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
    },
    onError: (error: any) => toast.error('Update Failed', { description: error.message })
  });

  const handleSuspend = (id: string) => statusMutation.mutate({ id, status: ContractorStatus.SUSPENDED, reason: 'Safety violation observed' });
  const handleBlacklist = (id: string) => statusMutation.mutate({ id, status: ContractorStatus.BLACKLISTED, reason: 'Severe safety compliance failure' });

  const getStatusColor = (status: ContractorStatus) => {
    switch (status) {
      case ContractorStatus.ACTIVE: return 'bg-green-100 text-green-800 border-green-200';
      case ContractorStatus.SUSPENDED: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case ContractorStatus.BLACKLISTED: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Safety Oversight & Access Control</h1>
        <p className="text-gray-600 mt-1">Live gate pass monitoring and safety reputation oversight.</p>
      </div>

      {/* RESTORED: Old KPIs merged with new styling */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl shadow-sm border-gray-100"><CardContent className="p-5 flex justify-between items-center"><div><p className="text-sm text-gray-500 font-medium">Active</p><p className="text-2xl font-black text-green-600">{activeContractors}</p></div><CheckCircle2 className="h-8 w-8 text-green-200"/></CardContent></Card>
        <Card className="rounded-2xl shadow-sm border-gray-100"><CardContent className="p-5 flex justify-between items-center"><div><p className="text-sm text-gray-500 font-medium">Suspended</p><p className="text-2xl font-black text-yellow-600">{suspendedContractors}</p></div><Ban className="h-8 w-8 text-yellow-200"/></CardContent></Card>
        <Card className="rounded-2xl shadow-sm border-gray-100"><CardContent className="p-5 flex justify-between items-center"><div><p className="text-sm text-gray-500 font-medium">Blacklisted</p><p className="text-2xl font-black text-red-600">{blacklistedContractors}</p></div><AlertTriangle className="h-8 w-8 text-red-200"/></CardContent></Card>
        <Card className="rounded-2xl shadow-sm border-gray-100"><CardContent className="p-5 flex justify-between items-center"><div><p className="text-sm text-gray-500 font-medium">Low Trust Score</p><p className="text-2xl font-black text-orange-600">{lowSafetyContractors}</p></div><ShieldAlert className="h-8 w-8 text-orange-200"/></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* NEW: GATE PASS SCANNER */}
        <Card className="lg:col-span-1 rounded-2xl border-gray-200 shadow-md bg-slate-900 text-white overflow-hidden h-fit">
           <CardHeader className="bg-slate-950 border-b border-slate-800 pb-4">
             <CardTitle className="flex items-center gap-2 text-blue-400 text-lg"><ScanFace className="w-5 h-5"/> RPF Gate Scanner</CardTitle>
           </CardHeader>
           <CardContent className="p-6 space-y-6">
              <p className="text-sm text-slate-400">Scan worker ID card barcode.</p>
              <Input value={scanId} onChange={(e) => setScanId(e.target.value)} placeholder="Worker UUID..." className="bg-slate-800 border-slate-700 text-white h-12 font-mono text-center tracking-widest" />
              <div className="grid grid-cols-2 gap-3">
                 <Button onClick={() => handleScan('IN')} disabled={scanMutation.isPending} className="bg-green-600 hover:bg-green-700 h-12 font-bold"><LogIn className="w-4 h-4 mr-2"/> IN</Button>
                 <Button onClick={() => handleScan('OUT')} disabled={scanMutation.isPending} className="bg-slate-700 hover:bg-slate-600 h-12 font-bold"><LogOut className="w-4 h-4 mr-2"/> OUT</Button>
              </div>
              {scanResult && (
                 <div className={`p-4 rounded-xl border mt-4 flex items-start gap-3 ${scanResult.success ? 'bg-green-900/50 border-green-500 text-green-300' : 'bg-red-900/50 border-red-500 text-red-300'}`}>
                    {scanResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0"/> : <ShieldAlert className="w-5 h-5 shrink-0"/>}
                    <p className="text-sm font-bold mt-0.5">{scanResult.msg}</p>
                 </div>
              )}
           </CardContent>
        </Card>

        {/* RESTORED: Main Contractor List with Filters & Action Buttons */}
        <div className="lg:col-span-2 space-y-4">
            {/* RESTORED: Filters */}
            <Card className="rounded-2xl shadow-sm border-gray-100">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search contractors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-48"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Filter by status" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value={ContractorStatus.ACTIVE}>Active</SelectItem>
                        <SelectItem value={ContractorStatus.SUSPENDED}>Suspended</SelectItem>
                        <SelectItem value={ContractorStatus.BLACKLISTED}>Blacklisted</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm border-gray-100">
                <CardHeader className="border-b bg-gray-50/50 rounded-t-2xl pb-4">
                    <CardTitle className="text-lg">Contractor Safety View</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y max-h-[500px] overflow-y-auto">
                        {filteredContractors.length === 0 ? (
                            <div className="text-center py-12 text-gray-500"><Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" /><p>No contractors found</p></div>
                        ) : (
                            filteredContractors.map((c) => (
                                <div key={c.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50 transition-colors gap-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-bold text-gray-900 cursor-pointer hover:underline" onClick={() => setSelectedContractor(c)}>{c.company_name}</h4>
                                            <Badge variant="outline" className={getStatusColor(c.status)}>{c.status}</Badge>
                                            {c.reputation_score < 70 && <Badge className="bg-orange-100 text-orange-800 border-orange-200">Low Trust Score</Badge>}
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                            <span className="font-mono">{c.vendor_code}</span>
                                            <span>|</span>
                                            <span>Type: {c.contractor_type}</span>
                                            <span>|</span>
                                            <span className="font-bold">Score: {c.reputation_score}/100</span>
                                        </div>
                                    </div>
                                    
                                    {/* RESTORED: Action Buttons */}
                                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedContractor(c)}><Eye className="h-4 w-4 mr-1 hidden lg:inline" /> View</Button>
                                        {c.status === ContractorStatus.ACTIVE && (
                                        <>
                                            <Button variant="outline" size="sm" className="text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700" onClick={() => handleSuspend(c.id)} disabled={statusMutation.isPending}>
                                                <Ban className="h-4 w-4 mr-1 hidden lg:inline" /> Suspend
                                            </Button>
                                            <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleBlacklist(c.id)} disabled={statusMutation.isPending}>
                                                <AlertTriangle className="h-4 w-4 mr-1 hidden lg:inline" /> Blacklist
                                            </Button>
                                        </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <ContractorProfileSheet contractor={selectedContractor} isOpen={!!selectedContractor} onClose={() => setSelectedContractor(null)} />
    </div>
  );
};