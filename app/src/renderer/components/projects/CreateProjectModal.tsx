import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Input,
  useToast,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { useWorkspaceStore } from '@/stores/projectStore';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [selectedPath, setSelectedPath] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);
  const toast = useToast();

  const handleSelectFolder = () => {
    // Create hidden file input for directory selection
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.style.display = 'none';

    input.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        // Get directory path from first file (webkitdirectory gives us files in directory)
        const firstFile = target.files[0];
        // Extract parent directory path from file path
        const fullPath = (firstFile as any).path || firstFile.webkitRelativePath;
        if (fullPath) {
          // Get directory path (remove filename)
          const dirPath = fullPath.split('/').slice(0, -1).join('/') || fullPath.replace(/\/[^/]*$/, '');
          setSelectedPath(dirPath);
        }
      }
      document.body.removeChild(input);
    });

    document.body.appendChild(input);
    input.click();
  };

  const handleCreate = async () => {
    if (!selectedPath) {
      toast({
        title: 'No folder selected',
        description: 'Please select a folder first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsCreating(true);

    try {
      await createWorkspace(selectedPath);
      toast({
        title: 'Workspace linked',
        description: 'Your workspace has been linked successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setSelectedPath('');
      onClose();
    } catch (err) {
      console.error('Workspace creation error:', err);
      toast({
        title: 'Failed to link workspace',
        description: err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setSelectedPath('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Link Workspace</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text color="gray.600">
              Select a folder to link as your workspace.
            </Text>

            <FormControl>
              <FormLabel>Workspace Folder</FormLabel>
              <Input
                value={selectedPath}
                placeholder="No folder selected"
                isReadOnly
                fontFamily="mono"
                fontSize="sm"
              />
            </FormControl>

            <Button onClick={handleSelectFolder} colorScheme="purple" variant="outline">
              Browse Folders
            </Button>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose} isDisabled={isCreating}>
            Cancel
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleCreate}
            isLoading={isCreating}
            isDisabled={!selectedPath}
          >
            Link Workspace
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
