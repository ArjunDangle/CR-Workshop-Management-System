import React from "react";
import { Machine } from "../machineApi"; 
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, AlertTriangle, Lock } from "lucide-react";

interface MachineCardProps {
  machine: Machine;
  onView: (machine: Machine) => void;
  // New Optional Props for specific roles
  showReportFault?: boolean; 
  onReportFault?: (machine: Machine) => void;
  showSafetyAction?: boolean;
  onSafetyAction?: (machine: Machine) => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({ 
  machine, 
  onView,
  showReportFault = false,
  onReportFault,
  showSafetyAction = false,
  onSafetyAction
}) => {
  
  const isCritical = machine.criticality === "High";

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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
      {/* --- Image Section --- */}
      <div className="relative h-48 w-full bg-slate-200">
        {machine.image_url ? (
          <img 
            src={machine.image_url} 
            alt={machine.name} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            No Image
          </div>
        )}
        
        <div className="absolute top-2 right-2">
          <Badge className={`${getStatusColor(machine.status)} text-white shadow-sm border-0`}>
            {machine.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      {/* --- Content --- */}
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg leading-tight line-clamp-2">{machine.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-1">{machine.shop_name}</p>
        <p className="text-xs font-mono text-slate-500">{machine.asset_id}</p>
        
        {isCritical && (
           <Badge variant="outline" className="mt-2 text-orange-600 border-orange-200 text-xs">
             High Criticality
           </Badge>
        )}
      </CardContent>

      {/* --- Footer / Actions --- */}
      <CardFooter className="p-4 pt-0 gap-2">
        <Button variant="outline" className="flex-1" onClick={() => onView(machine)}>
            <Eye className="w-4 h-4 mr-2" /> View
        </Button>

        {/* Maintenance Button */}
        {showReportFault && onReportFault && (
            <Button 
                variant="destructive" 
                className="flex-1"
                onClick={(e) => {
                    e.stopPropagation();
                    onReportFault(machine);
                }}
            >
                <AlertTriangle className="w-4 h-4 mr-2" /> Fault
            </Button>
        )}

        {/* Safety Button */}
        {showSafetyAction && onSafetyAction && (
            <Button 
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                onClick={(e) => {
                    e.stopPropagation();
                    onSafetyAction(machine);
                }}
            >
                <Lock className="w-4 h-4 mr-2" /> Lock
            </Button>
        )}
      </CardFooter>
    </Card>
  );
};