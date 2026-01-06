import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import userEvent from '@testing-library/user-event';
import { VaultSwitchModal } from './VaultSwitchModal';
import { useTabStore } from '@/stores/tabStore';
import type { Workspace } from '@/types/project';

describe('VaultSwitchModal', () => {
  const mockWorkspace: Workspace = {
    id: 1,
    name: 'workspace-1',
    path: '/path/to/workspace1',
    vault: 'vault1',
    vault_path: '/path/to/vault1',
    created_at: 1234567890,
    last_opened_at: 1234567890,
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentVault: 'vault1',
    newVault: 'vault2',
    workspacePath: '/path/to/workspace1',
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    // Reset tab store
    useTabStore.setState({
      tabs: [],
      activeTabId: null,
    });
    vi.clearAllMocks();
  });

  it('should render modal when isOpen is true', () => {
    render(<VaultSwitchModal {...defaultProps} />);

    expect(screen.getByText('Switch Vault to "vault2"?')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    render(<VaultSwitchModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Switch Vault to "vault2"?')).not.toBeInTheDocument();
  });

  it('should display current and new vault names', () => {
    render(<VaultSwitchModal {...defaultProps} />);

    expect(
      screen.getByText(/Current vault: vault1 → New vault: vault2/),
    ).toBeInTheDocument();
  });

  it('should display workspace path', () => {
    render(<VaultSwitchModal {...defaultProps} />);

    expect(
      screen.getByText(/This will update nori\.json for workspace at \/path\/to\/workspace1/),
    ).toBeInTheDocument();
  });

  it('should call onClose when Cancel button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<VaultSwitchModal {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByText('Cancel'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onConfirm and onClose when Switch Vault button is clicked', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <VaultSwitchModal {...defaultProps} onConfirm={onConfirm} onClose={onClose} />,
    );

    await user.click(screen.getByText('Switch Vault'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('affected tabs count', () => {
    it('should not show affected tabs warning when only one tab is open', () => {
      // Add one tab with the workspace
      useTabStore.setState({
        tabs: [
          {
            id: 'tab-1',
            workspace: mockWorkspace,
            knowledgeBrowserMode: 'current',
          },
        ],
        activeTabId: 'tab-1',
      });

      render(<VaultSwitchModal {...defaultProps} />);

      // Should not show the "other tabs" warning (0 other tabs)
      expect(screen.queryByText(/This will affect/)).not.toBeInTheDocument();
    });

    it('should show singular "tab" when one other tab is affected', () => {
      // Add two tabs with the same workspace
      useTabStore.setState({
        tabs: [
          {
            id: 'tab-1',
            workspace: mockWorkspace,
            knowledgeBrowserMode: 'current',
          },
          {
            id: 'tab-2',
            workspace: mockWorkspace,
            knowledgeBrowserMode: 'current',
          },
        ],
        activeTabId: 'tab-1',
      });

      render(<VaultSwitchModal {...defaultProps} workspacePath={mockWorkspace.path} />);

      // Should show warning for 1 other affected tab
      const affectedTabsText = screen.queryByText(/affect.*other/i);
      expect(affectedTabsText).toBeInTheDocument();
      expect(affectedTabsText?.textContent).toContain('1 other');
    });

    it('should show plural "tabs" when multiple other tabs are affected', () => {
      // Add three tabs with the same workspace
      useTabStore.setState({
        tabs: [
          {
            id: 'tab-1',
            workspace: mockWorkspace,
            knowledgeBrowserMode: 'current',
          },
          {
            id: 'tab-2',
            workspace: mockWorkspace,
            knowledgeBrowserMode: 'current',
          },
          {
            id: 'tab-3',
            workspace: mockWorkspace,
            knowledgeBrowserMode: 'current',
          },
        ],
        activeTabId: 'tab-1',
      });

      render(<VaultSwitchModal {...defaultProps} workspacePath={mockWorkspace.path} />);

      // Should show warning for 2 other affected tabs
      const affectedTabsText = screen.queryByText(/affect.*other/i);
      expect(affectedTabsText).toBeInTheDocument();
      expect(affectedTabsText?.textContent).toContain('2 other');
    });

    it('should not count tabs with different workspaces', () => {
      const differentWorkspace: Workspace = {
        ...mockWorkspace,
        id: 2,
        path: '/different/path',
      };

      useTabStore.setState({
        tabs: [
          {
            id: 'tab-1',
            workspace: mockWorkspace,
            knowledgeBrowserMode: 'current',
          },
          {
            id: 'tab-2',
            workspace: differentWorkspace,
            knowledgeBrowserMode: 'current',
          },
        ],
        activeTabId: 'tab-1',
      });

      render(<VaultSwitchModal {...defaultProps} />);

      // Should not show warning (only 1 tab with this workspace, 0 others)
      expect(screen.queryByText(/This will affect/)).not.toBeInTheDocument();
    });
  });

  describe('warnings and alerts', () => {
    it('should show warning about knowledge context change', () => {
      render(<VaultSwitchModal {...defaultProps} />);

      expect(
        screen.getByText('This will change the knowledge context for this chat'),
      ).toBeInTheDocument();
    });

    it('should show info about nori.json update', () => {
      render(<VaultSwitchModal {...defaultProps} />);

      expect(
        screen.getByText(/This will update nori\.json for workspace/),
      ).toBeInTheDocument();
    });

    it('should use warning status for context change alert', () => {
      render(<VaultSwitchModal {...defaultProps} />);

      const alerts = screen.getAllByRole('alert');
      // First alert should be the warning about context change
      expect(alerts[0]).toHaveAttribute('data-status', 'warning');
    });
  });

  describe('modal behavior', () => {
    it('should render modal overlay', () => {
      render(<VaultSwitchModal {...defaultProps} />);

      // Modal should have the essential elements
      expect(screen.getByText('Switch Vault to "vault2"?')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Switch Vault')).toBeInTheDocument();
    });

    it('should have proper button layout', () => {
      render(<VaultSwitchModal {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      const confirmButton = screen.getByText('Switch Vault');

      expect(cancelButton).toBeInTheDocument();
      expect(confirmButton).toBeInTheDocument();
    });
  });
});
