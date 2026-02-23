import type { DiscoveredProject } from '@nori/shared';

export interface DiscoveredProjectCardProps {
  project: DiscoveredProject;
  onSetup: () => void;
}
