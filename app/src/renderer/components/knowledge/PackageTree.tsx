import { Box, VStack, Text, Collapse, HStack } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import type { SearchResult } from '../../types/knowledge';

interface PackageTreeProps {
  results: SearchResult[];
  onSelect: (name: string) => void;
  selectedPackage: string | null;
}

export function PackageTree({ results, onSelect, selectedPackage }: PackageTreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Group packages by category
  const grouped = results.reduce(
    (acc, result) => {
      const category = result.package.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(result);
      return acc;
    },
    {} as Record<string, SearchResult[]>
  );

  const categories = Object.keys(grouped).sort();

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  if (results.length === 0) {
    return (
      <Box p={4} textAlign="center" color="gray.500">
        <Text fontSize="sm">No packages found</Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" spacing={1} p={2}>
      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category);
        const packages = grouped[category];

        return (
          <Box key={category}>
            <HStack
              p={2}
              cursor="pointer"
              _hover={{ bg: 'gray.100' }}
              onClick={() => toggleCategory(category)}
              borderRadius="md"
            >
              {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
              <Text fontWeight="semibold" fontSize="sm">
                {category} ({packages.length})
              </Text>
            </HStack>

            <Collapse in={isExpanded} animateOpacity>
              <VStack align="stretch" pl={6} spacing={0}>
                {packages.map((result) => (
                  <Box
                    key={result.package.name}
                    p={2}
                    cursor="pointer"
                    bg={selectedPackage === result.package.name ? 'blue.50' : 'transparent'}
                    _hover={{ bg: selectedPackage === result.package.name ? 'blue.100' : 'gray.50' }}
                    onClick={() => onSelect(result.package.name)}
                    borderRadius="md"
                  >
                    <Text fontSize="sm" noOfLines={1}>
                      {result.package.name}
                    </Text>
                    <Text fontSize="xs" color="gray.500" noOfLines={1}>
                      {result.package.description}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </Collapse>
          </Box>
        );
      })}
    </VStack>
  );
}
