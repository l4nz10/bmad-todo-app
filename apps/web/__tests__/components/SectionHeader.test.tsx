import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionHeader } from '../../src/components/SectionHeader.tsx';

describe('SectionHeader', () => {
  it('renders the label text', () => {
    render(<SectionHeader label="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('uses an h2 element', () => {
    render(<SectionHeader label="Active" />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(<SectionHeader label="Completed" />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.className).toContain('font-semibold');
    expect(heading.className).toContain('text-text-secondary');
    expect(heading.className).toContain('uppercase');
    expect(heading.className).toContain('tracking-wide');
  });
});
