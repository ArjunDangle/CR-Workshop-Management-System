// FILE: client/src/modules/incident/api.ts
import api from '@/lib/api';

export enum IncidentSeverity {
  NEAR_MISS = 'NEAR_MISS',
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
  FATAL = 'FATAL',
  CRITICAL = 'CRITICAL',
}

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
  INVESTIGATION_PENDING = 'INVESTIGATION_PENDING',
  CAPA_PENDING = 'CAPA_PENDING',
  CLOSED = 'CLOSED',
  INVESTIGATING = 'INVESTIGATING',
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

export enum ReviewStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED_NEEDS_WORK = 'REJECTED_NEEDS_WORK',
}

export interface IncidentWitness {
  id: string;
  witness_name: string;
  statement: string;
  recorded_at: string;
  worker_id?: string | null;
  user_id?: string | null;
}

export interface Investigation {
  id: string;
  investigated_by_id?: string | null;
  started_at: string;
  completed_at?: string | null;
  root_cause_category?: string | null;
  root_cause_analysis?: string | null;
  witness_statements?: string | null;
  conclusion?: string | null;
}

export interface Incident {
  id: string;
  incident_code: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  category: IncidentCategory;
  status: IncidentStatus;
  occurred_at: string;
  reported_at: string;
  location_details: string;
  is_work_stopped: boolean;
  
  investigation_due_at?: string | null;
  resolved_at?: string | null;
  review_status: ReviewStatus;
  review_remarks?: string | null;
  resolution_permit_id?: string | null;
  reviewed_by_id?: string | null;

  machine_id?: string | null;
  permit_id?: string | null;
  contractor_id?: string | null;
  reported_by_id?: string | null;
  
  machine?: any;
  permit?: any;
  contractor?: any;
  reported_by?: any;
  
  capa_items?: CAPA[];
  witnesses?: IncidentWitness[];
  investigation?: Investigation | null;
}

export interface CAPA {
  id: string;
  incident_id: string;
  action_description: string;
  type: CAPAType;
  status: CAPAStatus;
  assigned_to_id?: string | null;
  deadline: string;
  completed_at?: string | null;
  remarks?: string | null;
}

export interface IncidentCreate {
  title: string;
  description: string;
  severity: IncidentSeverity;
  category: IncidentCategory;
  occurred_at: string;       
  location_details: string;  
  machine_id?: string | null;
  permit_id?: string | null;
  contractor_id?: string | null;
  victim_ids?: string[];
}

export interface CAPACreate {
  action_description: string;
  type: CAPAType;
  assigned_to_id?: string | null;
  deadline: string;
  remarks?: string | null;
}

export interface IncidentWitnessCreate {
  witness_name: string;
  statement: string;
  worker_id?: string | null;
  user_id?: string | null;
}

export interface InvestigationCreate {
  root_cause_category?: string;
  root_cause_analysis?: string;
  conclusion: string;
}

export interface IncidentReviewUpdate {
  review_status: ReviewStatus;
  review_remarks: string;
}

export interface IncidentStats {
  total_incidents: number;
  open_incidents: number;
  major_incidents: number;
  fatal_incidents: number;
  days_without_accident: number;
  pending_capas: number;
  overdue_capas: number;
  investigation_incidents?: number;
  closed_incidents?: number;
}

// --- API Calls ---

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
    return response.data.incident || response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to update incident status"); }
};

export const linkResolutionPermit = async (incidentId: string, permitId: string): Promise<Incident> => {
  try {
    const response = await api.post(`/incidents/${incidentId}/link-resolution-permit`, { permit_id: permitId });
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to link permit to incident"); }
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
    return response.data.capa || response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to update CAPA status"); }
};

export const addWitness = async (incidentId: string, data: IncidentWitnessCreate): Promise<IncidentWitness> => {
  try {
    const response = await api.post<IncidentWitness>(`/incidents/${incidentId}/witnesses`, data);
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to add witness"); }
};

export const reviewIncident = async (incidentId: string, data: IncidentReviewUpdate): Promise<Incident> => {
  try {
    const response = await api.post<Incident>(`/incidents/${incidentId}/review`, data);
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to submit review"); }
};

export const getIncidentStats = async (): Promise<IncidentStats> => {
  try {
    const response = await api.get<IncidentStats>('/incidents/stats/dashboard');
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to fetch statistics"); }
};