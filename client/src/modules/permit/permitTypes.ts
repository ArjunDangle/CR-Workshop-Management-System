// FILE: client/src/modules/permit/permitTypes.ts
import { z } from 'zod';
import type { User } from '@/modules/auth/authStore';

// --- Zod Schemas ---
export const ppeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  issued_on: z.string().optional().nullable(),
  checked: z.boolean().optional(),
});

export const attendeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
});

export const permitCreateSchema = z.object({
  permit_no: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  person_responsible: z.string().optional().nullable(),
  work_location: z.string().min(1, "Work location is required"),
  work_description: z.string().min(1, "Work description is required"),
  contractor_id: z.string().min(1, "Contractor is required"),
  worker_ids: z.array(z.string()).min(1, "At least one worker is required"),
  start_date: z.string().optional().nullable(),
  start_time: z.string().optional().nullable(),
  finish_date: z.string().optional().nullable(),
  finish_time: z.string().optional().nullable(),
  fall_system_description: z.string().optional().nullable(),
  fall_does_not_arrest: z.string().optional().nullable(),
  certified_crane_near_ladder: z.boolean().optional(),
  on_crane_describe: z.string().optional().nullable(),
  other_describe: z.string().optional().nullable(),
  hazard_assessed: z.boolean().optional(),
  work_can_proceed: z.boolean().optional(),
  ppes: z.array(ppeSchema).optional().default([]),
  method_access_fixed_ladder: z.boolean().optional(),
  method_access_elevated_platform: z.boolean().optional(),
  method_access_scissor_lift: z.boolean().optional(),
  method_access_boom_lifter: z.boolean().optional(),
  method_access_catwalk: z.boolean().optional(),
  fixed_ladder_other_person_at_foot: z.string().optional().nullable(),
  fixed_ladder_adjustable_lanyard: z.string().optional().nullable(),
  electrical_isolation_obtained: z.string().optional().nullable(),
  isolation_from: z.string().optional().nullable(),
  isolation_to: z.string().optional().nullable(),
  other_block_required: z.boolean().optional(),
  other_block_describe: z.string().optional().nullable(),
  authorizer_name: z.string().optional().nullable(),
  authorizer_signature_date: z.string().optional().nullable(),
  attendees: z.array(attendeeSchema).optional().default([]),
});

export type PermitCreateData = z.infer<typeof permitCreateSchema>;

// --- Interfaces ---
export interface PermitPPE {
  id: string; permit_id: string; name: string; issued_on: string | null; checked: boolean | null;
}
export interface PermitAttendee {
  id: string; permit_id: string; name: string; phone: string;
}

export interface Permit {
  id: string; permit_type: string; status: string;
  permit_no: string | null; date: string | null; person_responsible: string | null;
  work_location: string | null; work_description: string | null;
  start_date: string | null; start_time: string | null;
  finish_date: string | null; finish_time: string | null;
  fall_system_description: string | null; fall_does_not_arrest: string | null; certified_crane_near_ladder: boolean | null;
  on_crane_describe: string | null; other_describe: string | null; hazard_assessed: boolean | null; work_can_proceed: boolean | null;
  method_access_fixed_ladder: boolean | null; method_access_elevated_platform: boolean | null; method_access_scissor_lift: boolean | null;
  method_access_boom_lifter: boolean | null; method_access_catwalk: boolean | null; fixed_ladder_other_person_at_foot: string | null;
  fixed_ladder_adjustable_lanyard: string | null; electrical_isolation_obtained: string | null; isolation_from: string | null;
  isolation_to: string | null; other_block_required: boolean | null; other_block_describe: string | null;
  authorizer_name: string | null; authorizer_signature_date: string | null; created_at: string; 
  permittee_id: string; permittee: User | null;
  authorizer_id: string | null; authorized_at: string | null; authorizer: User | null;
  approver_id: string | null; approved_at: string | null; approver_remarks: string | null; approver: User | null;
  
  // New Fields
  handback_declaration: string | null; handback_time: string | null;
  inspection_remarks: string | null; inspector_id: string | null; inspector: User | null; inspection_time: string | null;
  simops_acknowledged: boolean | null;
  
  actual_start_time: string | null; actual_end_time: string | null;
  extension_requested: boolean | null; extension_reason: string | null; requested_new_end_time: string | null;
  contractor_id: string | null; contractor_name: string | null; worker_ids: string[];
  ppes: PermitPPE[]; attendees: PermitAttendee[];
}

export interface PermitApproveData {
  approver_remarks: string;
  simops_acknowledged: boolean;
}

export const permitExtensionRequestSchema = z.object({
  extension_reason: z.string().min(1, "An extension reason is required."),
  requested_new_end_time: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid datetime string" }),
});

export type PermitExtensionRequestData = z.infer<typeof permitExtensionRequestSchema>;

export interface PermitHandbackData { handback_declaration: string; }
export interface PermitVerifyClosureData { inspection_remarks: string; }

export interface PermitConflictItem { permit_id: string; permit_no: string; conflict_type: string; description: string; }
export interface ConflictReport { has_conflicts: boolean; conflicts: PermitConflictItem[]; }