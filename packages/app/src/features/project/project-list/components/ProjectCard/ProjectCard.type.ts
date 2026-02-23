import type { Project } from '@nori/shared';

export interface ProjectCardProps {
  project: Project;
  onSelect: () => void;
  isSelected: boolean;
}
