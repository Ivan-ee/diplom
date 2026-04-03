'use client';

import { ShoppingCart, ArrowLeft, ArrowRight } from 'lucide-react';
import { useConstructorStore, type ConstructorStep } from '@/stores/constructor-store';
import { useCartStore } from '@/stores/cart-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function useStepValid(): boolean {
  const currentStep = useConstructorStore((s) => s.currentStep);
  const shape = useConstructorStore((s) => s.shape);
  const layers = useConstructorStore((s) => s.layers);
  const coating = useConstructorStore((s) => s.coating);

  switch (currentStep) {
    case 1:
      return !!shape;
    case 2:
      return layers.every((l) => !!l.baseId && l.weight > 0);
    case 3:
      return layers.every((l) => !!l.fillingId);
    case 4:
      return !!coating.coatingId && !!coating.color;
    case 5:
      return true;
    default:
      return true;
  }
}

export function StepNavigation() {
  const currentStep = useConstructorStore((s) => s.currentStep);
  const setStep = useConstructorStore((s) => s.setStep);
  const totalPrice = useConstructorStore((s) => s.totalPrice);
  const layers = useConstructorStore((s) => s.layers);
  const shape = useConstructorStore((s) => s.shape);
  const tierCount = useConstructorStore((s) => s.tierCount);
  const coating = useConstructorStore((s) => s.coating);
  const decorations = useConstructorStore((s) => s.decorations);
  const inscription = useConstructorStore((s) => s.inscription);
  const ingredients = useConstructorStore((s) => s.ingredients);
  const addItem = useCartStore((s) => s.addItem);

  const isValid = useStepValid();
  const isFirst = currentStep === 1;
  const isLast = currentStep === 5;

  const handleBack = () => {
    if (!isFirst) setStep((currentStep - 1) as ConstructorStep);
  };

  const handleNext = () => {
    if (isLast) {
      handleAddToCart();
    } else {
      setStep((currentStep + 1) as ConstructorStep);
    }
  };

  const handleAddToCart = () => {
    const totalWeight = layers.reduce((sum, l) => sum + l.weight, 0);

    const baseName = ingredients?.bases.find((b) => b.id === layers[0]?.baseId)?.name ?? 'Торт';
    const tierLabel = tierCount > 1 ? `, ${tierCount} яруса` : '';
    const name = `${baseName}${tierLabel}`;

    addItem({
      type: 'constructor',
      name,
      imageUrl: '/images/custom-cake.jpg',
      weight: totalWeight,
      price: totalPrice,
      inscription: inscription || undefined,
      cakeConfig: {
        shape,
        tierCount,
        layers,
        coating,
        decorations,
        inscription,
      },
    });
  };

  return (
    <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-3">
      <Button
        variant="ghost"
        size="default"
        onClick={handleBack}
        disabled={isFirst}
        className={cn('flex-shrink-0', isFirst && 'opacity-0 pointer-events-none')}
        aria-label="Назад"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        Назад
      </Button>

      <Button
        variant="default"
        size="default"
        onClick={handleNext}
        disabled={!isValid}
        className={cn(
          'flex-1 font-semibold transition-all duration-200',
          isLast && 'bg-[var(--color-dusty-rose)] hover:bg-[var(--color-dusty-rose-hover)] gap-2'
        )}
        aria-label={isLast ? 'Добавить в корзину' : 'Далее'}
      >
        {isLast ? (
          <>
            <ShoppingCart size={16} strokeWidth={2} />
            Добавить в корзину
          </>
        ) : (
          <>
            Далее
            <ArrowRight size={16} strokeWidth={2} />
          </>
        )}
      </Button>
    </div>
  );
}
