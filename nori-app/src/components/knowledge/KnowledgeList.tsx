import { VStack, Text, Tooltip, Box, useColorModeValue } from '@chakra-ui/react';
import type { Package } from '@/types/knowledge';

interface KnowledgeListProps {
  packages: Package[];
}

export function KnowledgeList({ packages }: KnowledgeListProps) {
  const itemHoverBg = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.300');

  if (packages.length === 0) {
    return (
      <Text color={textColor} fontSize="sm">
        No packages loaded
      </Text>
    );
  }

  return (
    <VStack align="stretch" spacing={1} maxH="400px" overflowY="auto">
      {packages.map((pkg) => (
        <Tooltip
          key={pkg.name}
          label={pkg.description}
          placement="right"
          hasArrow
        >
          <Box
            px={3}
            py={2}
            borderRadius="md"
            _hover={{ bg: itemHoverBg }}
            cursor="pointer"
            transition="background 0.2s"
          >
            <Text fontSize="sm" fontWeight="medium" color={textColor}>
              {pkg.name}
            </Text>
            <Text fontSize="xs" color="gray.500" noOfLines={1}>
              {pkg.category}
            </Text>
          </Box>
        </Tooltip>
      ))}
    </VStack>
  );
}
