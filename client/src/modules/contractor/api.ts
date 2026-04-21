// client/src/modules/contractor/api.ts
import api from '@/lib/api';

// --- ENUMS ---
export enum ContractorStatus { ACTIVE = 'ACTIVE', SUSPENDED = 'SUSPENDED', BLACKLISTED = 'BLACKLISTED' }
export enum ContractorType { OEM = 'OEM', MSME = 'MSME', LOCAL = 'LOCAL' }
export enum WorkerSkill { SKILLED = 'SKILLED', SEMI_SKILLED = 'SEMI_SKILLED', UNSKILLED = 'UNSKILLED', SPECIALIST = 'SPECIALIST' }
export enum WorkerTrade { ELECTRICIAN = 'ELECTRICIAN', FITTER = 'FITTER', WELDER = 'WELDER', RIGGER = 'RIGGER', HELPER = 'HELPER' }

// NEW ENUMS
export enum EmpanelmentCategory { ELECTRICAL = "ELECTRICAL", MECHANICAL = "MECHANICAL", CIVIL = "CIVIL", GENERAL = "GENERAL" }
export enum ContractStatus { TENDER_ISSUED = "TENDER_ISSUED", EMPANELLED = "EMPANELLED", ACTIVE = "ACTIVE", EXPIRED = "EXPIRED", CLOSED = "CLOSED" }
export enum ObligationType { PF_ESI = "PF_ESI", TOOLBOX_TALK = "TOOLBOX_TALK", WAGE_RECORD = "WAGE_RECORD", SAFETY_MEETING = "SAFETY_MEETING" }
export enum ObligationStatus { PENDING = "PENDING", SUBMITTED = "SUBMITTED", VERIFIED = "VERIFIED", OVERDUE = "OVERDUE" }
export enum GatePassState { INSIDE = "INSIDE", OUTSIDE = "OUTSIDE", DENIED = "DENIED" }
export enum ChecklistPhase { MOBILIZATION = "MOBILIZATION", DEMOBILIZATION = "DEMOBILIZATION" }

// --- INTERFACES ---
export interface ContractChecklist {
  id: string; phase: ChecklistPhase; task_name: string; is_completed: boolean; completed_at?: string;
}
export interface ContractObligation {
  id: string; title: string; type: ObligationType; due_date: string; status: ObligationStatus; document_url?: string;
}
export interface Contract {
  id: string; contractor_id: string; tender_number: string; name: string;
  status: ContractStatus; start_date?: string; end_date?: string;
  mobilization_progress: number; demobilization_progress: number;
  checklists: ContractChecklist[]; obligations: ContractObligation[];
}

export interface Contractor {
  id: string; company_name: string; vendor_code: string;
  status: ContractorStatus; contractor_type: ContractorType;
  safety_rating: number; reputation_score: number;
  empanelment_category: EmpanelmentCategory; is_watchlist: boolean;
  parent_contractor_id?: string;
  empanelment_valid_upto: string; insurance_policy_no?: string; insurance_valid_upto?: string;
  created_at: string;
  subcontractors?: Contractor[];
}

export interface WorkerCertification {
  id: string; certification_name: string; issuing_authority: string; issue_date: string; expiry_date?: string;
}
export interface Worker {
  id: string; contractor_id: string; contractor_name?: string; full_name: string; id_proof_number: string;
  skill_category: WorkerSkill; trade: WorkerTrade; is_blacklisted: boolean;
  medical_valid_upto: string; safety_training_valid_upto: string;
  gate_pass_state: GatePassState; medical_fitness_category?: string;
  safety_induction_date?: string; safety_induction_score?: number;
  photo_url?: string; certifications?: WorkerCertification[];
}
export interface GatePass {
  id: string; worker_id: string; entry_time: string; exit_time?: string; status: string; denial_reason?: string;
}

export interface WorkerValidationResult { eligible: boolean; reason: string; }

// --- CREATION INTERFACES ---
export interface ContractorCreate {
  company_name: string; vendor_code: string; contractor_type: ContractorType;
  empanelment_category?: EmpanelmentCategory; parent_contractor_id?: string;
  empanelment_valid_upto: string; insurance_policy_no?: string; insurance_valid_upto?: string;
}
export interface WorkerCreate {
  contractor_id: string; full_name: string; id_proof_number: string;
  skill_category: WorkerSkill; trade: WorkerTrade;
  medical_valid_upto: string; safety_training_valid_upto: string;
}

// --- API FUNCTIONS ---
export const getContractors = async (status?: ContractorStatus): Promise<Contractor[]> => {
  const params = status ? { status } : {};
  const response = await api.get<Contractor[]>('/contractors/', { params });
  return response.data;
};

export const createContractor = async (data: ContractorCreate): Promise<Contractor> => {
  const response = await api.post<Contractor>('/contractors/', data);
  return response.data;
};

// RESTORED: Update Contractor Status (Suspend/Blacklist)
export const updateContractorStatus = async (contractorId: string, status: ContractorStatus, reason: string): Promise<Contractor> => {
  const response = await api.patch<Contractor>(`/contractors/${contractorId}/status`, { status, reason });
  return response.data;
};

export const getContracts = async (contractorId: string): Promise<Contract[]> => {
  const response = await api.get<Contract[]>(`/contractors/${contractorId}/contracts`);
  return response.data;
};

export const getWorkers = async (contractorId: string): Promise<Worker[]> => {
  const response = await api.get<Worker[]>(`/contractors/${contractorId}/workers`);
  return response.data;
};

export const createWorker = async (contractorId: string, data: Omit<WorkerCreate, 'contractor_id'>): Promise<Worker> => {
  const response = await api.post<Worker>(`/contractors/${contractorId}/workers`, data);
  return response.data;
};

export const validateWorker = async (workerId: string): Promise<WorkerValidationResult> => {
  const response = await api.get<WorkerValidationResult>(`/workers/${workerId}/validate`);
  return response.data;
};

export const scanGatePass = async (workerId: string, direction: 'IN' | 'OUT'): Promise<GatePass> => {
  const response = await api.post<GatePass>(`/workers/${workerId}/gate-scan`, { direction });
  return response.data;
};

export const toggleChecklist = async (checklistId: string): Promise<any> => {
  const response = await api.patch(`/contractors/checklists/${checklistId}/toggle`);
  return response.data;
};