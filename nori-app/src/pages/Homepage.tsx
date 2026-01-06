import { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Button,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  useDisclosure,
  useColorModeValue,
  Container,
} from '@chakra-ui/react';
import { useWorkspaceStore } from '@/stores/projectStore';
import { ProjectList } from '@/components/projects/ProjectList';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { OAuthFlow } from '@/components/settings/OAuthFlow';

export function Homepage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bg = useColorModeValue('gray.50', 'gray.900');
  const containerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const {
    workspaces,
    isLoading,
    error,
    loadWorkspaces,
    setActiveWorkspace,
  } = useWorkspaceStore();

  const [isSelecting, setIsSelecting] = useState(false);
  const [authStatus, setAuthStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const handleSelectWorkspace = async (workspaceId: number) => {
    setIsSelecting(true);
    try {
      await setActiveWorkspace(workspaceId);
    } catch (err) {
      console.error('Failed to set active workspace:', err);
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <Box h="100%" bg={bg} py={12} display="flex" alignItems="center" justifyContent="center">
      <Container maxW="800px">
        <Box
          bg={containerBg}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          p={8}
        >
          <VStack spacing={6} align="stretch">
            <VStack spacing={2} align="center">
              <Heading size="lg" bgGradient="linear(to-r, purple.400, pink.400)" bgClip="text">
                Welcome to Nori
              </Heading>
              <Text color="gray.600" textAlign="center">
                Select a workspace to get started or link a new one
              </Text>
            </VStack>

            {/* OAuth Setup Section */}
            <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4}>
              <Heading size="sm" mb={3}>Anthropic Authentication</Heading>
              <OAuthFlow
                onSuccess={(msg) => setAuthStatus({type: 'success', message: msg})}
                onError={(msg) => setAuthStatus({type: 'error', message: msg})}
              />
            </Box>

            {authStatus && (
              <Alert status={authStatus.type} borderRadius="md">
                <AlertIcon />
                <AlertDescription>{authStatus.message}</AlertDescription>
              </Alert>
            )}

            <Button
              colorScheme="purple"
              size="lg"
              onClick={onOpen}
              width="100%"
            >
              + Link Workspace
            </Button>

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading || isSelecting ? (
              <Box textAlign="center" py={10}>
                <Spinner size="xl" color="purple.500" thickness="4px" />
                <Text mt={4} color="gray.500">
                  {isSelecting ? 'Opening workspace...' : 'Loading workspaces...'}
                </Text>
              </Box>
            ) : workspaces.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text color="gray.500" fontSize="lg">
                  No workspaces yet
                </Text>
                <Text color="gray.400" mt={2}>
                  Click "Link Workspace" above to get started
                </Text>
              </Box>
            ) : (
              <>
                <Text fontSize="sm" color="gray.500" fontWeight="medium">
                  Your Workspaces
                </Text>
                <ProjectList projects={workspaces} onSelectProject={handleSelectWorkspace} />
              </>
            )}
          </VStack>
        </Box>
      </Container>

      <CreateProjectModal isOpen={isOpen} onClose={onClose} />
    </Box>
  );
}
