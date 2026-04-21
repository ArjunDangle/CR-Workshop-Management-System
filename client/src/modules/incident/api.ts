// FILE: client/src/modules/incident/api.ts
import api from '@/lib/api';

export enum IncidentSeverity {
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
  FATAL = 'FATAL',
}

// FIX: Synced with Backend Models
export enum IncidentCategory {
  ELECTRICAL = 'ELECTRICAL',
  MECHANICAL = 'MECHANICAL',
  CIVIL = 'CIVIL',
  FIRE = 'FIRE',
  CHEMICAL = 'CHEMICAL',
  GENERAL = 'GENERAL',
  UNSAFE_ACT = 'UNSAFE_ACT',
  UNSAFE_CONDITION = 'UNSAFE_CONDITION',
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
  occurred_at: string;       // CHANGED from incident_date
  location_details: string;  // CHANGED from location
  machine_id?: string | null;
  permit_id?: string | null;
  contractor_id?: string | null;
  victim_ids?: string[];
}

// FIX: Restored the missing InvestigationCreate interface
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

export const createIncident = async (data: IncidentCreate): Promise<Incident> => {
  try {
    const response = await api.post<Incident>('/incidents/', data);
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to create incident"); }
};

export const getIncidents = async (params?: { status?: IncidentStatus; severity?: IncidentSeverity }): Promise<Incident[]> => {
  try {
    const response = await api.get<Incident[]>('/incidents/', { params });
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to fetch incidents"); }
};

export const getIncidentById = async (incidentId: string): Promise<Incident> => {
  try {
    const response = await api.get<Incident>(`/incidents/${incidentId}`);
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to fetch incident"); }
};

export const updateIncidentStatus = async (incidentId: string, status: IncidentStatus): Promise<Incident> => {
  try {
    const response = await api.patch(`/incidents/${incidentId}/status`, { status });
    return response.data.incident;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to update incident status"); }
};

export const submitInvestigation = async (incidentId: string, data: InvestigationCreate): Promise<Incident> => {
  try {
    const response = await api.post<Incident>(`/incidents/${incidentId}/investigation`, data);
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to submit investigation"); }
};

export const createCAPA = async (incidentId: string, data: CAPACreate): Promise<CAPA> => {
  try {
    const response = await api.post<CAPA>(`/incidents/${incidentId}/capas`, data);
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to create CAPA"); }
};

export const getCAPAsByIncidentId = async (incidentId: string): Promise<CAPA[]> => {
  try {
    const response = await api.get<CAPA[]>(`/incidents/${incidentId}/capas`);
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to fetch CAPAs"); }
};

export const updateCAPAStatus = async (capaId: string, status: CAPAStatus): Promise<CAPA> => {
  try {
    const response = await api.patch(`/incidents/capas/${capaId}/status`, { status });
    return response.data.capa;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to update CAPA status"); }
};

export const getIncidentStats = async (): Promise<IncidentStats> => {
  try {
    const response = await api.get<IncidentStats>('/incidents/stats/dashboard');
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to fetch statistics"); }
};

export const triggerKillSwitch = async (incidentId: string): Promise<any> => {
  try {
    const response = await api.post(`/incidents/kill-switch/trigger/${incidentId}`);
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to trigger kill switch"); }
};