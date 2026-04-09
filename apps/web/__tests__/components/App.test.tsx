import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from '../../src/App.tsx';

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}

describe('App', () => {
  it('renders the app title', () => {
    renderWithProviders();
    expect(screen.getByRole('heading', { level: 1, name: 'bmad' })).toBeInTheDocument();
  });

  it('renders the InputCard with placeholder', () => {
    renderWithProviders();
    expect(screen.getByPlaceholderText('Add a task...')).toBeInTheDocument();
  });

  it('uses a main element for semantic structure', () => {
    renderWithProviders();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('shows empty state when no todos are loaded', () => {
    renderWithProviders();
    expect(screen.getByText('No tasks yet')).toBeInTheDocument();
  });

  it('applies responsive container classes', () => {
    const { container } = renderWithProviders();
    const main = container.querySelector('main');
    expect(main?.className).toContain('sm:max-w-[640px]');
    expect(main?.className).toContain('sm:mx-auto');
  });
});
