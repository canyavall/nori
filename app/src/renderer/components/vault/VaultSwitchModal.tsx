import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Alert,
  AlertIcon,
  VStack,
  Text,
} from '@chakra-ui/react';
import { useTabStore } from '@/stores/tabStore';

interface VaultSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVault: string;
  newVault: string;
  workspacePath: string;
  onConfirm: () => void;
}

export function VaultSwitchModal({
  isOpen,
  onClose,
  currentVault,
  newVault,
  workspacePath,
  onConfirm,
}: VaultSwitchModalProps) {
  const { getTabsForWorkspace } = useTabStore();
  const affectedTabs = getTabsForWorkspace(workspacePath);
  const otherTabsCount = affectedTabs.length - 1;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Switch Vault to "{newVault}"?</ModalHeader>
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Alert status="warning">
              <AlertIcon />
              <VStack align="stretch" spacing={1}>
                <Text fontWeight="semibold">This will change the knowledge context for this chat</Text>
                <Text fontSize="sm">Current vault: {currentVault} → New vault: {newVault}</Text>
              </VStack>
            </Alert>

            <Alert status="info">
              <AlertIcon />
              <Text fontSize="sm">
                This will update nori.json for workspace at {workspacePath}
              </Text>
            </Alert>

            {otherTabsCount > 0 && (
              <Alert status="warning">
                <AlertIcon />
                <Text fontSize="sm">
                  This will affect {otherTabsCount} other open {otherTabsCount === 1 ? 'tab' : 'tabs'}
                </Text>
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleConfirm}>
            Switch Vault
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
