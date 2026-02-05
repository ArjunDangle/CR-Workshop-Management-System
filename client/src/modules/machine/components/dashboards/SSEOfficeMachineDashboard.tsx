import React, { useState, useEffect } from "react";
// FIX: Import 'Machine' and 'machineApi' from the same file, going up 2 levels
// Go UP 2 levels to find the API
import { machineApi, Machine } from '../../machineApi';

// Go UP 1 level to find the components
import { MachineCard } from '../MachineCard';
import { MachineDetailSheet } from '../MachineDetailSheet';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Loader2 } from "lucide-react";

export const SSEOfficeMachineDashboard = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [filteredMachines, setFilteredMachines] = useState<Machine[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Slider State
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { toast } = useToast();

  // 1. Fetch Data using your machineApi
  useEffect(() => {
    const loadMachines = async () => {
      try {
        setIsLoading(true);
        // Ensure your machineApi has a method like getAll() or getMachines()
        // Adjust '.getAll()' to match whatever you named the function in machineApi.ts
        const data = await machineApi.getAll(); 
        setMachines(data);
        setFilteredMachines(data);
      } catch (error) {
        console.error("Failed to fetch machines:", error);
        toast({
          title: "Error",
          description: "Failed to load machine inventory.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMachines();
  }, [toast]);

  // 2. Search Logic
  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = machines.filter(
      (m) =>
        m.name.toLowerCase().includes(lowerQuery) ||
        m.asset_id.toLowerCase().includes(lowerQuery) ||
        m.shop_name.toLowerCase().includes(lowerQuery)
    );
    setFilteredMachines(filtered);
  }, [searchQuery, machines]);

  const handleViewMachine = (machine: Machine) => {
    setSelectedMachine(machine);
    setIsSheetOpen(true);
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Machine Inventory</h1>
          <p className="text-muted-foreground">
            Overview of all workshop assets and their operational status.
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add New Machine
        </Button>
      </div>

      {/* --- Filters --- */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, asset ID, or shop..." 
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* --- Grid Content --- */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filteredMachines.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          No machines found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
          {filteredMachines.map((machine) => (
            <MachineCard 
              key={machine.id} 
              machine={machine} 
              onView={handleViewMachine}
            />
          ))}
        </div>
      )}

      {/* --- The Slider Component --- */}
      <MachineDetailSheet 
        machine={selectedMachine}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
    </div>
  );
};