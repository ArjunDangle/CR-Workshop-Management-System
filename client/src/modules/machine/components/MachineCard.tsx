import React from "react";
import { Machine } from "../machineApi"; 
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, AlertTriangle, Lock, MapPin, UserCog } from "lucide-react";

interface MachineCardProps {
  machine: Machine;
  onView: (machine: Machine) => void;
  showReportFault?: boolean; 
  onReportFault?: (machine: Machine) => void;
  showSafetyAction?: boolean;
  onSafetyAction?: (machine: Machine) => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({ machine, onView, showReportFault, onReportFault, showSafetyAction, onSafetyAction }) => {
  const isCritical = machine.criticality === "High";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPERATIONAL": return "bg-green-500 text-white";
      case "UNDER_MAINTENANCE": return "bg-yellow-500 text-white";
      case "OUT_OF_SERVICE": return "bg-gray-500 text-white";
      case "SAFETY_LOCK": return "bg-orange-600 text-white";
      case "RED_TAG": return "bg-red-700 text-white animate-pulse";
      default: return "bg-slate-200 text-slate-800";
    }
  };

  const getCompetencyColor = (comp: string) => {
    if (comp === 'SPECIALIST') return "border-purple-200 text-purple-700 bg-purple-50";
    if (comp === 'SKILLED') return "border-blue-200 text-blue-700 bg-blue-50";
    return "border-gray-200 text-gray-700 bg-gray-50";
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full rounded-2xl border-gray-100 group">
      {/* Image Section */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        {machine.image_url ? (
          <img src={machine.image_url} alt={machine.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-300 font-medium">No Image</div>
        )}
        
        {/* Status Badge Overlay */}
        <div className="absolute top-3 right-3">
          <Badge className={`${getStatusColor(machine.status)} shadow-md border-0 px-3 py-1 font-semibold tracking-wide uppercase text-[10px]`}>
            {machine.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-5 flex-grow space-y-3">
        <div>
            <h3 className="font-bold text-lg leading-tight text-gray-900 line-clamp-1">{machine.name}</h3>
            <p className="text-xs font-mono font-medium text-gray-400 mt-1">{machine.asset_id}</p>
        </div>

        <div className="space-y-2 pt-2">
            <div className="flex items-center text-xs text-gray-600">
                <MapPin className="w-3.5 h-3.5 mr-2 text-gray-400" />
                <span className="truncate font-medium">{machine.workspace_zone}</span>
            </div>
            <div className="flex items-center text-xs text-gray-600">
                <UserCog className="w-3.5 h-3.5 mr-2 text-gray-400" />
                <span>Requires: <Badge variant="outline" className={`ml-1 text-[9px] px-1.5 ${getCompetencyColor(machine.competency_required)}`}>{machine.competency_required}</Badge></span>
            </div>
        </div>
      </CardContent>

      {/* Footer / Actions */}
      <CardFooter className="p-4 pt-0 gap-2 bg-gray-50/50 mt-auto">
        <Button variant="outline" className="flex-1 rounded-xl bg-white hover:bg-gray-50" onClick={() => onView(machine)}>
            <Eye className="w-4 h-4 mr-2" /> Passport
        </Button>

        {showReportFault && onReportFault && (
            <Button variant="destructive" className="flex-1 rounded-xl" onClick={(e) => { e.stopPropagation(); onReportFault(machine); }}>
                <AlertTriangle className="w-4 h-4 mr-2" /> Fault
            </Button>
        )}

        {showSafetyAction && onSafetyAction && (
            <Button className="flex-1 bg-orange-600 hover:bg-orange-700 rounded-xl text-white" onClick={(e) => { e.stopPropagation(); onSafetyAction(machine); }}>
                <Lock className="w-4 h-4 mr-2" /> LOTO
            </Button>
        )}
      </CardFooter>
    </Card>
  );
};