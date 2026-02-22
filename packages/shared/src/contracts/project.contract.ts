import type { Project } from '../types/project.js';

export interface ProjectRegisterResponse {
  project: Project;
}

export interface ProjectListResponse {
  data: Project[];
}

export const PROJECT_LIST_API = {
  method: 'GET' as const,
  path: '/api/project',
} as const;

export const PROJECT_REGISTER_API = {
  method: 'POST' as const,
  path: '/api/project',
} as const;
