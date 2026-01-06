/**
 * RoleSwitcher Component
 *
 * Dropdown menu for switching between role personalities.
 * Keyboard shortcut: Cmd/Ctrl + R
 */

import { Button, Menu, MenuButton, MenuItem, MenuList, Text, VStack } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useRole } from '@/hooks/useRole';
import { useEffect } from 'react';
import type { RoleId } from '@/types/role';

export function RoleSwitcher() {
  const { currentRole, allRoles, setRole, isLoading } = useRole();

  // Keyboard shortcut: Cmd/Ctrl + R
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        // TODO: Focus menu trigger or cycle through roles
        console.log('Role switcher shortcut triggered');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleRoleChange = async (roleId: RoleId) => {
    await setRole(roleId);
  };

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        isLoading={isLoading}
        colorScheme={currentRole.color}
        variant="outline"
        size="sm"
      >
        {currentRole.name}
      </MenuButton>
      <MenuList>
        {allRoles.map(role => (
          <MenuItem
            key={role.id}
            onClick={() => handleRoleChange(role.id)}
            isDisabled={role.id === currentRole.id}
          >
            <VStack align="start" spacing={0}>
              <Text fontWeight="medium">{role.name}</Text>
              <Text fontSize="xs" color="gray.500">
                {role.description}
              </Text>
            </VStack>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}
