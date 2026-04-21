// FILE: client/src/modules/machine/machineApi.ts
import api from '@/lib/api';

export interface Machine {
  id: string; 
  asset_id: string; 
  name: string;
  // FIX: Added SAFETY_LOCK and RED_TAG to the allowed status types
  status: 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_SERVICE' | 'SAFETY_LOCK' | 'RED_TAG' | string; 
  criticality: 'High' | 'Medium' | 'Low' | string;
  last_maintenance_date: string | null; 
  shop_id: string; 
  type_id: string; 
  shop_name?: string;
  
  // FIX: Added Passport Fields so TypeScript knows they exist
  workspace_zone: string;
  weight_capacity: string;
  power_source: string;
  competency_required: string;

  image_url?: string | null; 
  manufacturer?: string; 
  model_name?: string; 
  install_year?: number;
}

export interface MaintenanceTask {
  id: string; 
  description: string; 
  is_critical: boolean; 
  requires_ppe: boolean;
}

export interface TimelineEvent {
  event_date: string; 
  event_type: string; 
  title: string; 
  description: string | null; 
  status: string | null; 
  severity: string | null; 
  actor_name: string | null;
}

export interface MachinePassport {
  machine: Machine;
  active_permits: any[];
  recent_incidents: any[];
  health_timeline: TimelineEvent[];
}

export const getAllMachines = async (): Promise<Machine[]> => {
  const response = await api.get<Machine[]>('/machines/'); 
  return response.data;
};

export const getMachineChecklist = async (machineId: string): Promise<MaintenanceTask[]> => {
  const response = await api.get<MaintenanceTask[]>(`/machines/${machineId}/checklist`); 
  return response.data;
};

export const getMachinePassport = async (machineId: string): Promise<MachinePassport> => {
  const response = await api.get<MachinePassport>(`/machines/${machineId}/passport`); 
  return response.data;
};

export const machineApi = {
  getAll: getAllMachines,
  getById: async (id: string): Promise<Machine> => {
    const response = await api.get<Machine>(`/machines/${id}`);
    return response.data;
  },
  create: async (data: Partial<Machine>): Promise<Machine> => {
    const response = await api.post<Machine>("/machines/", data);
    return response.data;
  },
  updateStatus: async (id: string, status: string): Promise<Machine> => {
    const response = await api.patch<Machine>(`/machines/${id}/status`, { status });
    return response.data;
  },
  getPassport: getMachinePassport,
};