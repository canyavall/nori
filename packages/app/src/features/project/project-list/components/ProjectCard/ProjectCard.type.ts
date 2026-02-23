import type { DiscoveredProject } from '@nori/shared';

export interface ProjectCardProps {
  project: DiscoveredProject;
  onSelect: () => void;
  isSelected: boolean;
}
