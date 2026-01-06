import { Box, Tabs, TabList, Tab, TabPanels, TabPanel, Text, Center } from '@chakra-ui/react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { KnowledgeBrowser } from '@/components/knowledge/KnowledgeBrowser';
import { HookSettings } from '@/components/settings/HookSettings';
import { useTabStore } from '@/stores/tabStore';

export function TabContent() {
  const { tabs, activeTabId } = useTabStore();

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  if (!activeTab) {
    return (
      <Center h="100%">
        <Text color="gray.500">No tab selected</Text>
      </Center>
    );
  }

  return (
    <Box h="100%" overflow="hidden">
      <Tabs h="100%" display="flex" flexDirection="column">
        <TabList>
          <Tab>💬 Chat</Tab>
          <Tab>📚 Knowledge</Tab>
          <Tab>⚙️ Settings</Tab>
        </TabList>

        <TabPanels flex="1" overflow="hidden">
          <TabPanel h="100%" p={0}>
            <ChatInterface />
          </TabPanel>
          <TabPanel h="100%" p={0}>
            <KnowledgeBrowser />
          </TabPanel>
          <TabPanel h="100%" p={0}>
            <HookSettings />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
