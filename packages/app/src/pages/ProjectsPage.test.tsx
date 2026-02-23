import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@solidjs/testing-library';
import type { DiscoveredProject } from '@nori/shared';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
}));

const { getProjects, setMockProjects, setProjectsMock, getRegisterOpen, setRegisterOpenMock } =
  vi.hoisted(() => {
    let _projects: DiscoveredProject[] = [];
    let _open = false;
    return {
      getProjects: () => _projects,
      setMockProjects: (v: DiscoveredProject[]) => { _projects = v; },
      setProjectsMock: vi.fn((v: DiscoveredProject[]) => { _projects = v; }),
      getRegisterOpen: () => _open,
      setRegisterOpenMock: vi.fn((v: boolean) => { _open = v; }),
    };
  });

vi.mock('../stores/project.store', () => ({
  projects: getProjects,
  setProjects: setProjectsMock,
  registerOpen: getRegisterOpen,
  setRegisterOpen: setRegisterOpenMock,
  setRegisterPrefilledPath: vi.fn(),
}));

const { getActiveProject, setMockActiveProject, selectProjectMock } = vi.hoisted(() => {
  let _active: DiscoveredProject | null = null;
  return {
    getActiveProject: () => _active,
    setMockActiveProject: (v: DiscoveredProject | null) => { _active = v; },
    selectProjectMock: vi.fn((p: DiscoveredProject) => { _active = p; }),
  };
});

vi.mock('../stores/navigation.store', () => ({
  activeProject: getActiveProject,
  selectProject: selectProjectMock,
  clearContext: vi.fn(),
}));

// Stub out the register dialog so it doesn't need its own deps
vi.mock('../features/project/project-register/ProjectRegisterDialog', () => ({
  ProjectRegisterDialog: () => <div data-testid="register-dialog" />,
}));

import { apiGet } from '../lib/api';
import { ProjectsPage } from './ProjectsPage';

const mockApiGet = vi.mocked(apiGet);

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ProjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMockProjects([]);
    setMockActiveProject(null);
    cleanup();
  });

  it('shows loading state while fetching', () => {
    // Never resolves — stays in loading
    mockApiGet.mockReturnValue(new Promise(() => {}));
    render(() => <ProjectsPage />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('shows empty state after load with no projects', async () => {
    mockApiGet.mockResolvedValue({ data: [] });
    render(() => <ProjectsPage />);
    await waitFor(() => expect(screen.getByText('No projects found')).toBeDefined());
  });

  it('renders a card for each project', async () => {
    const projects = [
      makeProject({ id: 'p1', name: 'alpha' }),
      makeProject({ id: 'p2', name: 'beta' }),
    ];
    mockApiGet.mockResolvedValue({ data: projects });
    setMockProjects(projects);
    render(() => <ProjectsPage />);
    await waitFor(() => {
      expect(screen.getByText('alpha')).toBeDefined();
      expect(screen.getByText('beta')).toBeDefined();
    });
  });

  it('calls selectProject when a card is clicked', async () => {
    const project = makeProject({ id: 'p1', name: 'alpha' });
    mockApiGet.mockResolvedValue({ data: [project] });
    setMockProjects([project]);
    render(() => <ProjectsPage />);

    await waitFor(() => screen.getByText('alpha'));
    fireEvent.click(screen.getByText('alpha').closest('[class*="rounded-lg"]')!);

    expect(selectProjectMock).toHaveBeenCalledWith(project);
  });

  it('selected card has accent border class', async () => {
    const project = makeProject({ id: 'p1', name: 'alpha' });
    mockApiGet.mockResolvedValue({ data: [project] });
    setMockProjects([project]);
    setMockActiveProject(project);
    render(() => <ProjectsPage />);

    await waitFor(() => screen.getByText('alpha'));
    const card = screen.getByText('alpha').closest('[class*="rounded-lg"]')!;
    expect(card.className).toContain('border-[var(--color-accent)]');
  });

  it('shows "Add Project" button', async () => {
    mockApiGet.mockResolvedValue({ data: [] });
    render(() => <ProjectsPage />);
    await waitFor(() => screen.getByText('No projects found'));
    expect(screen.getAllByRole('button', { name: /add project/i }).length).toBeGreaterThan(0);
  });

  it('clicking "Add Project" calls setRegisterOpen(true)', async () => {
    mockApiGet.mockResolvedValue({ data: [] });
    render(() => <ProjectsPage />);
    await waitFor(() => screen.getByText('No projects found'));

    fireEvent.click(screen.getAllByRole('button', { name: /add project/i })[0]);
    expect(setRegisterOpenMock).toHaveBeenCalledWith(true);
  });

  it('shows git badge when project is_git is true', async () => {
    const project = makeProject({ is_git: true });
    mockApiGet.mockResolvedValue({ data: [project] });
    setMockProjects([project]);
    render(() => <ProjectsPage />);
    await waitFor(() => screen.getByText('git'));
    expect(screen.getByText('git')).toBeDefined();
  });

  it('shows vault count when project has connected vaults', async () => {
    const project = makeProject({ connected_vaults: ['v1', 'v2'] });
    mockApiGet.mockResolvedValue({ data: [project] });
    setMockProjects([project]);
    render(() => <ProjectsPage />);
    await waitFor(() => screen.getByText('2 vaults connected'));
    expect(screen.getByText('2 vaults connected')).toBeDefined();
  });

  it('shows "No vaults connected" when project has no connected vaults', async () => {
    const project = makeProject({ connected_vaults: [] });
    mockApiGet.mockResolvedValue({ data: [project] });
    setMockProjects([project]);
    render(() => <ProjectsPage />);
    await waitFor(() => screen.getByText('No vaults connected'));
    expect(screen.getByText('No vaults connected')).toBeDefined();
  });

  it('cards are in a grid container', async () => {
    const projects = [makeProject({ id: 'p1' }), makeProject({ id: 'p2', name: 'beta' })];
    mockApiGet.mockResolvedValue({ data: projects });
    setMockProjects(projects);
    render(() => <ProjectsPage />);

    await waitFor(() => screen.getByText('my-project'));
    const grid = screen.getByText('my-project').closest('[class*="grid"]');
    expect(grid).not.toBeNull();
    expect(grid!.className).toContain('grid-cols');
  });
});
