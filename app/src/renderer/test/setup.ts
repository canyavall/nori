import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock Tauri APIs
const mockInvoke = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
}));

// Reset mocks before each test
beforeEach(() => {
  mockInvoke.mockClear();
});

// Export mock for use in tests
export { mockInvoke };
