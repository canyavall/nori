/**
 * useRole Hook
 *
 * Convenience hook for accessing role state and actions.
 */

import { useRoleStore } from '@/stores/roleStore';
import { ROLES } from '@/types/role';

export function useRole() {
  const { activeRole, personalityText, isLoading, error, setRole } = useRoleStore();

  const currentRole = ROLES[activeRole];

  return {
    activeRole,
    currentRole,
    personalityText,
    isLoading,
    error,
    setRole,
    allRoles: Object.values(ROLES),
  };
}
