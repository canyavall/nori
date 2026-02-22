import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock @solidjs/router so <A> renders a plain <a> without needing a Router context
vi.mock('@solidjs/router', () => ({
  A: (props: { href: string; class?: string; activeClass?: string; children: unknown }) => (
    <a href={props.href} class={props.class}>
      {props.children}
    </a>
  ),
}));

const { getSidebarContext, setSidebarContextMock, getContextName, setContextNameMock } =
  vi.hoisted(() => {
    let _context: 'project' | 'vault' | null = null;
    let _name: string | null = null;
    return {
      getSidebarContext: () => _context,
      setSidebarContextMock: (v: 'project' | 'vault' | null) => {
        _context = v;
      },
      getContextName: () => _name,
      setContextNameMock: (v: string | null) => {
        _name = v;
      },
    };
  });

vi.mock('../../stores/navigation.store', () => ({
  sidebarContext: getSidebarContext,
  activeContextName: getContextName,
}));

import { ContextualSidebar } from './ContextualSidebar';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ContextualSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSidebarContextMock(null);
    setContextNameMock(null);
    cleanup();
  });

  // ── Project context ──────────────────────────────────────────────────────

  it('shows "Vaults" link when context is project', () => {
    setSidebarContextMock('project');
    setContextNameMock('my-app');
    render(() => <ContextualSidebar />);
    expect(screen.getByRole('link', { name: 'Vaults' })).toBeDefined();
  });

  it('Vaults link points to /vaults in project context', () => {
    setSidebarContextMock('project');
    render(() => <ContextualSidebar />);
    const link = screen.getByRole('link', { name: 'Vaults' }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/vaults');
  });

  it('shows "Sessions" link when context is project', () => {
    setSidebarContextMock('project');
    render(() => <ContextualSidebar />);
    expect(screen.getByRole('link', { name: 'Sessions' })).toBeDefined();
  });

  it('does NOT show "Knowledge" link when context is project', () => {
    setSidebarContextMock('project');
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

  it('does NOT show "Vaults" link when context is vault', () => {
    setSidebarContextMock('vault');
    render(() => <ContextualSidebar />);
    expect(screen.queryByRole('link', { name: 'Vaults' })).toBeNull();
  });

  it('does NOT show "Sessions" link when context is vault', () => {
    setSidebarContextMock('vault');
    render(() => <ContextualSidebar />);
    expect(screen.queryByRole('link', { name: 'Sessions' })).toBeNull();
  });

  // ── Header ───────────────────────────────────────────────────────────────

  it('shows "Project" label in header when context is project', () => {
    setSidebarContextMock('project');
    setContextNameMock('my-app');
    render(() => <ContextualSidebar />);
    expect(screen.getByText('Project')).toBeDefined();
  });

  it('shows "Vault" label in header when context is vault', () => {
    setSidebarContextMock('vault');
    setContextNameMock('my-vault');
    render(() => <ContextualSidebar />);
    expect(screen.getByText('Vault')).toBeDefined();
  });

  it('shows the active context name in the header', () => {
    setSidebarContextMock('project');
    setContextNameMock('awesome-project');
    render(() => <ContextualSidebar />);
    expect(screen.getByText('awesome-project')).toBeDefined();
  });
});
