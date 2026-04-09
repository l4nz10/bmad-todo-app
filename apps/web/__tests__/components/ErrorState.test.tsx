import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorState } from '../../src/components/ErrorState.tsx';

describe('ErrorState', () => {
  it('renders the error message', () => {
    render(<ErrorState onRetry={() => {}} />);
    expect(screen.getByText("Couldn't load your tasks")).toBeInTheDocument();
  });

  it('renders a retry button', () => {
    render(<ErrorState onRetry={() => {}} />);
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('has role="alert" for screen reader announcement', () => {
    render(<ErrorState onRetry={() => {}} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

});
