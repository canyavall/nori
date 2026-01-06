import { useEffect, useRef } from 'react';
import { VStack, Box, Alert, AlertIcon, Button, HStack } from '@chakra-ui/react';
import { useChat } from '../../hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SessionStatus } from './SessionStatus';

export function ChatInterface() {
  const { messages, isStreaming, error, sessionId, sendMessage, clearMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <VStack h="100%" spacing={0} align="stretch">
      {/* Header */}
      <Box p={4} borderBottom="1px" borderColor="gray.200">
        <HStack justify="space-between">
          <Box>
            <Box fontSize="sm" color="gray.600">
              {messages.length} messages
            </Box>
          </Box>
          {messages.length > 0 && (
            <Button size="sm" variant="ghost" onClick={clearMessages}>
              Clear
            </Button>
          )}
        </HStack>
      </Box>

      {/* Messages */}
      <Box flex="1" overflowY="auto" p={4}>
        {messages.length === 0 ? (
          <VStack justify="center" h="full" spacing={4} color="gray.500">
            <Box fontSize="lg" fontWeight="semibold">
              Start a conversation
            </Box>
            <Box fontSize="sm">
              Ask questions, write code, or get help with anything
            </Box>
          </VStack>
        ) : (
          <VStack align="stretch" spacing={0}>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </VStack>
        )}
      </Box>

      {/* Error */}
      {error && (
        <Box px={4}>
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        </Box>
      )}

      {/* Session Status */}
      <SessionStatus sessionId={sessionId} />

      {/* Input */}
      <Box p={4} borderTop="1px" borderColor="gray.200">
        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </Box>
    </VStack>
  );
}
