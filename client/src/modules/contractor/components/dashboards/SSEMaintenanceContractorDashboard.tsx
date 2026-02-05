import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button'; // The missing import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Building, Search, Filter, Eye, Wrench } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getContractors, Contractor, ContractorStatus } from '../../api';

export const SSEMaintenanceContractorDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(ContractorStatus.ACTIVE);

  const { data: contractors = [], isLoading } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => getContractors(),
  });

  // Filter contractors - only show approved ones
  const filteredContractors = contractors.filter(contractor => {
    const matchesSearch = contractor.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contractor.vendor_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contractor.status === statusFilter;
    const isApproved = contractor.status === ContractorStatus.ACTIVE;
    return matchesSearch && matchesStatus && isApproved;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Approved Contractors</h1>
        <p className="text-gray-600 mt-1">View contractors approved for maintenance work</p>
      </div>

      {/* KPI Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved Contractors</p>
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
                <p className="text-sm text-gray-600">Available for Work</p>
                <p className="text-2xl font-bold text-blue-600">{filteredContractors.length}</p>
              </div>
              <Wrench className="h-8 w-8 text-blue-500" />
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
                <SelectItem value={ContractorStatus.ACTIVE}>Active Only</SelectItem>
                <SelectItem value="all">All (View Only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contractors List */}
      <Card>
        <CardHeader>
          <CardTitle>Approved Contractors</CardTitle>
          <p className="text-sm text-gray-600">Only contractors with active status are shown</p>
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
              <p>No approved contractors found</p>
              <p className="text-sm text-gray-400 mt-2">
                Only contractors with active status are displayed
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredContractors.map((contractor) => (
                <div
                  key={contractor.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{contractor.company_name}</h3>
                      <Badge className="bg-green-100 text-green-800">
                        {contractor.status}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800">
                        Approved
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>Vendor: {contractor.vendor_code}</span>
                      <span>Type: {contractor.contractor_type}</span>
                      <span className="font-medium">Safety Rating: {contractor.safety_rating}/5</span>
                      <span>Valid Until: {new Date(contractor.empanelment_valid_upto).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">View-Only Access</h3>
              <p className="text-blue-700 text-sm mt-1">
                As SSE-Maintenance, you can only view approved contractors. 
                For contractor management actions (onboarding, suspension, blacklisting), 
                please contact SSE-Office or Safety Officer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};