'use client';

import { useState } from 'react';
import { ShoppingCart, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConstructorStore, type ConstructorStep } from '@/stores/constructor-store';
import { useCartStore } from '@/stores/cart-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fetchClient } from '@/lib/api';
import { glRef } from '@/lib/screenshot-ref';

const SCREENSHOT_FALLBACK = '/images/custom-cake.jpg';

interface PresignData {
  uploadUrl: string;
  fileUrl: string;
  objectName: string;
  bucket: string;
  expiresIn: number;
}

/**
 * Takes a screenshot of the current R3F canvas, uploads it to MinIO via the
 * presign endpoint, and returns the public file URL.
 * Throws if any step fails — caller handles the fallback.
 */
async function captureAndUpload(): Promise<string> {
  const renderer = glRef.current;
  if (!renderer) throw new Error('WebGL renderer not available');

  const dataUrl = renderer.domElement.toDataURL('image/png');

  // Convert data URL to Blob
  const res = await fetch(dataUrl);
  const blob = await res.blob();

  const filename = `cake-screenshot-${Date.now()}.png`;

  // Get presigned PUT URL from our backend
  const presignRes = await fetchClient<PresignData>('/upload/presign', {
    method: 'POST',
    body: JSON.stringify({ filename, bucket: 'screenshots' }),
  });

  const { uploadUrl, fileUrl } = presignRes.data;

  // PUT the blob directly to MinIO — no auth header needed for presigned URLs
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': 'image/png' },
  });

  if (!uploadRes.ok) {
    throw new Error(`MinIO upload failed: ${uploadRes.status}`);
  }

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

  const [isCapturing, setIsCapturing] = useState(false);

  const isValid = useStepValid();
  const isFirst = currentStep === 1;
  const isLast = currentStep === 5;

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
        layers,
        coating,
        decorations,
        inscription,
      },
    });

    setIsCapturing(false);
  };

  return (
    <div className="px-4 py-3 bg-white border-t border-neutral-200 flex items-center gap-3">
      <Button
        variant="ghost"
        size="default"
        onClick={handleBack}
        disabled={isFirst}
        className={cn('flex-shrink-0 text-neutral-500', isFirst && 'opacity-0 pointer-events-none')}
        aria-label="Назад"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        Назад
      </Button>

      <Button
        variant="default"
        size="default"
        onClick={handleNext}
        disabled={!isValid || isCapturing}
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
            {isCapturing ? 'Сохранение...' : 'Добавить в корзину'}
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
