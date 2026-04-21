// client/src/modules/contractor/components/dashboards/SSEMaintenanceContractorDashboard.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // FIX: Added missing imports
import { Users, HardHat, FileCheck, CheckCircle2, Search, Filter, Info, Eye } from 'lucide-react';
import { getContractors, ContractorStatus, Contractor } from '../../api';
import { ContractorProfileSheet } from '../ContractorProfileSheet';

export const SSEMaintenanceContractorDashboard: React.FC = () => {
  // RESTORED: Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(ContractorStatus.ACTIVE);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);

  const { data: contractors =[], isLoading } = useQuery({
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

  const activeContractors = contractors.filter(c => c.status === ContractorStatus.ACTIVE).length;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Deployed Workforce</h1>
        <p className="text-gray-600 mt-1">View fully mobilized contractors available for shop floor permits.</p>
      </div>

      {/* COMBINED KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-blue-600 to-blue-800 text-white">
            <CardContent className="p-8">
               <Users className="w-12 h-12 text-blue-200 mb-4" />
               <p className="text-blue-100 font-medium">Total Approved & Active</p>
               <h2 className="text-5xl font-black mt-1">{activeContractors}</h2>
            </CardContent>
         </Card>

         <Card className="rounded-2xl border-blue-100 bg-blue-50">
            <CardContent className="p-8 flex flex-col justify-center h-full">
               <FileCheck className="w-10 h-10 text-blue-500 mb-3" />
               <h3 className="text-xl font-bold text-blue-900">Permit Readiness Checks</h3>
               <p className="text-sm text-blue-700 mt-2 leading-relaxed">
                 You can only raise Work Permits for contractors whose <strong>Mobilization Checklists</strong> are 100% complete and verified by SSE-Office.
               </p>
            </CardContent>
         </Card>
      </div>

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
                <SelectItem value={ContractorStatus.ACTIVE}>Active Only</SelectItem>
                <SelectItem value="all">All (View Only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Available Contractors List */}
      <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">Contractor Roster</h3>
      
      {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading contractors...</div>
      ) : filteredContractors.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-dashed">
            <HardHat className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No contractors found matching criteria.</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {filteredContractors.map(c => (
                <Card key={c.id} className="rounded-xl shadow-sm border-gray-200 hover:border-blue-300 transition-colors cursor-pointer" onClick={() => setSelectedContractor(c)}>
                <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-gray-100 p-2 rounded-lg"><HardHat className="w-6 h-6 text-gray-600" /></div>
                        {c.status === 'ACTIVE' ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>
                        ) : (
                            <Badge variant="secondary">{c.status}</Badge>
                        )}
                    </div>
                    <h4 className="font-bold text-gray-900 text-lg line-clamp-1">{c.company_name}</h4>
                    <p className="text-sm text-gray-500 mb-3">{c.empanelment_category} Works</p>
                    
                    <div className="pt-3 border-t border-gray-100 flex justify-between items-center mt-auto">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 uppercase font-bold">Trust Score</span>
                            <span className={`text-sm font-black ${c.reputation_score >= 80 ? 'text-green-600' : 'text-red-600'}`}>{c.reputation_score}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 font-semibold p-0 h-auto">View Details →</Button>
                    </div>
                </CardContent>
                </Card>
            ))}
        </div>
      )}

      {/* RESTORED: Info Notice */}
      <Alert className="bg-blue-50 border-blue-200 mt-8">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800 font-bold">View-Only Access</AlertTitle>
        <AlertDescription className="text-blue-700">
            As SSE-Maintenance, you can view contractor details and worker rosters to assign them to permits. For onboarding, suspension, or blacklisting actions, please contact SSE-Office or the Safety Officer.
        </AlertDescription>
      </Alert>

      <ContractorProfileSheet contractor={selectedContractor} isOpen={!!selectedContractor} onClose={() => setSelectedContractor(null)} />
    </div>
  );
};