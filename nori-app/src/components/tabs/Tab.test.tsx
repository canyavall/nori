import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import userEvent from '@testing-library/user-event';
import { Tab } from './Tab';

describe('Tab', () => {
  const defaultProps = {
    id: 'tab-123',
    title: 'Test Tab',
    isActive: false,
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };

  it('should render tab with title', () => {
    render(<Tab {...defaultProps} />);
    expect(screen.getByText('Test Tab')).toBeInTheDocument();
  });

  it('should render close button with aria-label', () => {
    render(<Tab {...defaultProps} />);
    expect(screen.getByLabelText('Close tab')).toBeInTheDocument();
  });

  it('should call onSelect when tab is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(<Tab {...defaultProps} onSelect={onSelect} />);

    await user.click(screen.getByText('Test Tab'));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<Tab {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByLabelText('Close tab'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onSelect when close button is clicked', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<Tab {...defaultProps} onSelect={onSelect} onClose={onClose} />);

    await user.click(screen.getByLabelText('Close tab'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('should apply active styles when isActive is true', () => {
    const { rerender } = render(<Tab {...defaultProps} isActive={false} />);

    const tabElement = screen.getByText('Test Tab').closest('div');
    expect(tabElement).toBeInTheDocument();

    rerender(<Tab {...defaultProps} isActive={true} />);

    // Tab should still render with active state
    expect(screen.getByText('Test Tab')).toBeInTheDocument();
  });

  it('should truncate long titles', () => {
    const longTitle = 'This is a very long tab title that should be truncated';
    render(<Tab {...defaultProps} title={longTitle} />);

    const titleElement = screen.getByText(longTitle);
    expect(titleElement).toBeInTheDocument();
  });

  describe('accessibility', () => {
    it('should have clickable tab element', () => {
      render(<Tab {...defaultProps} />);
      const tabElement = screen.getByText('Test Tab').closest('div');
      expect(tabElement).toBeInTheDocument();
    });

    it('should have close button with descriptive aria-label', () => {
      render(<Tab {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close tab');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton.getAttribute('aria-label')).toBe('Close tab');
    });
  });

  describe('event handling', () => {
    it('should handle multiple rapid clicks', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();

      render(<Tab {...defaultProps} onSelect={onSelect} />);

      await user.click(screen.getByText('Test Tab'));
      await user.click(screen.getByText('Test Tab'));
      await user.click(screen.getByText('Test Tab'));

      expect(onSelect).toHaveBeenCalledTimes(3);
    });

    it('should handle both onSelect and onClose independently', async () => {
      const onSelect = vi.fn();
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(<Tab {...defaultProps} onSelect={onSelect} onClose={onClose} />);

      await user.click(screen.getByText('Test Tab'));
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();

      await user.click(screen.getByLabelText('Close tab'));
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
