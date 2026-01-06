import { useEffect } from 'react';
import { Box, VStack, HStack, Heading, useColorModeValue, IconButton, Tooltip } from '@chakra-ui/react';
import { SettingsIcon } from '@chakra-ui/icons';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { RoleBadge } from '@/components/RoleBadge';
import { Homepage } from '@/pages/Homepage';
import { TabBar } from '@/components/tabs/TabBar';
import { TabContent } from '@/components/tabs/TabContent';
import { useWorkspaceStore } from '@/stores/projectStore';
import { useTabStore } from '@/stores/tabStore';

function App() {
  const headerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const { activeWorkspace, clearActiveWorkspace } = useWorkspaceStore();
  const { tabs, activeTabId, addTab, removeTab, setActiveTab } = useTabStore();

  // Initialize first tab when workspace is loaded
  useEffect(() => {
    if (activeWorkspace && tabs.length === 0) {
      addTab(activeWorkspace);
    }
  }, [activeWorkspace, tabs.length, addTab]);

  const handleNewTab = () => {
    if (activeWorkspace) {
      addTab(activeWorkspace);
    }
  };

  return (
    <VStack h="100vh" spacing={0} align="stretch">
      {/* Header - Always visible */}
      <Box
        bg={headerBg}
        borderBottom="1px"
        borderColor={borderColor}
        px={6}
        py={3}
      >
        <HStack justify="space-between" align="center">
          <HStack spacing={4}>
            <Heading size="md" bgGradient="linear(to-r, purple.400, pink.400)" bgClip="text">
              Nori
            </Heading>
            <RoleBadge />
          </HStack>
          <HStack spacing={2}>
            {activeWorkspace && (
              <Tooltip label="Settings & OAuth" placement="bottom">
                <IconButton
                  aria-label="Settings"
                  icon={<SettingsIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={clearActiveWorkspace}
                />
              </Tooltip>
            )}
            <RoleSwitcher />
          </HStack>
        </HStack>
      </Box>

      {activeWorkspace ? (
        <>
          {/* Tab Bar */}
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTab}
            onCloseTab={removeTab}
            onNewTab={handleNewTab}
          />

          {/* Main Content */}
          <Box flex="1" overflow="hidden">
            <TabContent />
          </Box>
        </>
      ) : (
        /* Homepage Content */
        <Box flex="1" overflow="auto">
          <Homepage />
        </Box>
      )}
    </VStack>
  );
}

export default App;
