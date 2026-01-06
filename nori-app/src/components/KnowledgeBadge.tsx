import { useState, useEffect } from 'react';
import {
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  useColorModeValue,
  Spinner,
  HStack,
} from '@chakra-ui/react';
import { useKnowledge } from '@/hooks/useKnowledge';
import { useRoleStore } from '@/stores/roleStore';
import { KnowledgeList } from '@/components/knowledge/KnowledgeList';
import type { Package } from '@/types/knowledge';

export function KnowledgeBadge() {
  const { getAllPackages } = useKnowledge();
  const activeRole = useRoleStore((state) => state.activeRole);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  const badgeBg = useColorModeValue('purple.100', 'purple.900');
  const badgeColor = useColorModeValue('purple.800', 'purple.200');

  useEffect(() => {
    const loadPackages = async () => {
      setLoading(true);
      const allPackages = await getAllPackages();
      setPackages(allPackages);
      setLoading(false);
    };

    loadPackages();
  }, [activeRole, getAllPackages]);

  return (
    <Popover placement="bottom-start">
      <PopoverTrigger>
        <Badge
          bg={badgeBg}
          color={badgeColor}
          px={3}
          py={1}
          borderRadius="md"
          cursor="pointer"
          _hover={{ opacity: 0.8 }}
          transition="opacity 0.2s"
        >
          <HStack spacing={2}>
            <span>📚</span>
            {loading ? (
              <Spinner size="xs" />
            ) : (
              <span>{packages.length} packages</span>
            )}
          </HStack>
        </Badge>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverHeader fontWeight="semibold">
          Loaded Knowledge Packages
        </PopoverHeader>
        <PopoverBody>
          <KnowledgeList packages={packages} />
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
