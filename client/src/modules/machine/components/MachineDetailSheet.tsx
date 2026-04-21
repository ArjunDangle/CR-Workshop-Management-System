import React, { useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Factory, Zap, Weight, UserCog, Calendar, ShieldAlert, FileText, AlertTriangle, Wrench, Clock } from "lucide-react";
import { format } from "date-fns";

import { machineApi, Machine, MachinePassport } from "../machineApi";

interface MachineDetailSheetProps {
  machine: Machine | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MachineDetailSheet: React.FC<MachineDetailSheetProps> = ({ machine, isOpen, onClose }) => {
  
  // Fetch full passport data when the sheet opens
  const { data: passport, isLoading, isError } = useQuery<MachinePassport>({
    queryKey: ['machine_passport', machine?.id],
    queryFn: () => machineApi.getPassport(machine!.id),
    enabled: isOpen && !!machine?.id,
  });

  if (!machine) return null;

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

  const renderTimelineIcon = (type: string) => {
      if (type === 'PERMIT') return <FileText className="h-4 w-4 text-blue-500" />;
      if (type === 'INCIDENT') return <AlertTriangle className="h-4 w-4 text-red-500" />;
      return <Wrench className="h-4 w-4 text-gray-500" />;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      {/* Expanded Width for Passport Feel */}
      <SheetContent className="w-full sm:max-w-[600px] md:max-w-[700px] overflow-y-auto p-0 bg-[#F9FAFB]">
        
        {isLoading ? (
            <div className="flex items-center justify-center h-full"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
        ) : isError || !passport ? (
            <div className="p-8 text-center text-red-500">Failed to load Machine Passport.</div>
        ) : (
            <div className="flex flex-col h-full">
                
                {/* --- HERO BANNER --- */}
                <div className="relative h-64 w-full bg-black">
                    {passport.machine.image_url ? (
                        <img src={passport.machine.image_url} alt={passport.machine.name} className="w-full h-full object-cover opacity-60" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-200">No Image Available</div>
                    )}
                    
                    {/* Absolute Positioning for Identity */}
                    <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 to-transparent">
                        <div className="flex justify-between items-end">
                            <div>
                                <Badge className={`${getStatusColor(passport.machine.status)} border-0 mb-2`}>{passport.machine.status.replace(/_/g, " ")}</Badge>
                                <h2 className="text-3xl font-bold text-white tracking-tight">{passport.machine.name}</h2>
                                <p className="text-gray-300 font-mono mt-1">{passport.machine.asset_id}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- ACTIVE PERMIT ALERT --- */}
                {passport.active_permits.length > 0 && (
                    <div className="bg-yellow-50 border-b border-yellow-200 p-4">
                        <div className="flex items-start">
                            <ShieldAlert className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-yellow-800">ACTIVE OPERATION IN PROGRESS</h4>
                                <p className="text-xs text-yellow-700 mt-1">Permit #{passport.active_permits[0].permit_no} is active for: {passport.active_permits[0].description}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TABS SECTION --- */}
                <div className="p-6 flex-grow">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-200/50">
                            <TabsTrigger value="overview" className="rounded-xl">Identity</TabsTrigger>
                            <TabsTrigger value="timeline" className="rounded-xl">Health Timeline</TabsTrigger>
                            <TabsTrigger value="operations" className="rounded-xl">Operations</TabsTrigger>
                        </TabsList>
                        
                        {/* TAB 1: IDENTITY */}
                        <TabsContent value="overview" className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                                    <div className="bg-blue-50 p-2 rounded-lg"><MapPin className="h-5 w-5 text-blue-600"/></div>
                                    <div><p className="text-xs text-gray-500 font-medium">Zone</p><p className="text-sm font-bold">{passport.machine.workspace_zone}</p></div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                                    <div className="bg-purple-50 p-2 rounded-lg"><UserCog className="h-5 w-5 text-purple-600"/></div>
                                    <div><p className="text-xs text-gray-500 font-medium">Required Competency</p><p className="text-sm font-bold">{passport.machine.competency_required}</p></div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                                    <div className="bg-yellow-50 p-2 rounded-lg"><Zap className="h-5 w-5 text-yellow-600"/></div>
                                    <div><p className="text-xs text-gray-500 font-medium">Power Source</p><p className="text-sm font-bold">{passport.machine.power_source}</p></div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                                    <div className="bg-gray-50 p-2 rounded-lg"><Weight className="h-5 w-5 text-gray-600"/></div>
                                    <div><p className="text-xs text-gray-500 font-medium">Weight Class</p><p className="text-sm font-bold">{passport.machine.weight_capacity}</p></div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center"><Factory className="h-4 w-4 mr-2 text-gray-400"/> Manufacturer Details</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between border-b pb-2"><span className="text-sm text-gray-500">Make</span><span className="text-sm font-medium">{passport.machine.manufacturer || 'Unknown'}</span></div>
                                    <div className="flex justify-between border-b pb-2"><span className="text-sm text-gray-500">Model</span><span className="text-sm font-medium">{passport.machine.model_name || 'Unknown'}</span></div>
                                    <div className="flex justify-between border-b pb-2"><span className="text-sm text-gray-500">Install Year</span><span className="text-sm font-medium">{passport.machine.install_year || 'Unknown'}</span></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">Last Maintenance</span><span className="text-sm font-medium">{passport.machine.last_maintenance_date || 'No Records'}</span></div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB 2: HEALTH TIMELINE */}
                        <TabsContent value="timeline">
                            <ScrollArea className="h-[400px] pr-4">
                                {passport.health_timeline.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 flex flex-col items-center"><Clock className="h-10 w-10 mb-3 opacity-20"/> No historical events logged for this machine.</div>
                                ) : (
                                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                        {passport.health_timeline.map((event, idx) => (
                                            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                {/* Icon */}
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                                    {renderTimelineIcon(event.event_type)}
                                                </div>
                                                {/* Card */}
                                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-bold text-gray-400 uppercase">{format(new Date(event.event_date), 'dd MMM yyyy')}</span>
                                                        {event.severity && <Badge variant="destructive" className="text-[10px] px-1.5">{event.severity}</Badge>}
                                                    </div>
                                                    <h4 className="text-sm font-bold text-gray-900">{event.title}</h4>
                                                    <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                                                    <div className="text-[10px] text-gray-400 mt-3 pt-2 border-t flex justify-between">
                                                        <span>By: {event.actor_name || 'System'}</span>
                                                        <span className="font-semibold">{event.status}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </TabsContent>

                        {/* TAB 3: OPERATIONS & INCIDENTS */}
                        <TabsContent value="operations" className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center"><FileText className="h-4 w-4 mr-2 text-blue-500"/> Active & Recent Permits</h3>
                                {passport.active_permits.length === 0 ? (
                                    <p className="text-xs text-gray-500 italic bg-white p-4 rounded-xl border border-dashed">No active permits.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {passport.active_permits.map(p => (
                                            <div key={p.id} className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm flex justify-between items-center">
                                                <div><p className="text-xs font-bold text-blue-800">Permit #{p.permit_no}</p><p className="text-[10px] text-gray-500 mt-0.5">{p.description}</p></div>
                                                <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700">{p.status}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center"><AlertTriangle className="h-4 w-4 mr-2 text-red-500"/> Linked Incidents</h3>
                                {passport.recent_incidents.length === 0 ? (
                                    <p className="text-xs text-gray-500 italic bg-white p-4 rounded-xl border border-dashed">No incidents reported.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {passport.recent_incidents.map(inc => (
                                            <div key={inc.id} className="bg-white p-3 rounded-xl border border-red-100 shadow-sm">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-xs font-bold text-red-800">{inc.code}</p>
                                                    <Badge variant="destructive" className="text-[10px]">{inc.severity}</Badge>
                                                </div>
                                                <p className="text-[10px] text-gray-600">{inc.title}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        )}
      </SheetContent>
    </Sheet>
  );
};