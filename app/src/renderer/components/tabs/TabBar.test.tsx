import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import userEvent from '@testing-library/user-event';
import { TabBar } from './TabBar';
import type { TabState } from '@/types/tab';
import type { Workspace } from '@/types/project';

describe('TabBar', () => {
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

  const defaultProps = {
    tabs: [] as TabState[],
    activeTabId: null,
    onSelectTab: vi.fn(),
    onCloseTab: vi.fn(),
    onNewTab: vi.fn(),
  };

  it('should render empty state with new tab button', () => {
    render(<TabBar {...defaultProps} />);
    expect(screen.getByText('New Tab')).toBeInTheDocument();
  });

  it('should render multiple tabs', () => {
    const tabs: TabState[] = [
      { id: 'tab-1', workspace: mockWorkspace1, knowledgeBrowserMode: 'current' },
      { id: 'tab-2', workspace: mockWorkspace2, knowledgeBrowserMode: 'current' },
    ];

    render(<TabBar {...defaultProps} tabs={tabs} />);

    expect(screen.getByText('workspace-1')).toBeInTheDocument();
    expect(screen.getByText('workspace-2')).toBeInTheDocument();
  });

  it('should call onSelectTab when a tab is clicked', async () => {
    const onSelectTab = vi.fn();
    const user = userEvent.setup();

    const tabs: TabState[] = [
      { id: 'tab-1', workspace: mockWorkspace1, knowledgeBrowserMode: 'current' },
    ];

    render(<TabBar {...defaultProps} tabs={tabs} onSelectTab={onSelectTab} />);

    await user.click(screen.getByText('workspace-1'));

    expect(onSelectTab).toHaveBeenCalledWith('tab-1');
  });

  it('should call onCloseTab when close button is clicked', async () => {
    const onCloseTab = vi.fn();
    const user = userEvent.setup();

    const tabs: TabState[] = [
      { id: 'tab-1', workspace: mockWorkspace1, knowledgeBrowserMode: 'current' },
    ];

    render(<TabBar {...defaultProps} tabs={tabs} onCloseTab={onCloseTab} />);

    // Find the close button (there's one for each tab)
    const closeButtons = screen.getAllByLabelText('Close tab');
    await user.click(closeButtons[0]);

    expect(onCloseTab).toHaveBeenCalledWith('tab-1');
  });

  it('should call onNewTab when new tab button is clicked', async () => {
    const onNewTab = vi.fn();
    const user = userEvent.setup();

    render(<TabBar {...defaultProps} onNewTab={onNewTab} />);

    await user.click(screen.getByText('New Tab'));

    expect(onNewTab).toHaveBeenCalledTimes(1);
  });

  it('should display "New Tab" for tabs without workspace', () => {
    const tabs: TabState[] = [
      { id: 'tab-1', workspace: null, knowledgeBrowserMode: 'current' },
    ];

    render(<TabBar {...defaultProps} tabs={tabs} />);

    // There are two "New Tab" texts: one for the tab, one for the button
    const newTabTexts = screen.getAllByText('New Tab');
    expect(newTabTexts).toHaveLength(2);
  });

  describe('auto-numbering', () => {
    it('should not number a single tab with workspace', () => {
      const tabs: TabState[] = [
        { id: 'tab-1', workspace: mockWorkspace1, knowledgeBrowserMode: 'current' },
      ];

      render(<TabBar {...defaultProps} tabs={tabs} />);

      expect(screen.getByText('workspace-1')).toBeInTheDocument();
      expect(screen.queryByText('workspace-1-2')).not.toBeInTheDocument();
    });

    it('should number duplicate workspace tabs correctly', () => {
      const tabs: TabState[] = [
        { id: 'tab-1', workspace: mockWorkspace1, knowledgeBrowserMode: 'current' },
        { id: 'tab-2', workspace: mockWorkspace1, knowledgeBrowserMode: 'current' },
        { id: 'tab-3', workspace: mockWorkspace1, knowledgeBrowserMode: 'current' },
      ];

      render(<TabBar {...defaultProps} tabs={tabs} />);

      // First tab has no number, subsequent tabs are numbered 2, 3, etc.
      expect(screen.getByText('workspace-1')).toBeInTheDocument();
      expect(screen.getByText('workspace-1-2')).toBeInTheDocument();
      expect(screen.getByText('workspace-1-3')).toBeInTheDocument();
    });

    it('should number only duplicate workspaces, not different workspaces', () => {
      const tabs: TabState[] = [
        { id: 'tab-1', workspace: mockWorkspace1, knowledgeBrowserMode: 'current' },
        { id: 'tab-2', workspace: mockWorkspace2, knowledgeBrowserMode: 'current' },
        { id: 'tab-3', workspace: mockWorkspace1, knowledgeBrowserMode: 'current' },
      ];

      render(<TabBar {...defaultProps} tabs={tabs} />);

      expect(screen.getByText('workspace-1')).toBeInTheDocument();
      expect(screen.getByText('workspace-2')).toBeInTheDocument();
      expect(screen.getByText('workspace-1-2')).toBeInTheDocument();
    });

    it('should handle mixed workspace and null tabs', () => {
      const tabs: TabState[] = [
        { id: 'tab-1', workspace: mockWorkspace1, knowledgeBrowserMode: 'current' },
        { id: 'tab-2', workspace: null, knowledgeBrowserMode: 'current' },
        { id: 'tab-3', workspace: mockWorkspace1, knowledgeBrowserMode: 'current' },
      ];

      render(<TabBar {...defaultProps} tabs={tabs} />);

      expect(screen.getByText('workspace-1')).toBeInTheDocument();
      expect(screen.getByText('workspace-1-2')).toBeInTheDocument();
      // Two "New Tab" - one for the null workspace tab, one for the button
      const newTabTexts = screen.getAllByText('New Tab');
      expect(newTabTexts).toHaveLength(2);
    });

    it('should renumber correctly when order changes', () => {
      const tabs: TabState[] = [
        { id: 'tab-3', workspace: mockWorkspace1, knowledgeBrowserMode: 'current' },
        { id: 'tab-1', workspace: mockWorkspace1, knowledgeBrowserMode: 'current' },
        { id: 'tab-2', workspace: mockWorkspace1, knowledgeBrowserMode: 'current' },
      ];

      render(<TabBar {...defaultProps} tabs={tabs} />);

      // First tab in array gets no number, rest get numbered
      expect(screen.getByText('workspace-1')).toBeInTheDocument();
      expect(screen.getByText('workspace-1-2')).toBeInTheDocument();
      expect(screen.getByText('workspace-1-3')).toBeInTheDocument();
    });
  });

  describe('active tab styling', () => {
    it('should mark correct tab as active', () => {
      const tabs: TabState[] = [
        { id: 'tab-1', workspace: mockWorkspace1, knowledgeBrowserMode: 'current' },
        { id: 'tab-2', workspace: mockWorkspace2, knowledgeBrowserMode: 'current' },
      ];

      render(<TabBar {...defaultProps} tabs={tabs} activeTabId="tab-2" />);

      // Active tab should render correctly
      expect(screen.getByText('workspace-2')).toBeInTheDocument();
    });

    it('should handle no active tab', () => {
      const tabs: TabState[] = [
        { id: 'tab-1', workspace: mockWorkspace1, knowledgeBrowserMode: 'current' },
      ];

      render(<TabBar {...defaultProps} tabs={tabs} activeTabId={null} />);

      // Should render without errors
      expect(screen.getByText('workspace-1')).toBeInTheDocument();
    });
  });

  describe('integration scenarios', () => {
    it('should handle tab selection and closing in sequence', async () => {
      const onSelectTab = vi.fn();
      const onCloseTab = vi.fn();
      const user = userEvent.setup();

      const tabs: TabState[] = [
        { id: 'tab-1', workspace: mockWorkspace1, knowledgeBrowserMode: 'current' },
        { id: 'tab-2', workspace: mockWorkspace2, knowledgeBrowserMode: 'current' },
      ];

      render(
        <TabBar
          {...defaultProps}
          tabs={tabs}
          onSelectTab={onSelectTab}
          onCloseTab={onCloseTab}
        />,
      );

      // Select first tab
      await user.click(screen.getByText('workspace-1'));
      expect(onSelectTab).toHaveBeenCalledWith('tab-1');

      // Close second tab
      const closeButtons = screen.getAllByLabelText('Close tab');
      await user.click(closeButtons[1]);
      expect(onCloseTab).toHaveBeenCalledWith('tab-2');
    });

    it('should handle creating new tab with existing tabs', async () => {
      const onNewTab = vi.fn();
      const user = userEvent.setup();

      const tabs: TabState[] = [
        { id: 'tab-1', workspace: mockWorkspace1, knowledgeBrowserMode: 'current' },
      ];

      render(<TabBar {...defaultProps} tabs={tabs} onNewTab={onNewTab} />);

      await user.click(screen.getByText('New Tab'));

      expect(onNewTab).toHaveBeenCalledTimes(1);
    });

    it('should render many tabs without errors', () => {
      const manyTabs: TabState[] = Array.from({ length: 20 }, (_, i) => ({
        id: `tab-${i}`,
        workspace: { ...mockWorkspace1, id: i, name: `workspace-${i}` },
        knowledgeBrowserMode: 'current' as const,
      }));

      render(<TabBar {...defaultProps} tabs={manyTabs} />);

      // Check a few random tabs render
      expect(screen.getByText('workspace-0')).toBeInTheDocument();
      expect(screen.getByText('workspace-10')).toBeInTheDocument();
      expect(screen.getByText('workspace-19')).toBeInTheDocument();
    });
  });
});
