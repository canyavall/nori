import type { ClaudeMcpServer } from '@nori/shared';

export interface McpServerCardProps {
  server: ClaudeMcpServer;
  onEdit: () => void;
}
