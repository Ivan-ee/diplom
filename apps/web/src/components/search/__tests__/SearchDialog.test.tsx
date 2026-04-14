import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchDialog } from '../SearchDialog';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      variants: _variants,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & {
      children?: React.ReactNode;
      variants?: unknown;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
    }) => <div {...rest}>{children}</div>,
  },
  useReducedMotion: () => true,
}));

const mockFetchClient = vi.fn();
vi.mock('@/lib/api', () => ({
  fetchClient: (...args: unknown[]) => mockFetchClient(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderDialog() {
  const onClose = vi.fn();
  const result = render(<SearchDialog isOpen={true} onClose={onClose} />);
  return { ...result, onClose };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SearchDialog', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockFetchClient.mockReset();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('shows error message when search API fails', async () => {
    mockFetchClient.mockRejectedValue(new Error('Network error'));

    renderDialog();

    const input = screen.getByRole('combobox');

    await act(async () => {
      await userEvent.type(input, 'торт');
      vi.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(screen.getByText(/временно недоступен/i)).toBeInTheDocument();
    });
  });

  it('shows results when search succeeds', async () => {
    mockFetchClient.mockResolvedValue({
      data: [
        {
          id: '1',
          name: 'Торт',
          highlightedName: 'Торт',
          highlightedDescription: null,
          slug: 'tort',
          imageUrl: null,
          pricePerKg: 50000,
          pricePerUnit: null,
          priceType: 'per_kg',
          category: 'Торты',
        },
      ],
    });

    renderDialog();

    const input = screen.getByRole('combobox');

    await act(async () => {
      await userEvent.type(input, 'торт');
      vi.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  it('does not show error when query is cleared after a failed search', async () => {
    mockFetchClient.mockRejectedValue(new Error('Network error'));

    renderDialog();

    const input = screen.getByRole('combobox');

    await act(async () => {
      await userEvent.type(input, 'торт');
      vi.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(screen.getByText(/временно недоступен/i)).toBeInTheDocument();
    });

    // Clear the input — error should disappear
    await act(async () => {
      await userEvent.clear(input);
    });

    await waitFor(() => {
      expect(screen.queryByText(/временно недоступен/i)).not.toBeInTheDocument();
    });
  });
});
