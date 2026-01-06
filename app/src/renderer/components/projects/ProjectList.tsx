import { Box, Card, CardBody, Text, VStack, HStack, useColorModeValue } from '@chakra-ui/react';
import type { Workspace } from '@/types/project';

interface ProjectListProps {
  projects: Workspace[];
  onSelectProject: (projectId: number) => void;
}

export function ProjectList({ projects, onSelectProject }: ProjectListProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardHoverBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString();
    } else if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const truncatePath = (path: string, maxLength: number = 50) => {
    if (path.length <= maxLength) return path;
    const start = path.substring(0, 20);
    const end = path.substring(path.length - 27);
    return `${start}...${end}`;
  };

  if (projects.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="gray.500" fontSize="lg">
          No workspaces yet. Link your first workspace to get started.
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={3} align="stretch">
      {projects.map((project) => (
        <Card
          key={project.id}
          bg={cardBg}
          borderColor={borderColor}
          borderWidth="1px"
          cursor="pointer"
          _hover={{ bg: cardHoverBg, transform: 'translateY(-2px)' }}
          transition="all 0.2s"
          onClick={() => onSelectProject(project.id)}
        >
          <CardBody>
            <HStack justify="space-between" align="start">
              <VStack align="start" spacing={1} flex="1">
                <Text fontWeight="bold" fontSize="md">
                  {project.name}
                </Text>
                <Text fontSize="sm" color="gray.500" fontFamily="mono">
                  {truncatePath(project.path)}
                </Text>
              </VStack>
              <Text fontSize="xs" color="gray.400" whiteSpace="nowrap">
                {formatDate(project.last_opened_at)}
              </Text>
            </HStack>
          </CardBody>
        </Card>
      ))}
    </VStack>
  );
}
