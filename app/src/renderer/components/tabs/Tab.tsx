import { Box, HStack, Text, IconButton, useColorModeValue } from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';

interface TabProps {
  id: string;
  title: string;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}

export function Tab({ title, isActive, onSelect, onClose }: TabProps) {
  const activeBg = useColorModeValue('white', 'gray.800');
  const inactiveBg = useColorModeValue('gray.100', 'gray.700');
  const hoverBg = useColorModeValue('gray.200', 'gray.650');
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const inactiveTextColor = useColorModeValue('gray.600', 'gray.400');

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <Box
      px={4}
      py={2}
      bg={isActive ? activeBg : inactiveBg}
      borderTopRadius="md"
      borderWidth="1px"
      borderBottomWidth={isActive ? '0' : '1px'}
      borderColor={borderColor}
      cursor="pointer"
      onClick={onSelect}
      position="relative"
      minW="120px"
      maxW="200px"
      _hover={{ bg: isActive ? activeBg : hoverBg }}
      transition="background 0.2s"
    >
      <HStack spacing={2} justify="space-between">
        <Text
          fontSize="sm"
          fontWeight={isActive ? 'semibold' : 'normal'}
          color={isActive ? textColor : inactiveTextColor}
          isTruncated
          flex="1"
        >
          {title}
        </Text>
        <IconButton
          aria-label="Close tab"
          icon={<CloseIcon />}
          size="xs"
          variant="ghost"
          onClick={handleClose}
          opacity={isActive ? 1 : 0.6}
          _hover={{ opacity: 1 }}
        />
      </HStack>
    </Box>
  );
}
