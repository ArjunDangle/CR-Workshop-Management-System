// client/src/modules/contractor/components/dashboards/SSEOfficeContractorDashboard.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Users, Building, Search, Filter, Edit, Trash2, Network, CalendarClock, Briefcase, FileText } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { getContractors, createContractor, Contractor, ContractorStatus, ContractorType, EmpanelmentCategory, ContractorCreate } from '../../api';
import { ContractorProfileSheet } from '../ContractorProfileSheet';

export const SSEOfficeContractorDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const[statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const { toast } = useToast();

  const { data: contractors = [], isLoading, refetch } = useQuery({
    queryKey:['contractors'],
    queryFn: () => getContractors(),
  });

  const createMutation = useMutation({
    mutationFn: (data: ContractorCreate) => createContractor(data),
    onSuccess: () => {
      toast({ title: 'Contractor Registered', description: 'Contractor has been successfully onboarded.' });
      setCreateDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create contractor', variant: 'destructive' });
    },
  });

  // RESTORED: Filters
  const filteredContractors = contractors.filter(contractor => {
    const matchesSearch = contractor.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contractor.vendor_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contractor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: ContractorStatus) => {
    switch (status) {
      case ContractorStatus.ACTIVE: return 'bg-green-100 text-green-800 border-green-200';
      case ContractorStatus.SUSPENDED: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case ContractorStatus.BLACKLISTED: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeContractors = contractors.filter(c => c.status === ContractorStatus.ACTIVE).length;
  const suspendedContractors = contractors.filter(c => c.status === ContractorStatus.SUSPENDED).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contractor Management</h1>
          <p className="text-gray-600 mt-1">Manage vendor empanelment, lifecycles, and statutory obligations.</p>
        </div>
        <div className="flex gap-3">
            <Button variant="outline" className="hidden sm:flex"><FileText className="w-4 h-4 mr-2"/> New Contract</Button>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 shadow-md">
                  <Plus className="h-4 w-4 mr-2" /> Register Vendor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-gray-50">
                <DialogHeader>
                  <DialogTitle>Onboard New Contractor</DialogTitle>
                </DialogHeader>
                {/* RESTORED: Create Form */}
                <CreateContractorForm onSubmit={(data) => createMutation.mutate(data)} isLoading={createMutation.isPending} />
              </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* ENHANCED: KPI Cards (Old + New Combined) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="rounded-2xl shadow-sm border-gray-100"><CardContent className="p-5 flex flex-col justify-center">
            <p className="text-sm text-gray-500 font-medium mb-1 flex items-center"><Building className="w-4 h-4 mr-2 text-blue-500"/> Total</p>
            <p className="text-2xl font-black text-gray-900">{contractors.length}</p>
        </CardContent></Card>
        
        <Card className="rounded-2xl shadow-sm border-gray-100"><CardContent className="p-5 flex flex-col justify-center">
            <p className="text-sm text-gray-500 font-medium mb-1 flex items-center"><Users className="w-4 h-4 mr-2 text-green-500"/> Active</p>
            <p className="text-2xl font-black text-green-600">{activeContractors}</p>
        </CardContent></Card>
        
        <Card className="rounded-2xl shadow-sm border-gray-100"><CardContent className="p-5 flex flex-col justify-center">
            <p className="text-sm text-gray-500 font-medium mb-1 flex items-center"><Users className="w-4 h-4 mr-2 text-yellow-500"/> Suspended</p>
            <p className="text-2xl font-black text-yellow-600">{suspendedContractors}</p>
        </CardContent></Card>
        
        <Card className="rounded-2xl shadow-sm border-gray-100"><CardContent className="p-5 flex flex-col justify-center">
            <p className="text-sm text-gray-500 font-medium mb-1 flex items-center"><CalendarClock className="w-4 h-4 mr-2 text-orange-500"/> Expiring <span className="text-[10px] ml-1">(30d)</span></p>
            <p className="text-2xl font-black text-orange-600">0</p>
        </CardContent></Card>
        
        <Card className="rounded-2xl shadow-sm border-gray-100"><CardContent className="p-5 flex flex-col justify-center">
            <p className="text-sm text-gray-500 font-medium mb-1 flex items-center"><Network className="w-4 h-4 mr-2 text-purple-500"/> Subs</p>
            <p className="text-2xl font-black text-purple-600">{contractors.filter(c => c.parent_contractor_id).length}</p>
        </CardContent></Card>
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
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
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

      {/* Contractors List */}
      <Card className="rounded-2xl shadow-sm border-gray-100">
        <CardHeader className="border-b bg-gray-50/50 rounded-t-2xl pb-4">
          <CardTitle className="text-lg">Contractor Directory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading contractors...</div>
          ) : filteredContractors.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No contractors found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredContractors.map((c) => (
                <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => setSelectedContractor(c)}>
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold border border-blue-100 shrink-0">
                        {c.company_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                          <h4 className="font-bold text-gray-900">{c.company_name}</h4>
                          <Badge variant="outline" className={getStatusColor(c.status)}>{c.status}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] text-gray-500 font-mono">{c.vendor_code}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{c.contractor_type}</Badge>
                          <Badge variant="outline" className="text-[10px] bg-white">{c.empanelment_category}</Badge>
                          {c.is_watchlist && <Badge variant="destructive" className="text-[10px] bg-red-50 text-red-700">WATCHLIST</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block mr-4">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Trust Score</p>
                        <p className={`text-xl font-black leading-none ${c.reputation_score >= 80 ? 'text-green-600' : 'text-red-600'}`}>{c.reputation_score}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedContractor(c)}><FileText className="h-4 w-4 mr-1 hidden sm:inline" /> Profile</Button>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ContractorProfileSheet contractor={selectedContractor} isOpen={!!selectedContractor} onClose={() => setSelectedContractor(null)} />
    </div>
  );
};

// RESTORED & UPDATED: Create Contractor Form
const CreateContractorForm: React.FC<{ onSubmit: (data: ContractorCreate) => void; isLoading: boolean }> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<ContractorCreate>({
    company_name: '', vendor_code: '', contractor_type: ContractorType.LOCAL, empanelment_category: EmpanelmentCategory.GENERAL,
    empanelment_valid_upto: '', insurance_policy_no: '', insurance_valid_upto: '',
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(formData); };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <div className="space-y-1">
        <Label>Company Name *</Label>
        <Input value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} required className="bg-white" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Vendor Code *</Label>
          <Input value={formData.vendor_code} onChange={(e) => setFormData({ ...formData, vendor_code: e.target.value })} required className="bg-white" />
        </div>
        <div className="space-y-1">
          <Label>Contractor Type *</Label>
          <Select value={formData.contractor_type} onValueChange={(value: ContractorType) => setFormData({ ...formData, contractor_type: value })}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ContractorType.OEM}>OEM</SelectItem>
              <SelectItem value={ContractorType.MSME}>MSME</SelectItem>
              <SelectItem value={ContractorType.LOCAL}>Local</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Empanelment Category</Label>
        <Select value={formData.empanelment_category} onValueChange={(value: EmpanelmentCategory) => setFormData({ ...formData, empanelment_category: value })}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={EmpanelmentCategory.GENERAL}>General Works</SelectItem>
              <SelectItem value={EmpanelmentCategory.ELECTRICAL}>Electrical Class</SelectItem>
              <SelectItem value={EmpanelmentCategory.MECHANICAL}>Mechanical Class</SelectItem>
              <SelectItem value={EmpanelmentCategory.CIVIL}>Civil Works</SelectItem>
            </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Empanelment Valid Until *</Label>
        <Input type="date" value={formData.empanelment_valid_upto} onChange={(e) => setFormData({ ...formData, empanelment_valid_upto: e.target.value })} required className="bg-white" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Insurance Policy No</Label>
          <Input value={formData.insurance_policy_no} onChange={(e) => setFormData({ ...formData, insurance_policy_no: e.target.value })} className="bg-white" />
        </div>
        <div className="space-y-1">
          <Label>Insurance Valid Until</Label>
          <Input type="date" value={formData.insurance_valid_upto} onChange={(e) => setFormData({ ...formData, insurance_valid_upto: e.target.value })} className="bg-white" />
        </div>
      </div>
      <div className="pt-4"><Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">{isLoading ? 'Creating...' : 'Register Contractor'}</Button></div>
    </form>
  );
};