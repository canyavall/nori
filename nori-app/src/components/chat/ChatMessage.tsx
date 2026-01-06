import { Box, HStack, Text, Avatar } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import type { ChatMessage as ChatMessageType } from '../../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <HStack
      align="flex-start"
      spacing={3}
      justify={isUser ? 'flex-end' : 'flex-start'}
      w="full"
      mb={4}
    >
      {!isUser && (
        <Avatar size="sm" name="Claude" bg="purple.500" color="white" />
      )}

      <Box
        maxW="70%"
        bg={isUser ? 'blue.500' : 'gray.100'}
        color={isUser ? 'white' : 'gray.800'}
        px={4}
        py={3}
        borderRadius="lg"
        boxShadow="sm"
      >
        {isUser ? (
          <Text whiteSpace="pre-wrap">{message.content}</Text>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}

        {message.streaming && (
          <Text fontSize="xs" mt={2} opacity={0.7}>
            Streaming...
          </Text>
        )}
      </Box>

      {isUser && (
        <Avatar size="sm" name="User" bg="blue.500" color="white" />
      )}
    </HStack>
  );
}
