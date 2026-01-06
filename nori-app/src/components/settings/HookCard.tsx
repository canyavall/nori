import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Collapse,
  useDisclosure,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react';
import type { HookInfo, HookResult } from '@/types/hooks';
import { HookLog } from './HookLog';

interface HookCardProps {
  hook: HookInfo;
  onTest: (hookName: string, event: string, data: unknown) => Promise<HookResult>;
}

export function HookCard({ hook, onTest }: HookCardProps) {
  const { isOpen, onToggle } = useDisclosure();
  const [testResult, setTestResult] = useState<HookResult | null>(null);
  const [testing, setTesting] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleTest = async () => {
    setTesting(true);
    try {
      const sampleData = {
        event: hook.event,
        timestamp: Date.now(),
        data: {
          prompt: 'Test prompt from Nori',
          sessionId: 'test-session-123',
        },
      };

      const result = await onTest(hook.name, hook.event, sampleData);
      setTestResult(result);
    } catch (err) {
      console.error('Hook test failed:', err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Box
      bg={bgColor}
      border="1px"
      borderColor={borderColor}
      borderRadius="md"
      p={4}
    >
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <HStack>
              <Text fontWeight="bold">{hook.name}</Text>
              <Badge colorScheme="purple">{hook.event}</Badge>
              <Badge colorScheme={hook.enabled ? 'green' : 'gray'}>
                {hook.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </HStack>
            <Text fontSize="xs" color="gray.500" noOfLines={1}>
              {hook.path}
            </Text>
          </VStack>
          <HStack>
            <Button size="sm" onClick={handleTest} isLoading={testing}>
              Test
            </Button>
            <Button size="sm" variant="ghost" onClick={onToggle}>
              {isOpen ? 'Hide Logs' : 'Show Logs'}
            </Button>
          </HStack>
        </HStack>

        <Collapse in={isOpen} animateOpacity>
          <Box pt={3}>
            <Divider mb={3} />
            <HookLog result={testResult} />
          </Box>
        </Collapse>
      </VStack>
    </Box>
  );
}
