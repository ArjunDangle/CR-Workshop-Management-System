// client/src/modules/machine/machineApi.ts
import api from '@/lib/api';

// --- Types based on Backend Models ---

export interface Machine {
  id: string;
  asset_id: string;
  name: string;
  status: 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_SERVICE';
  criticality: 'High' | 'Medium' | 'Low';
  last_maintenance_date: string | null;
  shop_id: string;
  type_id: string;
  shop_name?: string;
  safety_lock_status?: 'NONE' | 'SAFETY_LOCK' | 'RED_TAG';
  safety_lock_reason?: string;
  safety_lock_by?: string;
  safety_lock_date?: string;
}

export interface MaintenanceTask {
  id: string;
  description: string;
  is_critical: boolean;
  requires_ppe: boolean;
}

// --- API Functions ---

/**
 * Fetches the complete registry of machines.
 * Used to populate the "Smart Machine Selector" dropdown.
 */
export const getAllMachines = async (): Promise<Machine[]> => {
  try {
    const response = await api.get<Machine[]>('/machines/');
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch machines:", error);
    throw new Error(error.response?.data?.detail || "Failed to fetch machine list");
  }
};

/**
 * Fetches the specific SOP Checklist for a selected machine.
 * Calls the backend endpoint that links Machine -> Type -> Plan -> Tasks.
 */
export const getMachineChecklist = async (machineId: string): Promise<MaintenanceTask[]> => {
  try {
    const response = await api.get<MaintenanceTask[]>(`/machines/${machineId}/checklist`);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to fetch checklist for machine ${machineId}:`, error);
    throw new Error(error.response?.data?.detail || "Failed to fetch safety checklist");
  }
};