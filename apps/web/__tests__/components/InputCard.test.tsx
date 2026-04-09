import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InputCard } from '../../src/components/InputCard.tsx';

describe('InputCard', () => {
  it('renders with placeholder text', () => {
    render(<InputCard />);
    expect(screen.getByPlaceholderText('Add a task...')).toBeInTheDocument();
  });

  it('has a visually hidden label for accessibility', () => {
    render(<InputCard />);
    expect(screen.getByLabelText('Add a task')).toBeInTheDocument();
  });

  it('calls onSubmit with trimmed text on Enter', () => {
    const onSubmit = vi.fn();
    render(<InputCard onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText('Add a task...');
    fireEvent.change(input, { target: { value: '  Test task  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSubmit).toHaveBeenCalledWith('Test task');
  });

  it('does not call onSubmit on Enter with empty text', () => {
    const onSubmit = vi.fn();
    render(<InputCard onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText('Add a task...');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears input on Escape', () => {
    render(<InputCard />);

    const input = screen.getByPlaceholderText('Add a task...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Some text' } });
    expect(input.value).toBe('Some text');

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.value).toBe('');
  });

  it('clears input after successful submit', () => {
    const onSubmit = vi.fn();
    render(<InputCard onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText('Add a task...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Test task' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(input.value).toBe('');
  });

  it('renders as a white card with rounded corners', () => {
    const { container } = render(<InputCard />);
    const card = container.firstElementChild;
    expect(card?.className).toContain('bg-surface');
    expect(card?.className).toContain('rounded-xl');
    expect(card?.className).toContain('shadow-sm');
  });
});
