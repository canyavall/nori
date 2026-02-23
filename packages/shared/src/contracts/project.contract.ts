import type { Project, DiscoveredProject } from '../types/project.js';

export interface ProjectRegisterResponse {
  project: Project;
}

export interface ProjectListResponse {
  data: Project[];
}

export interface ProjectDiscoverResponse {
  data: DiscoveredProject[];
}

export const PROJECT_LIST_API = {
  method: 'GET' as const,
  path: '/api/project',
} as const;

export const PROJECT_REGISTER_API = {
  method: 'POST' as const,
  path: '/api/project',
} as const;

export const PROJECT_DISCOVER_API = {
  method: 'GET' as const,
  path: '/api/project/discover',
} as const;
