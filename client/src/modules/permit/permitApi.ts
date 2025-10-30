/*
API Service Layer for the Permit Management Module.
Handles all HTTP requests to the backend permit endpoints.
*/
import api from '@/lib/api';
// --- Import all types from our new types file ---
import type {
  Permit,
  PermitCreateData,
  PermitApproveData,
  // --- NEW: Import extension request type ---
  PermitExtensionRequestData
} from './permitTypes';

// --- API Functions ---

/**
 * Creates a new permit.
 * The backend determines the permit_type from the user's role.
 */
export const createPermit = async (data: PermitCreateData): Promise<Permit> => {
  try {
    const response = await api.post<Permit>('/permits/', data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to create permit:", error);
    throw new Error(error.response?.data?.detail || "Failed to create permit");
  }
};

/**
 * Fetches the list of permits relevant to the current user.
 * (e.g., "Pending Authorization" for SSE-Office, etc.)
 */
export const getPermits = async (): Promise<Permit[]> => {
  try {
    const response = await api.get<Permit[]>('/permits/');
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch permits:", error);
    throw new Error(error.response?.data?.detail || "Failed to fetch permits");
  }
};

/**
 * Fetches a single permit by its ID.
 */
export const getPermitById = async (permitId: string): Promise<Permit> => {
  try {
    const response = await api.get<Permit>(`/permits/${permitId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to fetch permit ${permitId}:`, error);
    throw new Error(error.response?.data?.detail || "Failed to fetch permit");
  }
};

/**
 * Authorizes a permit (Action for SSE-Office).
 */
export const authorizePermit = async (permitId: string): Promise<Permit> => {
  try {
    // No request body is needed for authorization
    const response = await api.put<Permit>(`/permits/${permitId}/authorize`);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to authorize permit ${permitId}:`, error);
    throw new Error(error.response?.data?.detail || "Failed to authorize permit");
  }
};

/**
 * Approves a permit (Action for Safety Officer).
 */
export const approvePermit = async (permitId: string, data: PermitApproveData): Promise<Permit> => {
  try {
    const response = await api.put<Permit>(`/permits/${permitId}/approve`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to approve permit ${permitId}:`, error);
    throw new Error(error.response?.data?.detail || "Failed to approve permit");
  }
};

// --- NEW: FUNCTIONS FOR PHASES 3 & 4 ---

/**
 * Activates an 'Approved' permit (Action for Permittee).
 */
export const activatePermit = async (permitId: string): Promise<Permit> => {
  try {
    const response = await api.put<Permit>(`/permits/${permitId}/activate`);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to activate permit ${permitId}:`, error);
    throw new Error(error.response?.data?.detail || "Failed to activate permit");
  }
};

/**
 * Closes an 'Active' permit (Action for Permittee).
 */
export const closePermit = async (permitId: string): Promise<Permit> => {
  try {
    const response = await api.put<Permit>(`/permits/${permitId}/close`);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to close permit ${permitId}:`, error);
    throw new Error(error.response?.data?.detail || "Failed to close permit");
  }
};

/**
 * Requests an extension for an 'Active' permit (Action for Permittee).
 */
export const requestExtension = async (permitId: string, data: PermitExtensionRequestData): Promise<Permit> => {
  try {
    const response = await api.post<Permit>(`/permits/${permitId}/request-extension`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to request extension for permit ${permitId}:`, error);
    throw new Error(error.response?.data?.detail || "Failed to request extension");
  }
};

/**
 * Approves an extension request (Action for SSE-Office).
 */
export const approveExtension = async (permitId: string): Promise<Permit> => {
  try {
    const response = await api.put<Permit>(`/permits/${permitId}/approve-extension`);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to approve extension for permit ${permitId}:`, error);
    throw new Error(error.response?.data?.detail || "Failed to approve extension");
  }
};

