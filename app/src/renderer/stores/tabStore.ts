import { create } from 'zustand';
import type { TabState, KnowledgeBrowserMode } from '@/types/tab';
import type { Workspace } from '@/types/project';

interface TabsState {
  tabs: TabState[];
  activeTabId: string | null;

  addTab: (workspace: Workspace | null) => string;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabWorkspace: (tabId: string, workspace: Workspace | null) => void;
  setKnowledgeBrowserMode: (tabId: string, mode: KnowledgeBrowserMode) => void;
  getTabsForWorkspace: (workspacePath: string) => TabState[];
}

function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useTabStore = create<TabsState>()((set, get) => ({
  tabs: [],
  activeTabId: null,

  addTab: (workspace: Workspace | null) => {
    const newTabId = generateTabId();
    const newTab: TabState = {
      id: newTabId,
      workspace,
      knowledgeBrowserMode: 'current',
    };

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTabId,
    }));

    return newTabId;
  },

  removeTab: (tabId: string) => {
    set((state) => {
      const newTabs = state.tabs.filter((tab) => tab.id !== tabId);
      let newActiveTabId = state.activeTabId;

      if (state.activeTabId === tabId) {
        newActiveTabId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
      }

      return {
        tabs: newTabs,
        activeTabId: newActiveTabId,
      };
    });
  },

  setActiveTab: (tabId: string) => {
    set({ activeTabId: tabId });
  },

  updateTabWorkspace: (tabId: string, workspace: Workspace | null) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, workspace } : tab
      ),
    }));
  },

  setKnowledgeBrowserMode: (tabId: string, mode: KnowledgeBrowserMode) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, knowledgeBrowserMode: mode } : tab
      ),
    }));
  },

  getTabsForWorkspace: (workspacePath: string) => {
    return get().tabs.filter((tab) => tab.workspace?.path === workspacePath);
  },
}));
