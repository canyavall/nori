import { useState, useRef, KeyboardEvent } from 'react';
import { HStack, Textarea, IconButton } from '@chakra-ui/react';
import { ArrowUpIcon } from '@chakra-ui/icons';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (Shift+Enter for newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    // Also support Cmd/Ctrl+Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <HStack spacing={2} w="full">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message Claude... (Enter to send, Shift+Enter for newline)"
        size="md"
        resize="vertical"
        minH="40px"
        maxH="200px"
        disabled={disabled}
      />
      <IconButton
        aria-label="Send message"
        icon={<ArrowUpIcon />}
        colorScheme="blue"
        onClick={handleSend}
        isDisabled={!input.trim() || disabled}
        borderRadius="full"
      />
    </HStack>
  );
}
