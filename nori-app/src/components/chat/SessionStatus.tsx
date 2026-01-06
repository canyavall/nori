import { HStack, Text, Badge, useColorModeValue } from '@chakra-ui/react';

interface SessionStatusProps {
  sessionId: string | null;
  tokenCount?: number;
}

export function SessionStatus({ sessionId, tokenCount = 0 }: SessionStatusProps) {
  const textColor = useColorModeValue('gray.600', 'gray.400');

  if (!sessionId) return null;

  return (
    <HStack spacing={4} px={4} py={2} borderTop="1px" borderColor="gray.200">
      <Text fontSize="xs" color={textColor}>
        Session: {sessionId.slice(0, 8)}
      </Text>
      <Badge colorScheme="purple" fontSize="xs">
        {tokenCount} tokens
      </Badge>
    </HStack>
  );
}
