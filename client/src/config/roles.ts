// src/config/roles.ts
export interface Subclass {
  id: string;
  name: string;
}

export interface Role {
  id: string;
  name: string;
  subclasses?: Subclass[];
}

export const ROLES: Role[] = [
  {
    id: 'sse-maintenance',
    name: 'SSE-Maintenance',
    subclasses: [
      { id: 'sse-maintenance-mw', name: 'SSE-Maintenance - MW' },
      { id: 'sse-maintenance-substation', name: 'SSE-Maintenance - Substation' },
    ]
  },
  { id: 'sse-office', name: 'SSE-Office' }, // No subclasses
  { id: 'safety-officer', name: 'Safety Officer' }, // No subclasses
];