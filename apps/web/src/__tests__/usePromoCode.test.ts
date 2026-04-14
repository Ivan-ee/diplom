import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCartStore } from '@/stores/cart-store';

// ── Helpers ─────────────────────────────────────────────────────────────────

const TOTAL_PRICE = 200000; // 2000₽ in kopeks

function resetStore() {
  useCartStore.setState({ promoResult: null });
}

// ── fetchClient mock ─────────────────────────────────────────────────────────
// usePromoCode calls fetchClient which calls fetch internally via window.location.
// We mock the @/lib/api module to control fetchClient directly.

vi.mock('@/lib/api', () => ({
  fetchClient: vi.fn(),
}));

import { fetchClient } from '@/lib/api';
const mockedFetchClient = vi.mocked(fetchClient);

// ── Tests ────────────────────────────────────────────────────────────────────
// usePromoCode is a React hook, but all of its logic is pure functions + Zustand.
// We test the store-backed contract directly (state mutations) and the handler
// logic by importing and calling the internals via the Zustand store.
// For the React state (promoCode, promoLoading, promoError) we test via
// renderHook from @testing-library/react.

import { renderHook, act } from '@testing-library/react';
import { usePromoCode } from '@/hooks/usePromoCode';

describe('usePromoCode', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  it('initialises with empty promoCode when store has no promoResult', () => {
    const { result } = renderHook(() => usePromoCode(TOTAL_PRICE));
    expect(result.current.promoCode).toBe('');
    expect(result.current.promoLoading).toBe(false);
    expect(result.current.promoError).toBeNull();
    expect(result.current.promoResult).toBeNull();
  });

  it('initialises promoCode from existing store promoResult.code', () => {
    useCartStore.setState({
      promoResult: {
        valid: true,
        code: 'SAVE10',
        discountType: 'percentage',
        discountValue: 10,
        discountAmount: 20000,
      },
    });
    const { result } = renderHook(() => usePromoCode(TOTAL_PRICE));
    expect(result.current.promoCode).toBe('SAVE10');
  });

  // ── finalPrice ─────────────────────────────────────────────────────────────

  it('finalPrice equals totalPrice when no promoResult', () => {
    const { result } = renderHook(() => usePromoCode(TOTAL_PRICE));
    expect(result.current.finalPrice).toBe(TOTAL_PRICE);
  });

  it('finalPrice subtracts discountAmount when promoResult is set', () => {
    useCartStore.setState({
      promoResult: {
        valid: true,
        code: 'FLAT50',
        discountAmount: 50000,
      },
    });
    const { result } = renderHook(() => usePromoCode(TOTAL_PRICE));
    expect(result.current.finalPrice).toBe(TOTAL_PRICE - 50000);
  });

  it('finalPrice is clamped to 0 when discountAmount exceeds totalPrice', () => {
    useCartStore.setState({
      promoResult: {
        valid: true,
        code: 'BIGDISCOUNT',
        discountAmount: TOTAL_PRICE + 50000,
      },
    });
    const { result } = renderHook(() => usePromoCode(TOTAL_PRICE));
    expect(result.current.finalPrice).toBe(0);
  });

  // ── setPromoCode ───────────────────────────────────────────────────────────

  it('setPromoCode updates the local promoCode value', () => {
    const { result } = renderHook(() => usePromoCode(TOTAL_PRICE));
    act(() => {
      result.current.setPromoCode('NEWCODE');
    });
    expect(result.current.promoCode).toBe('NEWCODE');
  });

  // ── handleApplyPromo — success ─────────────────────────────────────────────

  it('handleApplyPromo: calls fetchClient and sets promoResult on valid code', async () => {
    const mockPromoResult = {
      valid: true,
      code: 'SUMMER20',
      discountType: 'percentage',
      discountValue: 20,
      discountAmount: 40000,
    };

    mockedFetchClient.mockResolvedValueOnce({
      success: true,
      data: mockPromoResult,
    });

    const { result } = renderHook(() => usePromoCode(TOTAL_PRICE));

    act(() => {
      result.current.setPromoCode('SUMMER20');
    });

    await act(async () => {
      await result.current.handleApplyPromo();
    });

    expect(mockedFetchClient).toHaveBeenCalledWith('/promo-codes/validate', {
      method: 'POST',
      body: JSON.stringify({ code: 'SUMMER20', cartTotal: TOTAL_PRICE }),
    });

    expect(useCartStore.getState().promoResult).toEqual(mockPromoResult);
    expect(result.current.promoError).toBeNull();
    expect(result.current.promoLoading).toBe(false);
  });

  // ── handleApplyPromo — invalid code ───────────────────────────────────────

  it('handleApplyPromo: sets promoError when code is invalid', async () => {
    mockedFetchClient.mockResolvedValueOnce({
      success: true,
      data: {
        valid: false,
        code: 'BADCODE',
        discountAmount: 0,
        message: 'Промокод истёк',
      },
    });

    const { result } = renderHook(() => usePromoCode(TOTAL_PRICE));

    act(() => {
      result.current.setPromoCode('BADCODE');
    });

    await act(async () => {
      await result.current.handleApplyPromo();
    });

    expect(useCartStore.getState().promoResult).toBeNull();
    expect(result.current.promoError).toBe('Промокод истёк');
    expect(result.current.promoLoading).toBe(false);
  });

  it('handleApplyPromo: falls back to default error message when message is absent', async () => {
    mockedFetchClient.mockResolvedValueOnce({
      success: true,
      data: {
        valid: false,
        code: 'BADCODE',
        discountAmount: 0,
      },
    });

    const { result } = renderHook(() => usePromoCode(TOTAL_PRICE));

    act(() => {
      result.current.setPromoCode('BADCODE');
    });

    await act(async () => {
      await result.current.handleApplyPromo();
    });

    expect(result.current.promoError).toBe('Промокод недействителен');
  });

  // ── handleApplyPromo — res.success === false ──────────────────────────────

  it('handleApplyPromo: sets error from res.error.message when res.success is false', async () => {
    mockedFetchClient.mockResolvedValueOnce({
      success: false,
      data: null,
      error: { code: 'PROMO_EXPIRED', message: 'Промокод уже истёк' },
    });

    const { result } = renderHook(() => usePromoCode(TOTAL_PRICE));

    act(() => {
      result.current.setPromoCode('EXPIRED');
    });

    await act(async () => {
      await result.current.handleApplyPromo();
    });

    expect(useCartStore.getState().promoResult).toBeNull();
    expect(result.current.promoError).toBe('Промокод уже истёк');
    expect(result.current.promoLoading).toBe(false);
  });

  it('handleApplyPromo: falls back to generic error when res.success is false and error.message absent', async () => {
    mockedFetchClient.mockResolvedValueOnce({
      success: false,
      data: null,
    });

    const { result } = renderHook(() => usePromoCode(TOTAL_PRICE));

    act(() => {
      result.current.setPromoCode('EXPIRED');
    });

    await act(async () => {
      await result.current.handleApplyPromo();
    });

    expect(result.current.promoError).toBe('Не удалось проверить промокод');
  });

  // ── handleApplyPromo — network error ──────────────────────────────────────

  it('handleApplyPromo: sets generic error on fetch rejection', async () => {
    mockedFetchClient.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => usePromoCode(TOTAL_PRICE));

    act(() => {
      result.current.setPromoCode('ANYCODE');
    });

    await act(async () => {
      await result.current.handleApplyPromo();
    });

    expect(result.current.promoError).toBe('Не удалось проверить промокод');
    expect(result.current.promoLoading).toBe(false);
  });

  // ── handleApplyPromo — empty code guard ───────────────────────────────────

  it('handleApplyPromo: does nothing when promoCode is empty', async () => {
    const { result } = renderHook(() => usePromoCode(TOTAL_PRICE));

    await act(async () => {
      await result.current.handleApplyPromo();
    });

    expect(mockedFetchClient).not.toHaveBeenCalled();
  });

  it('handleApplyPromo: does nothing when promoCode is whitespace only', async () => {
    const { result } = renderHook(() => usePromoCode(TOTAL_PRICE));

    act(() => {
      result.current.setPromoCode('   ');
    });

    await act(async () => {
      await result.current.handleApplyPromo();
    });

    expect(mockedFetchClient).not.toHaveBeenCalled();
  });

  // ── handleRemovePromo ──────────────────────────────────────────────────────

  it('handleRemovePromo: clears store promoResult, promoCode, and promoError', async () => {
    useCartStore.setState({
      promoResult: {
        valid: true,
        code: 'REMOVE_ME',
        discountAmount: 10000,
      },
    });

    const { result } = renderHook(() => usePromoCode(TOTAL_PRICE));

    act(() => {
      result.current.handleRemovePromo();
    });

    expect(useCartStore.getState().promoResult).toBeNull();
    expect(result.current.promoCode).toBe('');
    expect(result.current.promoError).toBeNull();
  });
});
