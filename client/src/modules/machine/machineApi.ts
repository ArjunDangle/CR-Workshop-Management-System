// client/src/modules/machine/machineApi.ts
import api from '@/lib/api';

// --- Types based on Backend Models ---

export interface Machine {
  id: string;
  asset_id: string;
  name: string;
  // Preserving your existing backend enum values
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

  // --- NEW FIELDS (Added for Visual Dashboard) ---
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

// --- Existing API Functions (PRESERVED) ---

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

// --- New Dashboard API Object ---
// This object aggregates functions for the new SSE Office Dashboard.
// It reuses 'getAllMachines' to ensure consistency.

export const machineApi = {
  // 1. Fetch all (Reuses existing function)
  getAll: getAllMachines,

  // 2. Get single machine details
  getById: async (id: string): Promise<Machine> => {
    const response = await api.get<Machine>(`/machines/${id}`);
    return response.data;
  },

  // 3. Create a new machine
  create: async (data: Partial<Machine>): Promise<Machine> => {
    const response = await api.post<Machine>("/machines/", data);
    return response.data;
  },

  // 4. Update status
  updateStatus: async (id: string, status: string): Promise<Machine> => {
    const response = await api.patch<Machine>(`/machines/${id}/status`, { status });
    return response.data;
  }
};