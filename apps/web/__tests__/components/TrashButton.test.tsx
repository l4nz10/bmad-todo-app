import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrashButton } from '../../src/components/TrashButton.tsx';

describe('TrashButton', () => {
  it('renders with count and label', () => {
    render(<TrashButton count={3} onClick={() => {}} />);
    expect(screen.getByText('Trash')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('returns null when count is 0', () => {
    const { container } = render(<TrashButton count={0} onClick={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<TrashButton count={2} onClick={onClick} />);

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('has accessible label with count', () => {
    render(<TrashButton count={1} onClick={() => {}} />);
    expect(screen.getByRole('button', { name: 'Trash, 1 item' })).toBeInTheDocument();
  });

  it('pluralizes items correctly', () => {
    render(<TrashButton count={5} onClick={() => {}} />);
    expect(screen.getByRole('button', { name: 'Trash, 5 items' })).toBeInTheDocument();
  });

  it('is focusable', () => {
    render(<TrashButton count={2} onClick={() => {}} />);
    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
  });
});
