/**
 * Role Types
 *
 * Defines the 5 role personalities available in Nori.
 */

export type RoleId = 'po' | 'architect' | 'engineer' | 'ciso' | 'sre';

export interface Role {
  id: RoleId;
  name: string;
  description: string;
  color: string;
}

export const ROLES: Record<RoleId, Role> = {
  po: {
    id: 'po',
    name: 'Product Owner',
    description: 'Focus on user stories, requirements, and business value',
    color: 'blue',
  },
  architect: {
    id: 'architect',
    name: 'Architect',
    description: 'System design, architecture patterns, technical decisions',
    color: 'purple',
  },
  engineer: {
    id: 'engineer',
    name: 'Engineer',
    description: 'Implementation, code quality, testing, best practices',
    color: 'green',
  },
  ciso: {
    id: 'ciso',
    name: 'CISO',
    description: 'Security, compliance, risk assessment, threat modeling',
    color: 'red',
  },
  sre: {
    id: 'sre',
    name: 'SRE',
    description: 'Reliability, monitoring, infrastructure, performance',
    color: 'orange',
  },
};

export const DEFAULT_ROLE: RoleId = 'engineer';
