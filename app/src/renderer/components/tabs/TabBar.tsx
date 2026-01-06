import { HStack, Button, useColorModeValue } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { Tab } from './Tab';
import type { TabState } from '@/types/tab';

interface TabBarProps {
  tabs: TabState[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
}

export function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab, onNewTab }: TabBarProps) {
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const bg = useColorModeValue('gray.50', 'gray.900');

  const getTabTitle = (tab: TabState): string => {
    if (!tab.workspace) {
      return 'New Tab';
    }

    // Auto-numbering: if multiple tabs with same workspace, add number suffix
    const sameWorkspaceTabs = tabs.filter(t => t.workspace?.name === tab.workspace?.name);
    if (sameWorkspaceTabs.length > 1) {
      const index = sameWorkspaceTabs.findIndex(t => t.id === tab.id);
      return index === 0 ? tab.workspace.name : `${tab.workspace.name}-${index + 1}`;
    }

    return tab.workspace.name;
  };

  return (
    <HStack
      spacing={0}
      bg={bg}
      borderBottomWidth="1px"
      borderColor={borderColor}
      px={2}
      py={1}
      overflowX="auto"
      css={{
        '&::-webkit-scrollbar': {
          height: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: borderColor,
          borderRadius: '3px',
        },
      }}
    >
      {tabs.map((tab) => (
        <Tab
          key={tab.id}
          id={tab.id}
          title={getTabTitle(tab)}
          isActive={tab.id === activeTabId}
          onSelect={() => onSelectTab(tab.id)}
          onClose={() => onCloseTab(tab.id)}
        />
      ))}
      <Button
        size="sm"
        variant="ghost"
        leftIcon={<AddIcon />}
        onClick={onNewTab}
        ml={2}
      >
        New Tab
      </Button>
    </HStack>
  );
}
