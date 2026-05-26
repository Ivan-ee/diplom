'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConstructorStore, type ConstructorStep } from '@/stores/constructor-store';
import { useCartStore } from '@/stores/cart-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { uploadFileToMinio } from '@/lib/upload';
import { glRef } from '@/lib/screenshot-ref';
import { ConstructorSuccessModal } from '@/components/constructor/ConstructorSuccessModal';

const SCREENSHOT_FALLBACK = '/images/custom-cake.jpg';

/**
 * Takes a screenshot of the current R3F canvas, uploads it to MinIO via the
 * presign endpoint, and returns the public file URL.
 * Throws if any step fails — caller handles the fallback.
 */
async function captureAndUpload(): Promise<string> {
  const renderer = glRef.current;
  if (!renderer) throw new Error('WebGL renderer not available');

  const dataUrl = renderer.domElement.toDataURL('image/png');
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], `cake-screenshot-${Date.now()}.png`, { type: 'image/png' });

  const { fileUrl } = await uploadFileToMinio({ file, bucket: 'screenshots' });
  return fileUrl;
}

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
      return !!coating.coatingId && !!coating.glazeVariant;
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
  const activeDecorations = useConstructorStore((s) => s.activeDecorations);
  const selectedDecorations = useConstructorStore((s) => s.selectedDecorations);
  const decorationInstances = useConstructorStore((s) => s.decorationInstances);
  const inscription = useConstructorStore((s) => s.inscription);
  const pricingStatus = useConstructorStore((s) => s.pricingStatus);
  const ingredients = useConstructorStore((s) => s.ingredients);
  const reset = useConstructorStore((s) => s.reset);
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  const [isCapturing, setIsCapturing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    screenshot?: string;
    summary: string;
    price: number;
  }>({ summary: '', price: 0 });

  const buildConfigSummary = (): string => {
    const parts: string[] = [];

    const shapeLabel: Record<string, string> = {
      circle: 'Круглый',
      square: 'Квадратный',
      heart: 'Сердце',
    };
    parts.push(shapeLabel[shape] ?? shape);

    const tierWord = tierCount === 1 ? 'ярус' : tierCount < 5 ? 'яруса' : 'ярусов';
    parts.push(`${tierCount} ${tierWord}`);

    const firstFilling = layers[0]?.fillingId
      ? ingredients?.fillings.find((f) => f.id === layers[0].fillingId)?.name
      : undefined;
    if (firstFilling) parts.push(firstFilling);

    const coatingName = coating.coatingId
      ? ingredients?.coatings.find((c) => c.id === coating.coatingId)?.name
      : undefined;
    if (coatingName) parts.push(coatingName);

    return parts.join(' · ');
  };

  const isValid = useStepValid();
  const isFirst = currentStep === 1;
  const isLast = currentStep === 5;
  const isPriceVerified = pricingStatus === 'verified';

  const handleBack = () => {
    if (!isFirst) setStep((currentStep - 1) as ConstructorStep);
  };

  const handleNext = () => {
    if (isLast) {
      void handleAddToCart();
    } else {
      setStep((currentStep + 1) as ConstructorStep);
    }
  };

  const handleAddToCart = async () => {
    setIsCapturing(true);

    let imageUrl = SCREENSHOT_FALLBACK;
    try {
      imageUrl = await captureAndUpload();
    } catch (err) {
      console.warn('[StepNavigation] Screenshot upload failed, using fallback image:', err);
      toast.error('Не удалось загрузить скриншот торта. Используем стандартное изображение.');
    }

    const totalWeight = layers.reduce((sum, l) => sum + l.weight, 0);
    const baseName = ingredients?.bases.find((b) => b.id === layers[0]?.baseId)?.name ?? 'Торт';
    const tierLabel = tierCount > 1 ? `, ${tierCount} яруса` : '';
    const name = `${baseName}${tierLabel}`;

    addItem({
      type: 'constructor',
      name,
      imageUrl,
      weight: totalWeight,
      price: totalPrice,
      inscription: inscription || undefined,
      cakeConfig: {
        shape,
        tierCount,
        layers: layers.map((layer) => ({
          ...layer,
          baseName: ingredients?.bases.find((base) => base.id === layer.baseId)?.name,
          fillingName: ingredients?.fillings.find((filling) => filling.id === layer.fillingId)?.name,
        })),
        coating: {
          ...coating,
          coatingName: ingredients?.coatings.find((item) => item.id === coating.coatingId)?.name,
        },
        activeDecorations,
        selectedDecorations: selectedDecorations.map((selection) => ({
          ...selection,
          name: ingredients?.decorations.find((item) => item.id === selection.decorationId)?.name,
        })),
        decorationInstances: decorationInstances.map((instance) => ({
          ...instance,
          name: ingredients?.decorations.find((item) => item.id === instance.decorationId)?.name,
        })),
        hasCandle: false,
        inscription,
      },
    });

    setIsCapturing(false);

    const screenshotUrl = imageUrl !== SCREENSHOT_FALLBACK ? imageUrl : undefined;
    setSuccessData({
      screenshot: screenshotUrl,
      summary: buildConfigSummary(),
      price: totalPrice,
    });
    setShowSuccess(true);
  };

  const handleGoToCart = () => {
    setShowSuccess(false);
    router.push('/cart');
  };

  const handleBuildAnother = () => {
    setShowSuccess(false);
    reset();
  };

  return (
    <>
    <ConstructorSuccessModal
      isOpen={showSuccess}
      onClose={() => setShowSuccess(false)}
      onGoToCart={handleGoToCart}
      onBuildAnother={handleBuildAnother}
      screenshotUrl={successData.screenshot}
      configSummary={successData.summary}
      totalPrice={successData.price}
    />
    <div className="px-4 py-3 bg-[var(--surface-elevated)] border-t border-[var(--border-default)] flex items-center gap-3">
      <Button
        variant="ghost"
        size="default"
        onClick={handleBack}
        disabled={isFirst}
        className={cn('flex-shrink-0 text-[var(--color-graphite-light)]', isFirst && 'opacity-0 pointer-events-none')}
        aria-label="Назад"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        Назад
      </Button>

      <Button
        variant="default"
        size="default"
        onClick={handleNext}
        disabled={!isValid || isCapturing || (isLast && !isPriceVerified)}
        className={cn(
          'flex-1 font-semibold rounded-xl transition-all duration-200 bg-[var(--color-caramel)] hover:bg-[var(--color-caramel-hover)] text-white',
          isLast && 'gap-2'
        )}
        aria-label={isLast ? 'Добавить в корзину' : 'Далее'}
      >
        {isLast ? (
          <>
            {isCapturing ? (
              <Loader2 size={16} strokeWidth={2} className="animate-spin" />
            ) : (
              <ShoppingCart size={16} strokeWidth={2} />
            )}
            {isCapturing ? 'Сохранение...' : isPriceVerified ? 'Добавить в корзину' : 'Ждём цену'}
          </>
        ) : (
          <>
            Далее
            <ArrowRight size={16} strokeWidth={2} />
          </>
        )}
      </Button>
    </div>
    </>
  );
}
