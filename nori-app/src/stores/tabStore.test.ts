import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useTabStore } from './tabStore';
import type { Workspace } from '@/types/project';

describe('tabStore', () => {
  const mockWorkspace1: Workspace = {
    id: 1,
    name: 'workspace-1',
    path: '/path/to/workspace1',
    vault: 'vault1',
    vault_path: '/path/to/vault1',
    created_at: 1234567890,
    last_opened_at: 1234567890,
  };

  const mockWorkspace2: Workspace = {
    id: 2,
    name: 'workspace-2',
    path: '/path/to/workspace2',
    vault: 'vault2',
    vault_path: '/path/to/vault2',
    created_at: 1234567891,
    last_opened_at: 1234567891,
  };

  beforeEach(() => {
    // Reset store state before each test
    useTabStore.setState({
      tabs: [],
      activeTabId: null,
    });
  });

  describe('addTab', () => {
    it('should add a new tab with workspace', () => {
      let tabId: string = '';

      act(() => {
        tabId = useTabStore.getState().addTab(mockWorkspace1);
      });

      const state = useTabStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.tabs[0]).toMatchObject({
        id: tabId,
        workspace: mockWorkspace1,
        knowledgeBrowserMode: 'current',
      });
      expect(state.activeTabId).toBe(tabId);
    });

    it('should add a new tab without workspace', () => {
      let tabId: string = '';

      act(() => {
        tabId = useTabStore.getState().addTab(null);
      });

      const state = useTabStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.tabs[0]).toMatchObject({
        id: tabId,
        workspace: null,
        knowledgeBrowserMode: 'current',
      });
      expect(state.activeTabId).toBe(tabId);
    });

    it('should add multiple tabs and set the latest as active', () => {
      let tabId2: string = '';

      act(() => {
        useTabStore.getState().addTab(mockWorkspace1);
        tabId2 = useTabStore.getState().addTab(mockWorkspace2);
      });

      const state = useTabStore.getState();
      expect(state.tabs).toHaveLength(2);
      expect(state.activeTabId).toBe(tabId2);
    });

    it('should generate unique tab IDs', () => {
      const ids = new Set<string>();

      act(() => {
        for (let i = 0; i < 10; i++) {
          const id = useTabStore.getState().addTab(null);
          ids.add(id);
        }
      });

      // All IDs should be unique
      expect(ids.size).toBe(10);
    });
  });

  describe('removeTab', () => {
    it('should remove a tab by ID', () => {
      let tabId: string = '';

      act(() => {
        tabId = useTabStore.getState().addTab(mockWorkspace1);
        useTabStore.getState().removeTab(tabId);
      });

      const state = useTabStore.getState();
      expect(state.tabs).toHaveLength(0);
      expect(state.activeTabId).toBeNull();
    });

    it('should set active tab to last remaining tab when removing active tab', () => {
      let tabId2: string = '';
      let tabId3: string = '';

      act(() => {
        useTabStore.getState().addTab(mockWorkspace1);
        tabId2 = useTabStore.getState().addTab(mockWorkspace2);
        tabId3 = useTabStore.getState().addTab(mockWorkspace1);
      });

      expect(useTabStore.getState().activeTabId).toBe(tabId3);

      act(() => {
        useTabStore.getState().removeTab(tabId3);
      });

      const state = useTabStore.getState();
      expect(state.tabs).toHaveLength(2);
      expect(state.activeTabId).toBe(tabId2);
    });

    it('should maintain active tab when removing non-active tab', () => {
      let tabId1: string = '';
      let tabId3: string = '';

      act(() => {
        tabId1 = useTabStore.getState().addTab(mockWorkspace1);
        useTabStore.getState().addTab(mockWorkspace2);
        tabId3 = useTabStore.getState().addTab(mockWorkspace1);
      });

      act(() => {
        useTabStore.getState().removeTab(tabId1);
      });

      const state = useTabStore.getState();
      expect(state.tabs).toHaveLength(2);
      expect(state.activeTabId).toBe(tabId3);
    });

    it('should handle removing non-existent tab gracefully', () => {
      let tabId: string = '';

      act(() => {
        tabId = useTabStore.getState().addTab(mockWorkspace1);
        useTabStore.getState().removeTab('non-existent-id');
      });

      const state = useTabStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.activeTabId).toBe(tabId);
    });

    it('should set activeTabId to null when removing the last tab', () => {
      act(() => {
        const tabId = useTabStore.getState().addTab(mockWorkspace1);
        useTabStore.getState().removeTab(tabId);
      });

      const state = useTabStore.getState();
      expect(state.tabs).toHaveLength(0);
      expect(state.activeTabId).toBeNull();
    });
  });

  describe('setActiveTab', () => {
    it('should set the active tab', () => {
      let tabId1: string = '';

      act(() => {
        tabId1 = useTabStore.getState().addTab(mockWorkspace1);
        useTabStore.getState().addTab(mockWorkspace2);
        useTabStore.getState().setActiveTab(tabId1);
      });

      expect(useTabStore.getState().activeTabId).toBe(tabId1);
    });

    it('should allow switching between tabs', () => {
      let tabId1: string = '';
      let tabId2: string = '';

      act(() => {
        tabId1 = useTabStore.getState().addTab(mockWorkspace1);
        tabId2 = useTabStore.getState().addTab(mockWorkspace2);
        useTabStore.getState().setActiveTab(tabId1);
      });

      expect(useTabStore.getState().activeTabId).toBe(tabId1);

      act(() => {
        useTabStore.getState().setActiveTab(tabId2);
      });

      expect(useTabStore.getState().activeTabId).toBe(tabId2);
    });
  });

  describe('updateTabWorkspace', () => {
    it('should update workspace for a specific tab', () => {
      let tabId: string = '';

      act(() => {
        tabId = useTabStore.getState().addTab(mockWorkspace1);
        useTabStore.getState().updateTabWorkspace(tabId, mockWorkspace2);
      });

      const state = useTabStore.getState();
      expect(state.tabs[0].workspace).toEqual(mockWorkspace2);
    });

    it('should only update the specified tab', () => {
      let tabId1: string = '';

      act(() => {
        tabId1 = useTabStore.getState().addTab(mockWorkspace1);
        useTabStore.getState().addTab(mockWorkspace2);
        useTabStore.getState().updateTabWorkspace(tabId1, null);
      });

      const state = useTabStore.getState();
      expect(state.tabs[0].workspace).toBeNull();
      expect(state.tabs[1].workspace).toEqual(mockWorkspace2);
    });

    it('should handle updating non-existent tab gracefully', () => {
      act(() => {
        useTabStore.getState().addTab(mockWorkspace1);
        useTabStore.getState().updateTabWorkspace('non-existent', mockWorkspace2);
      });

      const state = useTabStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.tabs[0].workspace).toEqual(mockWorkspace1);
    });
  });

  describe('setKnowledgeBrowserMode', () => {
    it('should set knowledge browser mode for a specific tab', () => {
      let tabId: string = '';

      act(() => {
        tabId = useTabStore.getState().addTab(mockWorkspace1);
        useTabStore.getState().setKnowledgeBrowserMode(tabId, 'all');
      });

      const state = useTabStore.getState();
      expect(state.tabs[0].knowledgeBrowserMode).toBe('all');
    });

    it('should only update the specified tab mode', () => {
      let tabId1: string = '';

      act(() => {
        tabId1 = useTabStore.getState().addTab(mockWorkspace1);
        useTabStore.getState().addTab(mockWorkspace2);
        useTabStore.getState().setKnowledgeBrowserMode(tabId1, 'all');
      });

      const state = useTabStore.getState();
      expect(state.tabs[0].knowledgeBrowserMode).toBe('all');
      expect(state.tabs[1].knowledgeBrowserMode).toBe('current');
    });

    it('should handle setting mode for non-existent tab gracefully', () => {
      act(() => {
        useTabStore.getState().addTab(mockWorkspace1);
        useTabStore.getState().setKnowledgeBrowserMode('non-existent', 'all');
      });

      const state = useTabStore.getState();
      expect(state.tabs[0].knowledgeBrowserMode).toBe('current');
    });
  });

  describe('getTabsForWorkspace', () => {
    it('should return tabs for a specific workspace', () => {
      act(() => {
        useTabStore.getState().addTab(mockWorkspace1);
        useTabStore.getState().addTab(mockWorkspace2);
        useTabStore.getState().addTab(mockWorkspace1);
      });

      const tabs = useTabStore.getState().getTabsForWorkspace(mockWorkspace1.path);
      expect(tabs).toHaveLength(2);
      expect(tabs.every((tab) => tab.workspace?.path === mockWorkspace1.path)).toBe(
        true,
      );
    });

    it('should return empty array if no tabs match workspace', () => {
      act(() => {
        useTabStore.getState().addTab(mockWorkspace1);
      });

      const tabs = useTabStore.getState().getTabsForWorkspace('/non/existent/path');
      expect(tabs).toHaveLength(0);
    });

    it('should not include tabs without workspace', () => {
      act(() => {
        useTabStore.getState().addTab(null);
        useTabStore.getState().addTab(mockWorkspace1);
      });

      const tabs = useTabStore.getState().getTabsForWorkspace(mockWorkspace1.path);
      expect(tabs).toHaveLength(1);
    });

    it('should handle empty tabs array', () => {
      const tabs = useTabStore.getState().getTabsForWorkspace('/any/path');
      expect(tabs).toHaveLength(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex tab lifecycle', () => {
      let tab1 = '';
      let tab2 = '';
      let tab3 = '';

      // Add multiple tabs
      act(() => {
        tab1 = useTabStore.getState().addTab(mockWorkspace1);
        tab2 = useTabStore.getState().addTab(mockWorkspace2);
        tab3 = useTabStore.getState().addTab(mockWorkspace1);
      });

      expect(useTabStore.getState().tabs).toHaveLength(3);
      expect(useTabStore.getState().activeTabId).toBe(tab3);

      // Switch to first tab
      act(() => {
        useTabStore.getState().setActiveTab(tab1);
      });

      expect(useTabStore.getState().activeTabId).toBe(tab1);

      // Update workspace in middle tab
      act(() => {
        useTabStore.getState().updateTabWorkspace(tab2, mockWorkspace1);
      });

      // Now 3 tabs all have workspace1
      const workspace1Tabs = useTabStore
        .getState()
        .getTabsForWorkspace(mockWorkspace1.path);
      expect(workspace1Tabs).toHaveLength(3);

      // Remove middle tab
      act(() => {
        useTabStore.getState().removeTab(tab2);
      });

      expect(useTabStore.getState().tabs).toHaveLength(2);
      expect(useTabStore.getState().activeTabId).toBe(tab1); // Should remain tab1

      // Remove active tab
      act(() => {
        useTabStore.getState().removeTab(tab1);
      });

      expect(useTabStore.getState().tabs).toHaveLength(1);
      expect(useTabStore.getState().activeTabId).toBe(tab3); // Should switch to remaining tab
    });
  });
});
