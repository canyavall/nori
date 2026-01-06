/**
 * Simplified App Component (Tauri-free)
 * Replace App.tsx with this to see UI working while migrating components
 */

import { Box, VStack, Heading, Text, Button, useColorModeValue } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import * as commands from './lib/commands';

export default function App() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [role, setRole] = useState<string>('');
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    // Load data on mount
    commands.listWorkspaces().then(setWorkspaces).catch(console.error);
    commands.getActiveRole().then(setRole).catch(console.error);
  }, []);

  return (
    <Box minH="100vh" bg={bgColor} p={8}>
      <VStack spacing={6} align="stretch" maxW="800px" mx="auto">
        <Heading>Nori - Node.js Backend</Heading>

        <Box bg={cardBg} p={6} borderRadius="md" shadow="md">
          <Heading size="md" mb={4}>Active Role</Heading>
          <Text>{role || 'Loading...'}</Text>
        </Box>

        <Box bg={cardBg} p={6} borderRadius="md" shadow="md">
          <Heading size="md" mb={4}>Workspaces</Heading>
          {workspaces.length === 0 ? (
            <Text>No workspaces found</Text>
          ) : (
            <VStack align="stretch" spacing={2}>
              {workspaces.map(w => (
                <Box key={w.id} p={3} bg={bgColor} borderRadius="sm">
                  <Text fontWeight="bold">{w.name}</Text>
                  <Text fontSize="sm" color="gray.500">{w.path}</Text>
                </Box>
              ))}
            </VStack>
          )}
        </Box>

        <Box bg={cardBg} p={6} borderRadius="md" shadow="md">
          <Heading size="md" mb={4}>Backend Status</Heading>
          <Button
            colorScheme="blue"
            onClick={() => window.location.reload()}
          >
            Refresh Data
          </Button>
        </Box>

        <Box bg="yellow.100" p={4} borderRadius="md">
          <Heading size="sm" mb={2}>Migration Status</Heading>
          <Text fontSize="sm">
            ✅ Backend API functional<br/>
            ✅ React + Chakra UI loaded<br/>
            ⏳ Full UI components being migrated from Tauri<br/>
            ⏳ Chat interface needs WebSocket integration<br/>
            ⏳ Knowledge browser needs API integration
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}
