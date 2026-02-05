// client/src/modules/contractor/components/dashboards/SSEOfficeContractorDashboard.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Users, Building, Search, Filter, Edit, Trash2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { getContractors, createContractor, Contractor, ContractorStatus, ContractorType } from '../../api';
import { ContractorCreate } from '../../api';

export const SSEOfficeContractorDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: contractors = [], isLoading, refetch } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => getContractors(),
  });

  const createMutation = useMutation({
    mutationFn: (data: ContractorCreate) => createContractor(data),
    onSuccess: () => {
      toast({
        title: 'Contractor Created',
        description: 'Contractor has been successfully onboarded.',
      });
      setCreateDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create contractor',
        variant: 'destructive',
      });
    },
  });

  // Filter contractors
  const filteredContractors = contractors.filter(contractor => {
    const matchesSearch = contractor.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contractor.vendor_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contractor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: ContractorStatus) => {
    switch (status) {
      case ContractorStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case ContractorStatus.SUSPENDED:
        return 'bg-yellow-100 text-yellow-800';
      case ContractorStatus.BLACKLISTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activeContractors = contractors.filter(c => c.status === ContractorStatus.ACTIVE).length;
  const suspendedContractors = contractors.filter(c => c.status === ContractorStatus.SUSPENDED).length;
  const blacklistedContractors = contractors.filter(c => c.status === ContractorStatus.BLACKLISTED).length;

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contractor Management</h1>
          <p className="text-gray-600 mt-1">Manage contractor onboarding and compliance</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Onboard Contractor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Onboard New Contractor</DialogTitle>
            </DialogHeader>
            <CreateContractorForm 
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Contractors</p>
                <p className="text-2xl font-bold text-gray-900">{contractors.length}</p>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeContractors}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Suspended</p>
                <p className="text-2xl font-bold text-yellow-600">{suspendedContractors}</p>
              </div>
              <Users className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Blacklisted</p>
                <p className="text-2xl font-bold text-red-600">{blacklistedContractors}</p>
              </div>
              <Users className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contractors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
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
      <Card>
        <CardHeader>
          <CardTitle>Contractors</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredContractors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No contractors found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredContractors.map((contractor) => (
                <div
                  key={contractor.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{contractor.company_name}</h3>
                      <Badge className={getStatusColor(contractor.status)}>
                        {contractor.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>Vendor: {contractor.vendor_code}</span>
                      <span>Type: {contractor.contractor_type}</span>
                      <span>Safety Rating: {contractor.safety_rating}/5</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Create Contractor Form Component
const CreateContractorForm: React.FC<{ onSubmit: (data: ContractorCreate) => void; isLoading: boolean }> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<ContractorCreate>({
    company_name: '',
    vendor_code: '',
    contractor_type: ContractorType.LOCAL,
    empanelment_valid_upto: '',
    insurance_policy_no: '',
    insurance_valid_upto: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="company_name">Company Name *</Label>
        <Input
          id="company_name"
          value={formData.company_name}
          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="vendor_code">Vendor Code *</Label>
        <Input
          id="vendor_code"
          value={formData.vendor_code}
          onChange={(e) => setFormData({ ...formData, vendor_code: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="contractor_type">Contractor Type *</Label>
        <Select value={formData.contractor_type} onValueChange={(value: ContractorType) => setFormData({ ...formData, contractor_type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ContractorType.OEM}>OEM</SelectItem>
            <SelectItem value={ContractorType.MSME}>MSME</SelectItem>
            <SelectItem value={ContractorType.LOCAL}>Local</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="empanelment_valid_upto">Empanelment Valid Until *</Label>
        <Input
          id="empanelment_valid_upto"
          type="date"
          value={formData.empanelment_valid_upto}
          onChange={(e) => setFormData({ ...formData, empanelment_valid_upto: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="insurance_policy_no">Insurance Policy Number</Label>
        <Input
          id="insurance_policy_no"
          value={formData.insurance_policy_no}
          onChange={(e) => setFormData({ ...formData, insurance_policy_no: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="insurance_valid_upto">Insurance Valid Until</Label>
        <Input
          id="insurance_valid_upto"
          type="date"
          value={formData.insurance_valid_upto}
          onChange={(e) => setFormData({ ...formData, insurance_valid_upto: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Creating...' : 'Create Contractor'}
        </Button>
      </div>
    </form>
  );
};