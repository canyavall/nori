import { Box, HStack, VStack, IconButton, Button, Divider, useBoolean, Select, Text, useDisclosure, useToast } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, EditIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { invokeCommand } from '../../lib/api';
import { useKnowledge } from '../../hooks/useKnowledge';
import { useTabStore } from '../../stores/tabStore';
import { useVaultStore } from '../../stores/vaultStore';
import { useWorkspaceStore } from '../../stores/projectStore';
import { SearchInput } from './SearchInput';
import { PackageTree } from './PackageTree';
import { PackagePreview } from './PackagePreview';
import { KnowledgeEditor } from './KnowledgeEditor';
import { VaultSwitchModal } from '../vault/VaultSwitchModal';
import type { Package } from '../../types/knowledge';
import type { Workspace } from '../../types/project';

export function KnowledgeBrowser() {
  const { tabs, activeTabId, updateTabWorkspace } = useTabStore();
  const activeTab = tabs.find(tab => tab.id === activeTabId);
  const vaultPath = activeTab?.workspace?.vault_path ?? undefined;
  const currentVault = activeTab?.workspace?.vault ?? '';
  const workspacePath = activeTab?.workspace?.path ?? '';

  const { vaults } = useVaultStore();
  const { loadWorkspaces } = useWorkspaceStore();
  const { packages, categories, search, getPackage, loading } = useKnowledge(vaultPath);
  const [searchText, setSearchText] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useBoolean(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNewVault, setSelectedNewVault] = useState<string>('');
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const toast = useToast();

  // Search on mount to load all packages
  useEffect(() => {
    search({});
  }, [search]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search({
        text: searchText || undefined,
        max_results: 100,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText, search]);

  // Load package details when selected
  const handleSelectPackage = async (name: string) => {
    setSelectedName(name);
    const pkg = await getPackage(name);
    setSelectedPackage(pkg);
    setIsEditing(false); // Exit edit mode when selecting a different package
  };

  // Handle save from editor
  const handleSaved = () => {
    setIsEditing(false);
    // Reload the package
    if (selectedName) {
      handleSelectPackage(selectedName);
    }
  };

  // Handle vault selection change
  const handleVaultChange = (newVaultName: string) => {
    if (newVaultName === currentVault || !newVaultName) {
      return;
    }

    setSelectedNewVault(newVaultName);
    onModalOpen();
  };

  // Handle vault switch confirmation
  const handleVaultSwitchConfirm = async () => {
    if (!workspacePath || !selectedNewVault) {
      return;
    }

    try {
      const selectedVault = vaults.find(v => v.name === selectedNewVault);
      if (!selectedVault) {
        throw new Error('Selected vault not found');
      }

      // Note: Workspace vault switching not implemented in backend MVP
      // Get all workspaces and find by path
      const workspaces = await invokeCommand<Workspace[]>('/workspaces');
      const workspace = workspaces.find(w => w.path === workspacePath);

      if (!workspace) {
        throw new Error('Workspace not found');
      }

      // TODO: Backend doesn't support updating workspace vault yet
      // This feature requires backend implementation
      console.warn('Vault switching not supported in MVP');

      // Reload workspaces
      await loadWorkspaces();

      // Update tabs (local state only, no backend persistence)
      const affectedTabs = tabs.filter(tab => tab.workspace?.path === workspacePath);
      for (const tab of affectedTabs) {
        const updatedWorkspace = workspaces.find(w => w.path === workspacePath);
        updateTabWorkspace(tab.id, updatedWorkspace || null);
      }

      // Note: Knowledge indexing stubbed in MVP (see MIGRATION.md)

      // Reload packages
      await search({});

      toast({
        title: 'Vault switched',
        description: `Switched to ${selectedNewVault}`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Failed to switch vault',
        description: error instanceof Error ? error.message : String(error),
        status: 'error',
        duration: 5000,
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + B to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsOpen.toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);

  return (
    <HStack h="100%" align="stretch" spacing={0}>
      {/* Sidebar */}
      {isOpen && (
        <Box w="300px" borderRight="1px" borderColor="gray.200" h="100%">
          <VStack align="stretch" spacing={2} p={4} h="100%">
            {/* Vault Selector */}
            {activeTab?.workspace && (
              <VStack align="stretch" spacing={1}>
                <Text fontSize="xs" fontWeight="semibold" color="gray.600">
                  Current Vault
                </Text>
                <Select
                  size="sm"
                  value={currentVault}
                  onChange={(e) => handleVaultChange(e.target.value)}
                  placeholder="No vault selected"
                >
                  {vaults.map((vault) => (
                    <option key={vault.name} value={vault.name}>
                      {vault.name}
                    </option>
                  ))}
                </Select>
              </VStack>
            )}

            <SearchInput value={searchText} onChange={setSearchText} />
            <Divider />
            <Box flex="1" overflowY="auto">
              {loading ? (
                <Box p={4} textAlign="center" color="gray.500">
                  Loading...
                </Box>
              ) : (
                <PackageTree
                  results={packages}
                  onSelect={handleSelectPackage}
                  selectedPackage={selectedName}
                />
              )}
            </Box>
          </VStack>
        </Box>
      )}

      {/* Toggle button */}
      <Box>
        <IconButton
          aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
          icon={isOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          onClick={setIsOpen.toggle}
          size="sm"
          variant="ghost"
        />
      </Box>

      {/* Preview/Editor panel */}
      <Box flex="1" h="100%" display="flex" flexDirection="column">
        {/* Edit button */}
        {selectedPackage && !isEditing && (
          <Box p={2} borderBottom="1px" borderColor="gray.200">
            <Button
              leftIcon={<EditIcon />}
              size="sm"
              onClick={() => setIsEditing(true)}
              colorScheme="blue"
              variant="outline"
            >
              Edit Package
            </Button>
          </Box>
        )}

        {/* Content */}
        <Box flex="1" overflowY="auto">
          {isEditing ? (
            <KnowledgeEditor
              package={selectedPackage}
              categories={categories}
              vaultPath={vaultPath}
              onSaved={handleSaved}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <PackagePreview package={selectedPackage} />
          )}
        </Box>
      </Box>

      {/* Vault Switch Modal */}
      <VaultSwitchModal
        isOpen={isModalOpen}
        onClose={onModalClose}
        currentVault={currentVault}
        newVault={selectedNewVault}
        workspacePath={workspacePath}
        onConfirm={handleVaultSwitchConfirm}
      />
    </HStack>
  );
}
