// client/src/modules/contractor/api.ts
import api from '@/lib/api';

// --- Types based on Backend Models ---

export enum ContractorStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BLACKLISTED = 'BLACKLISTED'
}

export enum ContractorType {
  OEM = 'OEM',
  MSME = 'MSME',
  LOCAL = 'LOCAL'
}

export enum WorkerSkill {
  SKILLED = 'SKILLED',
  SEMI_SKILLED = 'SEMI_SKILLED',
  UNSKILLED = 'UNSKILLED',
  SPECIALIST = 'SPECIALIST'
}

export enum WorkerTrade {
  ELECTRICIAN = 'ELECTRICIAN',
  FITTER = 'FITTER',
  WELDER = 'WELDER',
  RIGGER = 'RIGGER',
  HELPER = 'HELPER'
}

export interface Contractor {
  id: string;
  company_name: string;
  vendor_code: string;
  status: ContractorStatus;
  contractor_type: ContractorType;
  safety_rating: number;
  empanelment_valid_upto: string;
  insurance_policy_no?: string;
  insurance_valid_upto?: string;
  created_at: string;
}

export interface Worker {
  id: string;
  contractor_id: string;
  contractor_name?: string;
  full_name: string;
  id_proof_number: string;
  skill_category: WorkerSkill;
  trade: WorkerTrade;
  is_blacklisted: boolean;
  medical_valid_upto: string;
  safety_training_valid_upto: string;
  photo_url?: string;
}

export interface WorkerValidationResult {
  eligible: boolean;
  reason: string;
}

export interface ContractorCreate {
  company_name: string;
  vendor_code: string;
  contractor_type: ContractorType;
  empanelment_valid_upto: string;
  insurance_policy_no?: string;
  insurance_valid_upto?: string;
}

export interface WorkerCreate {
  contractor_id: string;
  full_name: string;
  id_proof_number: string;
  skill_category: WorkerSkill;
  trade: WorkerTrade;
  medical_valid_upto: string;
  safety_training_valid_upto: string;
}

// --- API Functions ---

/**
 * Fetches all contractors, optionally filtered by status
 */
export const getContractors = async (status?: ContractorStatus): Promise<Contractor[]> => {
  try {
    const params = status ? { status } : {};
    const response = await api.get<Contractor[]>('/contractors/', { params });
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch contractors:", error);
    throw new Error(error.response?.data?.detail || "Failed to fetch contractor list");
  }
};

/**
 * Creates a new contractor
 */
export const createContractor = async (data: ContractorCreate): Promise<Contractor> => {
  try {
    const response = await api.post<Contractor>('/contractors/', data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to create contractor:", error);
    throw new Error(error.response?.data?.detail || "Failed to create contractor");
  }
};

/**
 * Fetches workers for a specific contractor
 */
export const getWorkers = async (contractorId: string): Promise<Worker[]> => {
  try {
    const response = await api.get<Worker[]>(`/contractors/${contractorId}/workers`);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to fetch workers for contractor ${contractorId}:`, error);
    throw new Error(error.response?.data?.detail || "Failed to fetch worker list");
  }
};

/**
 * Creates a new worker for a specific contractor
 */
export const createWorker = async (contractorId: string, data: Omit<WorkerCreate, 'contractor_id'>): Promise<Worker> => {
  try {
    const response = await api.post<Worker>(`/contractors/${contractorId}/workers`, data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to create worker:", error);
    throw new Error(error.response?.data?.detail || "Failed to create worker");
  }
};

/**
 * Validates if a worker is eligible for work permits
 */
export const validateWorker = async (workerId: string): Promise<WorkerValidationResult> => {
  try {
    const response = await api.get<WorkerValidationResult>(`/workers/${workerId}/validate`);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to validate worker ${workerId}:`, error);
    throw new Error(error.response?.data?.detail || "Failed to validate worker");
  }
};