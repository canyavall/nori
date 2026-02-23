import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';
import type { Project, Vault } from '@nori/shared';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock @solidjs/router so <A> renders a plain <a> without needing a Router context
const navigateMock = vi.fn();

vi.mock('@solidjs/router', () => ({
  A: (props: { href: string; class?: string; activeClass?: string; children: import('solid-js').JSX.Element }) => (
    <a href={props.href} class={props.class}>
      {props.children}
    </a>
  ),
  useNavigate: vi.fn(() => navigateMock),
}));

const { getSidebarContext, setSidebarContextMock, getContextName, setContextNameMock, getActiveProject, setActiveProjectMock } =
  vi.hoisted(() => {
    let _context: 'project' | 'vault' | null = null;
    let _name: string | null = null;
    let _project: Project | null = null;
    return {
      getSidebarContext: () => _context,
      setSidebarContextMock: (v: 'project' | 'vault' | null) => { _context = v; },
      getContextName: () => _name,
      setContextNameMock: (v: string | null) => { _name = v; },
      getActiveProject: () => _project,
      setActiveProjectMock: (v: Project | null) => { _project = v; },
    };
  });

vi.mock('../../../stores/navigation.store', () => ({
  sidebarContext: getSidebarContext,
  activeContextName: getContextName,
  activeProject: getActiveProject,
  activeVault: getActiveVault,
  clearVaultContext: vi.fn(),
  clearContext: vi.fn(),
}));

const { getVaults, setVaultsMock } = vi.hoisted(() => {
  let _vaults: Vault[] = [];
  return {
    getVaults: () => _vaults,
    setVaultsMock: (v: Vault[]) => { _vaults = v; },
  };
});

vi.mock('../../../stores/vault.store', () => ({
  vaults: getVaults,
}));

// Mock activeVault for vault context tests
const { getActiveVault, setActiveVaultMock } = vi.hoisted(() => {
  let _vault: Vault | null = null;
  return {
    getActiveVault: () => _vault,
    setActiveVaultMock: (v: Vault | null) => { _vault = v; },
  };
});

// Mock API calls
vi.mock('../../../lib/api', () => ({
  apiGet: vi.fn().mockResolvedValue({ data: [] }),
  apiPost: vi.fn(),
  apiDelete: vi.fn(),
}));

// Mock Tauri dialog plugin
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
}));

// Mock SSE
vi.mock('../../../lib/sse', () => ({
  connectSSE: vi.fn(() => ({ abort: vi.fn() })),
}));

// Mock vault-link-project ProjectPicker
vi.mock('../../../features/vault/vault-link-project/ProjectPicker/ProjectPicker', () => ({
  ProjectPicker: () => <div data-testid="project-picker" />,
}));

// Mock import/export dialogs
vi.mock('../../../features/vault/vault-knowledge-import/VaultKnowledgeImportDialog', () => ({
  VaultKnowledgeImportDialog: () => <div data-testid="import-dialog" />,
}));

vi.mock('../../../features/vault/vault-knowledge-export/VaultKnowledgeExportDialog', () => ({
  VaultKnowledgeExportDialog: () => <div data-testid="export-dialog" />,
}));

import { ContextualSidebar } from './ContextualSidebar';
import * as navigationStore from '../../../stores/navigation.store';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ContextualSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    setSidebarContextMock(null);
    setContextNameMock(null);
    setActiveProjectMock(null);
    setActiveVaultMock(null);
    setVaultsMock([]);
    cleanup();
  });

  // ── Helpers ─────────────────────────────────────────────────────────────

  function makeProject(overrides: Partial<Project> = {}): Project {
    return {
      id: 'proj-1',
      name: 'my-project',
      path: '/home/user/my-project',
      is_git: false,
      connected_vaults: [],
      created_at: '2026-01-01T00:00:00Z',
      ...overrides,
    };
  }

  function makeVault(overrides: Partial<Vault> = {}): Vault {
    return {
      id: 'vault-1',
      name: 'my-vault',
      git_url: 'git@github.com:user/vault.git',
      local_path: '/home/user/.nori/vaults/my-vault',
      branch: 'main',
      vault_type: 'git',
      last_synced_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      ...overrides,
    };
  }

  // ── Project context ──────────────────────────────────────────────────────

  it('does NOT show a Vaults nav link in project context', () => {
    setSidebarContextMock('project');
    setActiveProjectMock(makeProject());
    render(() => <ContextualSidebar />);
    expect(screen.queryByRole('link', { name: 'Vaults' })).toBeNull();
  });

  it('shows Linked Vaults label in project context', () => {
    setSidebarContextMock('project');
    setActiveProjectMock(makeProject());
    render(() => <ContextualSidebar />);
    expect(screen.getByText('Linked Vaults')).toBeDefined();
  });

  it('shows None linked when project has no connected vaults', () => {
    setSidebarContextMock('project');
    setActiveProjectMock(makeProject({ connected_vaults: [] }));
    setVaultsMock([makeVault()]);
    render(() => <ContextualSidebar />);
    expect(screen.getByText('None linked')).toBeDefined();
  });

  it('shows only vault names linked to the active project', () => {
    const linked = makeVault({ id: 'v1', name: 'docs-vault' });
    const unlinked = makeVault({ id: 'v2', name: 'other-vault' });
    setSidebarContextMock('project');
    setActiveProjectMock(makeProject({ connected_vaults: ['v1'] }));
    setVaultsMock([linked, unlinked]);
    render(() => <ContextualSidebar />);
    expect(screen.getByText('\u00b7 docs-vault')).toBeDefined();
    expect(screen.queryByText('\u00b7 other-vault')).toBeNull();
  });

  it('shows all linked vault names when multiple vaults are connected', () => {
    const v1 = makeVault({ id: 'v1', name: 'vault-alpha' });
    const v2 = makeVault({ id: 'v2', name: 'vault-beta' });
    setSidebarContextMock('project');
    setActiveProjectMock(makeProject({ connected_vaults: ['v1', 'v2'] }));
    setVaultsMock([v1, v2]);
    render(() => <ContextualSidebar />);
    expect(screen.getByText('\u00b7 vault-alpha')).toBeDefined();
    expect(screen.getByText('\u00b7 vault-beta')).toBeDefined();
  });

  it('shows Sessions nav link in project context', () => {
    setSidebarContextMock('project');
    setActiveProjectMock(makeProject());
    render(() => <ContextualSidebar />);
    expect(screen.getByRole('link', { name: 'Sessions' })).toBeDefined();
  });

  it('Sessions link points to /sessions', () => {
    setSidebarContextMock('project');
    setActiveProjectMock(makeProject());
    render(() => <ContextualSidebar />);
    const link = screen.getByRole('link', { name: 'Sessions' }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/sessions');
  });

  it('does NOT show Knowledge link when context is project', () => {
    setSidebarContextMock('project');
    setActiveProjectMock(makeProject());
    render(() => <ContextualSidebar />);
    expect(screen.queryByRole('link', { name: 'Knowledge' })).toBeNull();
  });

  // ── Vault context ────────────────────────────────────────────────────────

  it('shows "Knowledge" link when context is vault', () => {
    setSidebarContextMock('vault');
    setContextNameMock('my-vault');
    render(() => <ContextualSidebar />);
    expect(screen.getByRole('link', { name: 'Knowledge' })).toBeDefined();
  });

  it('Knowledge link points to /knowledge in vault context', () => {
    setSidebarContextMock('vault');
    render(() => <ContextualSidebar />);
    const link = screen.getByRole('link', { name: 'Knowledge' }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/knowledge');
  });

  it('does NOT show Vaults link when context is vault', () => {
    setSidebarContextMock('vault');
    render(() => <ContextualSidebar />);
    expect(screen.queryByRole('link', { name: 'Vaults' })).toBeNull();
  });

  it('does NOT show Sessions link when context is vault', () => {
    setSidebarContextMock('vault');
    render(() => <ContextualSidebar />);
    expect(screen.queryByRole('link', { name: 'Sessions' })).toBeNull();
  });

  it('shows Linked Projects section in vault context', () => {
    setSidebarContextMock('vault');
    setContextNameMock('my-vault');
    setActiveVaultMock(makeVault());
    render(() => <ContextualSidebar />);
    expect(screen.getByText('Linked Projects')).toBeDefined();
  });

  it('shows Import Knowledge button in vault context', () => {
    setSidebarContextMock('vault');
    setActiveVaultMock(makeVault());
    render(() => <ContextualSidebar />);
    expect(screen.getByRole('button', { name: 'Import Knowledge' })).toBeDefined();
  });

  it('shows Export Knowledge button in vault context', () => {
    setSidebarContextMock('vault');
    setActiveVaultMock(makeVault());
    render(() => <ContextualSidebar />);
    expect(screen.getByRole('button', { name: 'Export Knowledge' })).toBeDefined();
  });

  it('shows + Add button in Linked Projects section', () => {
    setSidebarContextMock('vault');
    setActiveVaultMock(makeVault());
    render(() => <ContextualSidebar />);
    expect(screen.getByTitle('Link a project')).toBeDefined();
  });

  it('shows import dialog when Import Knowledge is clicked', async () => {
    setSidebarContextMock('vault');
    setActiveVaultMock(makeVault());
    render(() => <ContextualSidebar />);
    const btn = screen.getByRole('button', { name: 'Import Knowledge' });
    btn.click();
    expect(screen.getByTestId('import-dialog')).toBeDefined();
  });

  it('shows export dialog when Export Knowledge is clicked', async () => {
    setSidebarContextMock('vault');
    setActiveVaultMock(makeVault());
    render(() => <ContextualSidebar />);
    const btn = screen.getByRole('button', { name: 'Export Knowledge' });
    btn.click();
    expect(screen.getByTestId('export-dialog')).toBeDefined();
  });

  // ── Header ───────────────────────────────────────────────────────────────

  it('shows Project label in header when context is project', () => {
    setSidebarContextMock('project');
    setContextNameMock('my-app');
    setActiveProjectMock(makeProject());
    render(() => <ContextualSidebar />);
    expect(screen.getByText('Project')).toBeDefined();
  });

  it('shows Vault label in header when context is vault', () => {
    setSidebarContextMock('vault');
    setContextNameMock('my-vault');
    render(() => <ContextualSidebar />);
    expect(screen.getByText('Vault')).toBeDefined();
  });

  it('shows the active context name in the header', () => {
    setSidebarContextMock('project');
    setContextNameMock('awesome-project');
    setActiveProjectMock(makeProject({ name: 'awesome-project' }));
    render(() => <ContextualSidebar />);
    expect(screen.getByText('awesome-project')).toBeDefined();
  });

  // ── Header clear-context button ──────────────────────────────────────────

  it('clicking vault name in header calls clearVaultContext', () => {
    setSidebarContextMock('vault');
    setContextNameMock('Hytale');
    setActiveVaultMock(makeVault({ name: 'Hytale' }));
    render(() => <ContextualSidebar />);
    screen.getByTitle('Back to list').click();
    expect(navigationStore.clearVaultContext).toHaveBeenCalledTimes(1);
  });

  it('clicking vault name in header navigates to /vaults', () => {
    setSidebarContextMock('vault');
    setContextNameMock('Hytale');
    setActiveVaultMock(makeVault({ name: 'Hytale' }));
    render(() => <ContextualSidebar />);
    screen.getByTitle('Back to list').click();
    expect(navigateMock).toHaveBeenCalledWith('/vaults');
  });

  it('clicking project name in header calls clearContext', () => {
    setSidebarContextMock('project');
    setContextNameMock('my-app');
    setActiveProjectMock(makeProject({ name: 'my-app' }));
    render(() => <ContextualSidebar />);
    screen.getByTitle('Back to list').click();
    expect(navigationStore.clearContext).toHaveBeenCalledTimes(1);
  });

  it('clicking project name in header navigates to /projects', () => {
    setSidebarContextMock('project');
    setContextNameMock('my-app');
    setActiveProjectMock(makeProject({ name: 'my-app' }));
    render(() => <ContextualSidebar />);
    screen.getByTitle('Back to list').click();
    expect(navigateMock).toHaveBeenCalledWith('/projects');
  });
});
