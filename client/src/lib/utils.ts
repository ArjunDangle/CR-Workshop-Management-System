import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { User } from "@/modules/auth/authStore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- NEW ROLE HELPER ---
export type AppRole = 'sse-maintenance' | 'sse-office' | 'safety-officer' | 'unknown';

export const getUserRoleVariant = (user: User | null): AppRole => {
  if (!user || !user.role) return 'unknown';

  const roleName = user.role.name || '';

  // Check for Maintenance (covers MW, Substation, etc.)
  if (roleName.startsWith('SSE-Maintenance')) {
    return 'sse-maintenance';
  }

  // Check for Office
  if (roleName === 'SSE-Office') {
    return 'sse-office';
  }

  // Check for Safety Officer
  if (roleName === 'Safety Officer') {
    return 'safety-officer';
  }

  return 'unknown';
};