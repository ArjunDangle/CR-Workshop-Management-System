// FILE: client/src/modules/permit/permitApi.ts
import api from '@/lib/api';
import type { Permit, PermitCreateData, PermitApproveData, PermitExtensionRequestData, PermitHandbackData, PermitVerifyClosureData, ConflictReport } from './permitTypes';

export const createPermit = async (data: PermitCreateData): Promise<Permit> => {
  try {
    const response = await api.post<Permit>('/permits/', data);
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to create permit"); }
};

export const getPermits = async (): Promise<Permit[]> => {
  try {
    const response = await api.get<Permit[]>('/permits/');
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to fetch permits"); }
};

export const getPermitById = async (permitId: string): Promise<Permit> => {
  try {
    const response = await api.get<Permit>(`/permits/${permitId}`);
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to fetch permit"); }
};

export const getPermitConflicts = async (permitId: string): Promise<ConflictReport> => {
  try {
    const response = await api.get<ConflictReport>(`/permits/${permitId}/conflicts`);
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to fetch conflicts"); }
};

export const authorizePermit = async (permitId: string): Promise<Permit> => {
  try {
    const response = await api.put<Permit>(`/permits/${permitId}/authorize`);
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to authorize permit"); }
};

export const approvePermit = async (permitId: string, data: PermitApproveData): Promise<Permit> => {
  try {
    const response = await api.put<Permit>(`/permits/${permitId}/approve`, data);
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to approve permit"); }
};

export const activatePermit = async (permitId: string): Promise<Permit> => {
  try {
    const response = await api.put<Permit>(`/permits/${permitId}/activate`);
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to activate permit"); }
};

export const submitHandback = async (permitId: string, data: PermitHandbackData): Promise<Permit> => {
  try {
    const response = await api.post<Permit>(`/permits/${permitId}/handback`, data);
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to submit handback"); }
};

export const verifyClosure = async (permitId: string, data: PermitVerifyClosureData): Promise<Permit> => {
  try {
    const response = await api.put<Permit>(`/permits/${permitId}/verify-closure`, data);
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to close permit"); }
};

export const requestExtension = async (permitId: string, data: PermitExtensionRequestData): Promise<Permit> => {
  try {
    const response = await api.post<Permit>(`/permits/${permitId}/request-extension`, data);
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to request extension"); }
};

export const approveExtension = async (permitId: string): Promise<Permit> => {
  try {
    const response = await api.put<Permit>(`/permits/${permitId}/approve-extension`);
    return response.data;
  } catch (error: any) { throw new Error(error.response?.data?.detail || "Failed to approve extension"); }
};