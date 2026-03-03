import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';
import type { DiscoveredProject, Vault } from '@nori/shared';

// ── Mocks ─────────────────────────────────────────────────────────────────────

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
    let _context: 'project' | null = null;
    let _name: string | null = null;
    let _project: DiscoveredProject | null = null;
    return {
      getSidebarContext: () => _context,
      setSidebarContextMock: (v: 'project' | null) => { _context = v; },
      getContextName: () => _name,
      setContextNameMock: (v: string | null) => { _name = v; },
      getActiveProject: () => _project,
      setActiveProjectMock: (v: DiscoveredProject | null) => { _project = v; },
    };
  });

vi.mock('../../../stores/navigation.store', () => ({
  sidebarContext: getSidebarContext,
  activeContextName: getContextName,
  activeProject: getActiveProject,
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
    setVaultsMock([]);
    cleanup();
  });

  function makeProject(overrides: Partial<DiscoveredProject> = {}): DiscoveredProject {
    return {
      id: 'proj-1',
      name: 'my-project',
      path: '/home/user/my-project',
      is_git: false,
      connected_vaults: [],
      created_at: '2026-01-01T00:00:00Z',
      source: 'nori',
      has_nori: true,
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

  it('shows Project label in header', () => {
    setSidebarContextMock('project');
    setContextNameMock('my-app');
    setActiveProjectMock(makeProject());
    render(() => <ContextualSidebar />);
    expect(screen.getByText('Project')).toBeDefined();
  });

  it('shows the active project name in the header', () => {
    setSidebarContextMock('project');
    setContextNameMock('awesome-project');
    setActiveProjectMock(makeProject({ name: 'awesome-project' }));
    render(() => <ContextualSidebar />);
    expect(screen.getByText('awesome-project')).toBeDefined();
  });

  it('shows Linked Vaults label', () => {
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

  it('shows Sessions nav link', () => {
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

  it('does NOT show Knowledge link', () => {
    setSidebarContextMock('project');
    setActiveProjectMock(makeProject());
    render(() => <ContextualSidebar />);
    expect(screen.queryByRole('link', { name: 'Knowledge' })).toBeNull();
  });

  it('does NOT show vault context elements (Import Knowledge, Export Knowledge)', () => {
    setSidebarContextMock('project');
    setActiveProjectMock(makeProject());
    render(() => <ContextualSidebar />);
    expect(screen.queryByRole('button', { name: 'Import Knowledge' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Export Knowledge' })).toBeNull();
  });

  // ── Header navigation ────────────────────────────────────────────────────

  it('clicking project name calls clearContext', () => {
    setSidebarContextMock('project');
    setContextNameMock('my-app');
    setActiveProjectMock(makeProject({ name: 'my-app' }));
    render(() => <ContextualSidebar />);
    screen.getByTitle('Back to projects').click();
    expect(navigationStore.clearContext).toHaveBeenCalledTimes(1);
  });

  it('clicking project name navigates to /projects', () => {
    setSidebarContextMock('project');
    setContextNameMock('my-app');
    setActiveProjectMock(makeProject({ name: 'my-app' }));
    render(() => <ContextualSidebar />);
    screen.getByTitle('Back to projects').click();
    expect(navigateMock).toHaveBeenCalledWith('/projects');
  });
});
