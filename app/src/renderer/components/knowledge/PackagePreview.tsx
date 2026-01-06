import { Box, Heading, Text, Badge, HStack, VStack, Code, Divider } from '@chakra-ui/react';
import type { Package } from '../../types/knowledge';

interface PackagePreviewProps {
  package: Package | null;
}

export function PackagePreview({ package: pkg }: PackagePreviewProps) {
  if (!pkg) {
    return (
      <Box p={6} textAlign="center" color="gray.500">
        <Text>Select a knowledge package to preview</Text>
      </Box>
    );
  }

  // Show first 100 lines
  const lines = pkg.content.split('\n').slice(0, 100);
  const truncated = lines.length < pkg.content.split('\n').length;

  return (
    <VStack align="stretch" spacing={4} p={4}>
      <Box>
        <Heading size="md" mb={2}>
          {pkg.name}
        </Heading>
        <Text color="gray.600" fontSize="sm" mb={2}>
          {pkg.description}
        </Text>
        <HStack spacing={2} mb={2}>
          <Badge colorScheme="blue">{pkg.category}</Badge>
          {pkg.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </HStack>
        <Text fontSize="xs" color="gray.500">
          {pkg.knowledge_path}
        </Text>
      </Box>

      <Divider />

      <Box>
        <Code
          display="block"
          whiteSpace="pre-wrap"
          p={4}
          borderRadius="md"
          fontSize="sm"
          maxH="60vh"
          overflowY="auto"
        >
          {lines.join('\n')}
          {truncated && '\n\n... (content truncated)'}
        </Code>
      </Box>
    </VStack>
  );
}
