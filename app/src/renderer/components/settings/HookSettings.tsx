import {
  VStack,
  Box,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  Spinner,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useHooks } from '@/hooks/useHooks';
import { HookCard } from './HookCard';

export function HookSettings() {
  const { hooks, loading, error, loadHooks, executeHook } = useHooks();
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  // Group hooks by event
  const hooksByEvent = hooks.reduce((acc, hook) => {
    if (!acc[hook.event]) {
      acc[hook.event] = [];
    }
    acc[hook.event].push(hook);
    return acc;
  }, {} as Record<string, typeof hooks>);

  return (
    <VStack h="100%" align="stretch" spacing={0}>
      {/* Header */}
      <Box p={6} borderBottom="1px" borderColor="gray.200">
        <HStack justify="space-between" align="center">
          <Box>
            <Heading size="md" mb={1}>
              Hook Configuration
            </Heading>
            <Text fontSize="sm" color="gray.600">
              Manage lifecycle hooks in ~/.nori/hooks/
            </Text>
          </Box>
          <Button onClick={loadHooks} isLoading={loading} size="sm">
            Refresh
          </Button>
        </HStack>
      </Box>

      {/* Content */}
      <Box flex="1" overflowY="auto" p={6} bg={bgColor}>
        {loading && (
          <HStack justify="center" py={10}>
            <Spinner />
            <Text>Loading hooks...</Text>
          </HStack>
        )}

        {error && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            {error}
          </Alert>
        )}

        {!loading && hooks.length === 0 && (
          <Box textAlign="center" py={10}>
            <Text color="gray.500" mb={4}>
              No hooks found in ~/.nori/hooks/
            </Text>
            <Text fontSize="sm" color="gray.400">
              Create .mjs, .js, .sh, .py, or .exe files in the hooks directory
            </Text>
          </Box>
        )}

        {!loading && hooks.length > 0 && (
          <VStack align="stretch" spacing={6}>
            {Object.entries(hooksByEvent).map(([event, eventHooks]) => (
              <Box key={event}>
                <Heading size="sm" mb={3}>
                  {event} ({eventHooks.length})
                </Heading>
                <VStack align="stretch" spacing={3}>
                  {eventHooks.map((hook) => (
                    <HookCard
                      key={hook.name}
                      hook={hook}
                      onTest={executeHook}
                    />
                  ))}
                </VStack>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );
}
