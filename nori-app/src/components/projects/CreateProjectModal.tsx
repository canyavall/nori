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

  const handleSelectFolder = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const path = await open({
        directory: true,
        multiple: false,
        title: 'Select Workspace Folder',
      });

      if (path && typeof path === 'string') {
        setSelectedPath(path);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to open folder picker',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
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
