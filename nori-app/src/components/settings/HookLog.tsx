import { Box, Text, Code, VStack, Badge, useColorModeValue } from '@chakra-ui/react';
import type { HookResult } from '@/types/hooks';

interface HookLogProps {
  result: HookResult | null;
}

export function HookLog({ result }: HookLogProps) {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (!result) {
    return (
      <Text fontSize="sm" color="gray.500">
        No execution logs yet. Click "Test" to run the hook.
      </Text>
    );
  }

  return (
    <VStack align="stretch" spacing={3}>
      <Box>
        <Badge colorScheme={result.success ? 'green' : 'red'} mb={2}>
          {result.success ? 'Success' : 'Failed'}
        </Badge>
      </Box>

      {result.error && (
        <Box>
          <Text fontSize="sm" fontWeight="bold" color="red.500" mb={1}>
            Error:
          </Text>
          <Code
            display="block"
            whiteSpace="pre-wrap"
            p={2}
            bg={bgColor}
            borderRadius="md"
            fontSize="xs"
            colorScheme="red"
          >
            {result.error}
          </Code>
        </Box>
      )}

      {result.stdout && (
        <Box>
          <Text fontSize="sm" fontWeight="bold" mb={1}>
            Output (stdout):
          </Text>
          <Code
            display="block"
            whiteSpace="pre-wrap"
            p={2}
            bg={bgColor}
            border="1px"
            borderColor={borderColor}
            borderRadius="md"
            fontSize="xs"
            maxH="200px"
            overflowY="auto"
          >
            {result.stdout}
          </Code>
        </Box>
      )}

      {result.stderr && (
        <Box>
          <Text fontSize="sm" fontWeight="bold" mb={1}>
            Errors (stderr):
          </Text>
          <Code
            display="block"
            whiteSpace="pre-wrap"
            p={2}
            bg={bgColor}
            border="1px"
            borderColor="red.300"
            borderRadius="md"
            fontSize="xs"
            maxH="200px"
            overflowY="auto"
            color="red.600"
          >
            {result.stderr}
          </Code>
        </Box>
      )}

      {result.output !== null && result.output !== undefined && (
        <Box>
          <Text fontSize="sm" fontWeight="bold" mb={1}>
            Parsed Output (JSON):
          </Text>
          <Code
            display="block"
            whiteSpace="pre-wrap"
            p={2}
            bg={bgColor}
            border="1px"
            borderColor={borderColor}
            borderRadius="md"
            fontSize="xs"
            maxH="200px"
            overflowY="auto"
          >
            {JSON.stringify(result.output, null, 2)}
          </Code>
        </Box>
      )}
    </VStack>
  );
}
