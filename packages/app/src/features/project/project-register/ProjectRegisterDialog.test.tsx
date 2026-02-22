import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@solidjs/testing-library';
import { ProjectRegisterDialog } from './ProjectRegisterDialog';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../../lib/folder-picker', () => ({
  pickFolder: vi.fn(),
}));

vi.mock('../../../lib/api', () => ({
  apiPost: vi.fn(),
}));

vi.mock('../../../stores/project.store', () => ({
  addProject: vi.fn(),
  setRegisterOpen: vi.fn(),
}));

import { pickFolder } from '../../../lib/folder-picker';
import { apiPost } from '../../../lib/api';
import { addProject, setRegisterOpen } from '../../../stores/project.store';

const mockPickFolder = vi.mocked(pickFolder);
const mockApiPost = vi.mocked(apiPost);

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOCK_PROJECT = {
  data: {
    id: 'proj-1',
    name: 'my-project',
    path: '/home/user/my-project',
    is_git: false,
    connected_vaults: [],
    created_at: '2026-01-01T00:00:00Z',
  },
};

function getBrowseButton() {
  return screen.getByRole('button', { name: /browse/i });
}

function getRegisterButton() {
  return screen.getByRole('button', { name: /^register$/i });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ProjectRegisterDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('renders a Browse button for folder selection', () => {
    render(() => <ProjectRegisterDialog />);
    expect(getBrowseButton()).toBeDefined();
  });

  it('path field starts empty with placeholder text', () => {
    render(() => <ProjectRegisterDialog />);
    const pathInput = screen.getByPlaceholderText('No folder selected');
    expect(pathInput).toBeDefined();
    expect((pathInput as HTMLInputElement).value).toBe('');
  });

  it('Register button is disabled when no path is selected', () => {
    render(() => <ProjectRegisterDialog />);
    expect((getRegisterButton() as HTMLButtonElement).disabled).toBe(true);
  });

  it('clicking Browse calls pickFolder()', async () => {
    mockPickFolder.mockResolvedValue(null);
    render(() => <ProjectRegisterDialog />);

    fireEvent.click(getBrowseButton());

    await waitFor(() => {
      expect(mockPickFolder).toHaveBeenCalledOnce();
    });
  });

  it('shows selected path in the field after Browse returns a path', async () => {
    mockPickFolder.mockResolvedValue('/home/user/my-project');
    render(() => <ProjectRegisterDialog />);

    fireEvent.click(getBrowseButton());

    await waitFor(() => {
      const input = screen.getByPlaceholderText('No folder selected') as HTMLInputElement;
      expect(input.value).toBe('/home/user/my-project');
    });
  });

  it('does not change path when Browse is cancelled (returns null)', async () => {
    mockPickFolder.mockResolvedValue(null);
    render(() => <ProjectRegisterDialog />);

    fireEvent.click(getBrowseButton());

    await waitFor(() => expect(mockPickFolder).toHaveBeenCalledOnce());

    const input = screen.getByPlaceholderText('No folder selected') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('Register button becomes enabled after a path is selected', async () => {
    mockPickFolder.mockResolvedValue('/home/user/my-project');
    render(() => <ProjectRegisterDialog />);

    fireEvent.click(getBrowseButton());

    await waitFor(() => {
      expect((getRegisterButton() as HTMLButtonElement).disabled).toBe(false);
    });
  });

  it('Browse button shows "…" while the picker is open', async () => {
    let resolvePicker!: (v: string | null) => void;
    mockPickFolder.mockReturnValue(new Promise((r) => (resolvePicker = r)));
    render(() => <ProjectRegisterDialog />);

    fireEvent.click(getBrowseButton());

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '…' })).toBeDefined();
    });

    resolvePicker(null);

    await waitFor(() => {
      expect(getBrowseButton()).toBeDefined();
    });
  });

  it('submits with the selected path and optional name', async () => {
    mockPickFolder.mockResolvedValue('/home/user/my-project');
    mockApiPost.mockResolvedValue(MOCK_PROJECT);
    render(() => <ProjectRegisterDialog />);

    fireEvent.click(getBrowseButton());
    await waitFor(() => screen.getByDisplayValue('/home/user/my-project'));

    const nameInput = screen.getByPlaceholderText('Defaults to folder name');
    fireEvent.input(nameInput, { target: { value: 'My Project' } });

    fireEvent.click(getRegisterButton());

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/api/project', {
        path: '/home/user/my-project',
        name: 'My Project',
      });
    });
  });

  it('calls addProject and closes dialog on success', async () => {
    mockPickFolder.mockResolvedValue('/home/user/my-project');
    mockApiPost.mockResolvedValue(MOCK_PROJECT);
    render(() => <ProjectRegisterDialog />);

    fireEvent.click(getBrowseButton());
    await waitFor(() => screen.getByDisplayValue('/home/user/my-project'));
    fireEvent.click(getRegisterButton());

    await waitFor(() => {
      expect(addProject).toHaveBeenCalledWith(MOCK_PROJECT.data);
      expect(setRegisterOpen).toHaveBeenCalledWith(false);
    });
  });

  it('shows an error message when the API call fails', async () => {
    mockPickFolder.mockResolvedValue('/home/user/my-project');
    mockApiPost.mockRejectedValue(new Error('Directory not found'));
    render(() => <ProjectRegisterDialog />);

    fireEvent.click(getBrowseButton());
    await waitFor(() => screen.getByDisplayValue('/home/user/my-project'));
    fireEvent.click(getRegisterButton());

    await waitFor(() => {
      expect(screen.getByText('Directory not found')).toBeDefined();
    });
  });
});
