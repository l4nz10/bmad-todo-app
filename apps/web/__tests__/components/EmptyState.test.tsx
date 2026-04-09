import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../../src/components/EmptyState.tsx';

describe('EmptyState', () => {
  it('renders the primary message', () => {
    render(<EmptyState />);
    expect(screen.getByText('No tasks yet')).toBeInTheDocument();
  });

  it('renders the hint text', () => {
    render(<EmptyState />);
    expect(screen.getByText('Type above to get started')).toBeInTheDocument();
  });

  it('uses a heading element for the primary message', () => {
    render(<EmptyState />);
    const heading = screen.getByRole('heading', { name: 'No tasks yet' });
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H2');
  });
});
