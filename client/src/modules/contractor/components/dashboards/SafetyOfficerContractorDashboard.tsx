// client/src/modules/contractor/components/dashboards/SafetyOfficerContractorDashboard.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Users, AlertTriangle, Ban, Search, Filter, Eye, FileText } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { getContractors, Contractor, ContractorStatus } from '../../api';

export const SafetyOfficerContractorDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  const { data: contractors = [], isLoading } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => getContractors(),
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
  const lowSafetyRatingContractors = contractors.filter(c => c.safety_rating < 3).length;

  const handleSuspend = (contractorId: string) => {
    toast({
      title: 'Contractor Suspended',
      description: 'Contractor has been suspended due to safety concerns.',
    });
  };

  const handleBlacklist = (contractorId: string) => {
    toast({
      title: 'Contractor Blacklisted',
      description: 'Contractor has been blacklisted due to severe safety violations.',
      variant: 'destructive',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contractor Safety Oversight</h1>
        <p className="text-gray-600 mt-1">Monitor contractor compliance and safety performance</p>
      </div>

      {/* Safety KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Contractors</p>
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
              <Ban className="h-8 w-8 text-yellow-500" />
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
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Safety Rating</p>
                <p className="text-2xl font-bold text-orange-600">{lowSafetyRatingContractors}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Safety Alerts */}
      {lowSafetyRatingContractors > 0 && (
        <Alert className="bg-orange-50 border-orange-200">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {lowSafetyRatingContractors} contractor(s) have safety ratings below 3.0. Review required.
          </AlertDescription>
        </Alert>
      )}

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
          <CardTitle>Contractors - Safety View</CardTitle>
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
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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
                      {contractor.safety_rating < 3 && (
                        <Badge className="bg-orange-100 text-orange-800">
                          Low Safety Rating
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>Vendor: {contractor.vendor_code}</span>
                      <span>Type: {contractor.contractor_type}</span>
                      <span className="font-medium">Safety Rating: {contractor.safety_rating}/5</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-1" />
                      Audit
                    </Button>
                    {contractor.status === ContractorStatus.ACTIVE && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-yellow-600 hover:text-yellow-700"
                          onClick={() => handleSuspend(contractor.id)}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Suspend
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleBlacklist(contractor.id)}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Blacklist
                        </Button>
                      </>
                    )}
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