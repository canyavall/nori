import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('./RepoExtractDialog.hook', () => ({
  useRepoExtractDialog: vi.fn(),
}));

import { useRepoExtractDialog } from './RepoExtractDialog.hook';
import { RepoExtractDialog } from './RepoExtractDialog';

const mockUse = vi.mocked(useRepoExtractDialog);

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDefaultHook(overrides: Record<string, unknown> = {}) {
  return {
    state: () => 'scanning' as const,
    setState: vi.fn(),
    sessionId: () => '',
    messages: () => [],
    proposals: () => [],
    progress: () => 'Scanning repository...',
    userReply: () => '',
    setUserReply: vi.fn(),
    savedCount: () => 0,
    savingMessage: () => '',
    errorMessage: () => '',
    includedProposals: () => [],
    handleStart: vi.fn(),
    handleReply: vi.fn(),
    handleSkipQuestions: vi.fn(),
    updateProposal: vi.fn(),
    handleSave: vi.fn(),
    close: vi.fn(),
    ...overrides,
  };
}

function makeProposal(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Test Entry',
    category: 'guide',
    tags: ['tag-one', 'tag-two', 'tag-three'],
    description: 'Test description',
    required_knowledge: [],
    rules: ['src/**/*.ts'],
    content: '# Test\n\nContent here.',
    included: true,
    tagsInput: 'tag-one, tag-two, tag-three',
    requiredKnowledgeInput: '',
    rulesInput: 'src/**/*.ts',
    optionalKnowledgeInput: '',
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RepoExtractDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    mockUse.mockReturnValue(makeDefaultHook());
  });

  it('shows scanning state with progress', () => {
    mockUse.mockReturnValue(makeDefaultHook({
      state: () => 'scanning',
      progress: () => 'Scanning repository files...',
    }));
    render(() => <RepoExtractDialog projectPath="/test" vaultId="vault-1" onClose={() => {}} />);
    expect(screen.getByText('Scanning repository files...')).toBeDefined();
  });

  it('shows conversation state with messages', () => {
    mockUse.mockReturnValue(makeDefaultHook({
      state: () => 'conversation',
      messages: () => [
        { role: 'assistant', content: 'I found some patterns. Should I document them?' },
      ],
    }));
    render(() => <RepoExtractDialog projectPath="/test" vaultId="vault-1" onClose={() => {}} />);
    expect(screen.getByText('I found some patterns. Should I document them?')).toBeDefined();
    expect(screen.getByPlaceholderText('Type your response...')).toBeDefined();
  });

  it('shows review state with proposals', () => {
    const proposals = [
      makeProposal({ title: 'Architecture Guide' }),
      makeProposal({ title: 'Code Conventions' }),
    ];
    mockUse.mockReturnValue(makeDefaultHook({
      state: () => 'review',
      proposals: () => proposals,
      includedProposals: () => proposals,
    }));
    render(() => <RepoExtractDialog projectPath="/test" vaultId="vault-1" onClose={() => {}} />);
    expect(screen.getByText('Entry 1')).toBeDefined();
    expect(screen.getByText('Entry 2')).toBeDefined();
  });

  it('shows saving state with message', () => {
    mockUse.mockReturnValue(makeDefaultHook({
      state: () => 'saving',
      savingMessage: () => 'Saving "Architecture Guide" (1/2)...',
    }));
    render(() => <RepoExtractDialog projectPath="/test" vaultId="vault-1" onClose={() => {}} />);
    expect(screen.getByText('Saving "Architecture Guide" (1/2)...')).toBeDefined();
  });

  it('shows done state with count', () => {
    mockUse.mockReturnValue(makeDefaultHook({
      state: () => 'done',
      savedCount: () => 3,
    }));
    render(() => <RepoExtractDialog projectPath="/test" vaultId="vault-1" onClose={() => {}} />);
    expect(screen.getByText('3 entries saved')).toBeDefined();
  });

  it('shows error state with message', () => {
    mockUse.mockReturnValue(makeDefaultHook({
      state: () => 'error',
      errorMessage: () => 'Failed to scan repository',
    }));
    render(() => <RepoExtractDialog projectPath="/test" vaultId="vault-1" onClose={() => {}} />);
    expect(screen.getByText('Failed to scan repository')).toBeDefined();
  });

  it('renders the dialog header', () => {
    render(() => <RepoExtractDialog projectPath="/test" vaultId="vault-1" onClose={() => {}} />);
    expect(screen.getByText('Analyze Repository')).toBeDefined();
  });

  it('shows save button in review state with correct count', () => {
    const proposals = [makeProposal()];
    mockUse.mockReturnValue(makeDefaultHook({
      state: () => 'review',
      proposals: () => proposals,
      includedProposals: () => proposals,
    }));
    render(() => <RepoExtractDialog projectPath="/test" vaultId="vault-1" onClose={() => {}} />);
    expect(screen.getByText('Save 1 Entry')).toBeDefined();
  });
});
