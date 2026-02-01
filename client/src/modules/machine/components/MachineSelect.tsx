// client/src/modules/machine/components/MachineSelect.tsx
import React, { useState } from 'react';
import { Check, ChevronsUpDown, Loader2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { getAllMachines, Machine } from '../machineApi';

interface MachineSelectProps {
  /**
   * The currently selected machine ID (UUID)
   */
  value?: string | null;
  /**
   * Callback fired when a machine is selected
   */
  onSelect: (machineId: string, machine: Machine) => void;
  /**
   * Disable the dropdown (e.g. during submission)
   */
  disabled?: boolean;
}

export const MachineSelect: React.FC<MachineSelectProps> = ({
  value,
  onSelect,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);

  // Fetch machines from the backend
  const { 
    data: machines = [], 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['machines'],
    queryFn: getAllMachines,
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
  });

  // Find the currently selected machine object for display
  const selectedMachine = machines.find((machine) => machine.id === value);

  if (isError) {
    return (
      <div className="flex items-center text-destructive text-sm h-10 px-3 border border-destructive/50 rounded-md bg-destructive/10">
        <AlertCircle className="w-4 h-4 mr-2" />
        Failed to load machine registry.
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-11 text-left font-normal"
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <span className="flex items-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading Asset Registry...
            </span>
          ) : selectedMachine ? (
            <span className="flex flex-col items-start leading-tight">
              <span className="font-semibold">{selectedMachine.asset_id}</span>
              <span className="text-xs text-muted-foreground truncate max-w-[250px]">
                {selectedMachine.name}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Select a machine asset...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by Asset ID or Name..." />
          <CommandList>
            <CommandEmpty>No machine found.</CommandEmpty>
            <CommandGroup>
              {machines.map((machine) => (
                <CommandItem
                  key={machine.id}
                  value={`${machine.asset_id} ${machine.name}`} // Allow searching by both ID and Name
                  onSelect={() => {
                    onSelect(machine.id, machine);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === machine.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{machine.asset_id}</span>
                    <span className="text-xs text-muted-foreground">{machine.name}</span>
                  </div>
                  
                  {/* Status Indicator Badge */}
                  <div className="ml-auto flex items-center">
                    <div 
                      className={cn(
                        "h-2 w-2 rounded-full mr-2",
                        machine.status === 'OPERATIONAL' ? "bg-green-500" : 
                        machine.status === 'UNDER_MAINTENANCE' ? "bg-red-500" : "bg-yellow-500"
                      )} 
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default MachineSelect;