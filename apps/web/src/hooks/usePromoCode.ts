import { useState } from 'react';
import { useCartStore, type PromoResult } from '@/stores/cart-store';
import { fetchClient } from '@/lib/api';

export interface UsePromoCodeReturn {
  promoCode: string;
  setPromoCode: (value: string) => void;
  promoLoading: boolean;
  promoError: string | null;
  promoResult: PromoResult | null;
  finalPrice: number;
  handleApplyPromo: () => Promise<void>;
  handleRemovePromo: () => void;
}

export function usePromoCode(totalPrice: number): UsePromoCodeReturn {
  const promoResult = useCartStore((s) => s.promoResult);
  const setPromoResult = useCartStore((s) => s.setPromoResult);
  const clearPromo = useCartStore((s) => s.clearPromo);

  const [promoCode, setPromoCode] = useState(promoResult?.code ?? '');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await fetchClient<PromoResult>('/promo-codes/validate', {
        method: 'POST',
        body: JSON.stringify({ code: promoCode.trim().toUpperCase(), cartTotal: totalPrice }),
      });
      if (!res.success) {
        setPromoResult(null);
        setPromoError(res.error?.message ?? 'Не удалось проверить промокод');
        return;
      }
      if (res.data?.valid) {
        setPromoResult(res.data);
        setPromoError(null);
      } else {
        setPromoResult(null);
        setPromoError(res.data?.message ?? 'Промокод недействителен');
      }
    } catch {
      setPromoError('Не удалось проверить промокод');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    clearPromo();
    setPromoCode('');
    setPromoError(null);
  };

  const finalPrice = promoResult ? Math.max(0, totalPrice - promoResult.discountAmount) : totalPrice;

  return {
    promoCode,
    setPromoCode,
    promoLoading,
    promoError,
    promoResult,
    finalPrice,
    handleApplyPromo,
    handleRemovePromo,
  };
}
