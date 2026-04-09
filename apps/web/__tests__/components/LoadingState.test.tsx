import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from '../../src/components/LoadingState.tsx';

describe('LoadingState', () => {
  it('renders three skeleton cards', () => {
    const { container } = render(<LoadingState />);
    const cards = container.querySelectorAll('[data-testid="skeleton-card"]');
    expect(cards).toHaveLength(3);
  });

  it('has aria-busy attribute', () => {
    render(<LoadingState />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-busy', 'true');
  });

  it('has role="status"', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has accessible loading text', () => {
    render(<LoadingState />);
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
  });
});
