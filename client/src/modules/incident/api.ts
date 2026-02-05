// client/src/modules/incident/api.ts
import api from '@/lib/api';

// --- Types based on Backend Models ---

export enum IncidentSeverity {
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
  FATAL = 'FATAL',
}

export enum IncidentCategory {
  UNSAFE_ACT = 'UNSAFE_ACT',
  UNSAFE_CONDITION = 'UNSAFE_CONDITION',
  EQUIPMENT_FAILURE = 'EQUIPMENT_FAILURE',
  PROCEDURE_VIOLATION = 'PROCEDURE_VIOLATION',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  INVESTIGATION = 'INVESTIGATION',
  CLOSED = 'CLOSED',
  CAPA_PENDING = 'CAPA_PENDING',
}

export enum CAPAStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
}

export enum CAPAType {
  CORRECTIVE = 'CORRECTIVE',
  PREVENTIVE = 'PREVENTIVE',
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  category: IncidentCategory;
  status: IncidentStatus;
  incident_date: string;
  location: string;
  reported_by: string;
  contact_number: string;
  machine_id?: string | null;
  permit_id?: string | null;
  contractor_id?: string | null;
  created_at: string;
  updated_at: string;
  // Relationships (optional, may not always be included)
  machine?: any;
  permit?: any;
  contractor?: any;
  capas?: CAPA[];
}

export interface CAPA {
  id: string;
  incident_id: string;
  title: string;
  description: string;
  type: CAPAType;
  status: CAPAStatus;
  assigned_to: string;
  due_date: string;
  completed_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentCreate {
  title: string;
  description: string;
  severity: IncidentSeverity;
  category: IncidentCategory;
  incident_date: string;
  location: string;
  reported_by: string;
  contact_number: string;
  machine_id?: string | null;
  permit_id?: string | null;
  contractor_id?: string | null;
  victim_ids?: string[]; // Array of worker IDs who were victims
}

export interface InvestigationCreate {
  root_cause_man?: string;
  root_cause_machine?: string;
  root_cause_method?: string;
  root_cause_material?: string;
  findings: string;
  evidence_photos?: string[];
  assigned_officer?: string;
}

export interface CAPACreate {
  title: string;
  description: string;
  type: CAPAType;
  assigned_to: string;
  due_date: string;
}

export interface IncidentStats {
  total_incidents: number;
  open_incidents: number;
  major_incidents: number;
  fatal_incidents: number;
  days_without_accident: number;
  pending_capas: number;
  overdue_capas: number;
}

// --- API Functions ---

/**
 * Creates a new incident (triggers kill switch if MAJOR/FATAL)
 */
export const createIncident = async (data: IncidentCreate): Promise<Incident> => {
  try {
    const response = await api.post<Incident>('/incidents/', data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to create incident:", error);
    throw new Error(error.response?.data?.detail || "Failed to create incident");
  }
};

/**
 * Fetches all incidents, optionally filtered by status or severity
 */
export const getIncidents = async (params?: { status?: IncidentStatus; severity?: IncidentSeverity }): Promise<Incident[]> => {
  try {
    const response = await api.get<Incident[]>('/incidents/', { params });
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch incidents:", error);
    throw new Error(error.response?.data?.detail || "Failed to fetch incidents");
  }
};

/**
 * Fetches a single incident by ID
 */
export const getIncidentById = async (incidentId: string): Promise<Incident> => {
  try {
    const response = await api.get<Incident>(`/incidents/${incidentId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to fetch incident ${incidentId}:`, error);
    throw new Error(error.response?.data?.detail || "Failed to fetch incident");
  }
};

/**
 * Updates incident status
 */
export const updateIncidentStatus = async (incidentId: string, status: IncidentStatus): Promise<Incident> => {
  try {
    const response = await api.patch(`/incidents/${incidentId}/status`, { status });
    return response.data.incident;
  } catch (error: any) {
    console.error(`Failed to update incident status ${incidentId}:`, error);
    throw new Error(error.response?.data?.detail || "Failed to update incident status");
  }
};

/**
 * Submits investigation for an incident
 */
export const submitInvestigation = async (incidentId: string, data: InvestigationCreate): Promise<Incident> => {
  try {
    const response = await api.post<Incident>(`/incidents/${incidentId}/investigation`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to submit investigation for incident ${incidentId}:`, error);
    throw new Error(error.response?.data?.detail || "Failed to submit investigation");
  }
};

/**
 * Creates a CAPA for an incident
 */
export const createCAPA = async (incidentId: string, data: CAPACreate): Promise<CAPA> => {
  try {
    const response = await api.post<CAPA>(`/incidents/${incidentId}/capas`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to create CAPA for incident ${incidentId}:`, error);
    throw new Error(error.response?.data?.detail || "Failed to create CAPA");
  }
};

/**
 * Fetches all CAPAs for an incident
 */
export const getCAPAsByIncidentId = async (incidentId: string): Promise<CAPA[]> => {
  try {
    const response = await api.get<CAPA[]>(`/incidents/${incidentId}/capas`);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to fetch CAPAs for incident ${incidentId}:`, error);
    throw new Error(error.response?.data?.detail || "Failed to fetch CAPAs");
  }
};

/**
 * Updates CAPA status
 */
export const updateCAPAStatus = async (capaId: string, status: CAPAStatus): Promise<CAPA> => {
  try {
    const response = await api.patch(`/incidents/capas/${capaId}/status`, { status });
    return response.data.capa;
  } catch (error: any) {
    console.error(`Failed to update CAPA status ${capaId}:`, error);
    throw new Error(error.response?.data?.detail || "Failed to update CAPA status");
  }
};

/**
 * Fetches incident statistics for dashboard
 */
export const getIncidentStats = async (): Promise<IncidentStats> => {
  try {
    const response = await api.get<IncidentStats>('/incidents/stats/dashboard');
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch incident statistics:", error);
    throw new Error(error.response?.data?.detail || "Failed to fetch statistics");
  }
};

/**
 * Manually triggers kill switch for an incident (Emergency use only)
 */
export const triggerKillSwitch = async (incidentId: string): Promise<any> => {
  try {
    const response = await api.post(`/incidents/kill-switch/trigger/${incidentId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to trigger kill switch for incident ${incidentId}:`, error);
    throw new Error(error.response?.data?.detail || "Failed to trigger kill switch");
  }
};
