// client/src/modules/contractor/components/ContractorSelect.tsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, AlertTriangle, Building, Loader2 } from 'lucide-react';

import { getContractors, Contractor, ContractorStatus } from '../api';

// Shadcn UI Components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ContractorSelectProps {
  value?: string;
  onChange: (contractorId: string, contractor: Contractor) => void;
  showSafetyStatus?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const ContractorSelect: React.FC<ContractorSelectProps> = ({
  value,
  onChange,
  showSafetyStatus = true,
  placeholder = "Select a contractor...",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const { data: contractors = [], isLoading, error } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => getContractors(),
    enabled: isOpen && !disabled,
  });

  const selectedContractor = contractors.find(c => c.id === value);

  const getStatusColor = (status: ContractorStatus) => {
    switch (status) {
      case ContractorStatus.ACTIVE:
        return 'bg-green-500';
      case ContractorStatus.SUSPENDED:
        return 'bg-yellow-500';
      case ContractorStatus.BLACKLISTED:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: ContractorStatus) => {
    switch (status) {
      case ContractorStatus.ACTIVE:
        return 'default';
      case ContractorStatus.SUSPENDED:
        return 'secondary';
      case ContractorStatus.BLACKLISTED:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const isContractorSelectable = (contractor: Contractor) => {
    return contractor.status === ContractorStatus.ACTIVE;
  };

  const handleContractorSelect = (contractorId: string) => {
    const contractor = contractors.find(c => c.id === contractorId);
    if (contractor && isContractorSelectable(contractor)) {
      onChange(contractorId, contractor);
    }
  };

  if (error) {
    return (
      <Select disabled>
        <SelectTrigger className="border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span>Failed to load contractors</span>
          </div>
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <div className="space-y-2">
      <Select
        value={value}
        onValueChange={handleContractorSelect}
        disabled={disabled}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className={cn(
          "min-h-[42px]",
          selectedContractor && !isContractorSelectable(selectedContractor) && "border-red-200 bg-red-50"
        )}>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading contractors...</span>
            </div>
          ) : selectedContractor ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{selectedContractor.company_name}</span>
                <span className="text-sm text-gray-500">({selectedContractor.vendor_code})</span>
              </div>
              {showSafetyStatus && (
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    getStatusColor(selectedContractor.status)
                  )} />
                  <Badge 
                    variant={getStatusBadgeVariant(selectedContractor.status)}
                    className="text-xs"
                  >
                    {selectedContractor.status}
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </SelectTrigger>
        
        <SelectContent className="max-h-80">
          {contractors.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No contractors found
            </div>
          ) : (
            contractors.map((contractor) => {
              const selectable = isContractorSelectable(contractor);
              return (
                <SelectItem
                  key={contractor.id}
                  value={contractor.id}
                  disabled={!selectable}
                  className={cn(
                    "cursor-pointer",
                    !selectable && "cursor-not-allowed opacity-60"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 flex-1">
                      <Building className="h-4 w-4 text-gray-500" />
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{contractor.company_name}</span>
                        <span className="text-sm text-gray-500">{contractor.vendor_code}</span>
                      </div>
                    </div>
                    {showSafetyStatus && (
                      <div className="flex items-center gap-2 ml-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          getStatusColor(contractor.status)
                        )} />
                        <Badge 
                          variant={getStatusBadgeVariant(contractor.status)}
                          className="text-xs"
                        >
                          {contractor.status}
                        </Badge>
                        {selectable && contractor.id === value && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    )}
                  </div>
                </SelectItem>
              );
            })
          )}
        </SelectContent>
      </Select>
      
      {selectedContractor && !isContractorSelectable(selectedContractor) && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          <AlertTriangle className="h-4 w-4" />
          <span>
            This contractor is {selectedContractor.status.toLowerCase()} and cannot be selected for work permits.
          </span>
        </div>
      )}
    </div>
  );
};

export default ContractorSelect;