/**
 * RoleBadge Component
 *
 * Visual indicator showing the currently active role.
 */

import { Badge } from '@chakra-ui/react';
import { useRole } from '@/hooks/useRole';

export function RoleBadge() {
  const { currentRole } = useRole();

  return (
    <Badge colorScheme={currentRole.color} fontSize="sm" px={3} py={1} borderRadius="md">
      {currentRole.name}
    </Badge>
  );
}
