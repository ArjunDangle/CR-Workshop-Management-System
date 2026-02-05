import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
// FIX: Import from machineApi
import { Machine } from "../machineApi";
import { Calendar } from "lucide-react";

interface MachineDetailSheetProps {
  machine: Machine | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MachineDetailSheet: React.FC<MachineDetailSheetProps> = ({
  machine,
  isOpen,
  onClose,
}) => {
  if (!machine) return null;

  // Helper for Status Badge Color (Updated for Uppercase)
  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPERATIONAL": return "bg-green-500 hover:bg-green-600";
      case "UNDER_MAINTENANCE": return "bg-yellow-500 hover:bg-yellow-600";
      case "OUT_OF_SERVICE": return "bg-red-500 hover:bg-red-600";
      case "SAFETY_LOCK": return "bg-orange-600 hover:bg-orange-700";
      case "RED_TAG": return "bg-red-700 hover:bg-red-800";
      default: return "bg-slate-500";
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            {machine.name}
          </SheetTitle>
          <SheetDescription>Asset ID: {machine.asset_id}</SheetDescription>
        </SheetHeader>

        {/* --- Hero Image --- */}
        <div className="w-full h-64 bg-slate-100 rounded-lg overflow-hidden mb-6 border">
          {machine.image_url ? (
            <img 
              src={machine.image_url} 
              alt={machine.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              No Image Available
            </div>
          )}
        </div>

        {/* --- Status Section --- */}
        <div className="flex items-center justify-between mb-6">
          <Badge className={`${getStatusColor(machine.status)} text-white px-4 py-1 text-md border-0`}>
            {machine.status.replace(/_/g, " ")}
          </Badge>
          <Badge variant="outline" className="border-blue-200 text-blue-700">
            {machine.criticality} Criticality
          </Badge>
        </div>

        <Separator className="my-6" />

        {/* --- Technical Details --- */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Technical Specifications</h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block">Manufacturer</span>
              <span className="font-medium">{machine.manufacturer || "N/A"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Model</span>
              <span className="font-medium">{machine.model_name || "N/A"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Install Year</span>
              <span className="font-medium">{machine.install_year || "N/A"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Shop Location</span>
              <span className="font-medium">{machine.shop_name || "N/A"}</span>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* --- Maintenance Info --- */}
        <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Maintenance History
            </h3>
            <div className="bg-slate-50 p-4 rounded-md border text-sm">
                <p className="text-muted-foreground mb-1">Last Maintenance</p>
                <p className="font-medium">{machine.last_maintenance_date || "No records found"}</p>
            </div>
        </div>

      </SheetContent>
    </Sheet>
  );
};