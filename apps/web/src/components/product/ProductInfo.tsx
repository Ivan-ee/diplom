'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, Check, ShoppingCart } from 'lucide-react';
import { Chip, Button, Disclosure } from '@heroui/react';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/stores/cart-store';
import { type Product } from '@/components/catalog/ProductCard';

interface ProductInfoProps {
  product: Product;
}

const categoryLabels: Record<string, string> = {
  cake: 'Торт',
  cupcake: 'Капкейк',
  macaron: 'Макарон',
  pastry: 'Выпечка',
};

function buildWeightOptions(product: Product): number[] {
  if (product.weightOptions && product.weightOptions.length > 0) {
    return product.weightOptions;
  }
  const minKg = product.minWeight
    ? parseFloat(product.minWeight)
    : product.weightMin != null
      ? product.weightMin / 1000
      : 1;
  const maxKg = product.maxWeight
    ? parseFloat(product.maxWeight)
    : product.weightMax != null
      ? product.weightMax / 1000
      : minKg;
  const stepKg = product.weightStep ? parseFloat(product.weightStep) : 0.5;
  const opts: number[] = [];
  for (let wKg = minKg; wKg <= maxKg + 1e-9; wKg += stepKg) {
    opts.push(Math.round(wKg * 1000));
  }
  if (opts.length === 0) opts.push(Math.round(minKg * 1000));
  const maxG = Math.round(maxKg * 1000);
  if (!opts.includes(maxG)) opts.push(maxG);
  return opts;
}

function calcPrice(product: Product, weightG: number): number {
  if (product.priceType === 'per_unit') {
    return product.pricePerUnit ?? 0;
  }
  if (product.pricePerKg) {
    return Math.round(product.pricePerKg * (weightG / 1000));
  }
  return product.priceMin ?? 0;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const isPerUnit = product.priceType === 'per_unit';
  const weightOptions = isPerUnit ? [] : buildWeightOptions(product);
  const [selectedWeight, setSelectedWeight] = useState(weightOptions[0] ?? 1000);
  const [inscription, setInscription] = useState('');
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const price = calcPrice(product, selectedWeight);

  const categoryName =
    typeof product.category === 'object' && product.category !== null
      ? product.category.name
      : (product.category ?? '');
  const categorySlug =
    typeof product.category === 'object' && product.category !== null
      ? product.category.slug
      : (product.type ?? '');
  const categoryLabel = categoryLabels[categorySlug] ?? categoryName;

  const weightDisplay = product.weightMin
    ? `${parseFloat(product.minWeight ?? String(product.weightMin / 1000)).toLocaleString('ru-RU')} кг`
    : null;
  const hasDetails = !!(product.composition || weightDisplay);

  const handleAddToCart = useCallback(() => {
    addItem({
      type: 'product',
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl ?? product.images?.[0] ?? '',
      weight: isPerUnit
        ? Math.round(parseFloat(product.minWeight ?? '0') * 1000)
        : selectedWeight,
      price,
      inscription: inscription.trim() || undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }, [addItem, product, isPerUnit, selectedWeight, price, inscription]);

  return (
    <div className="flex flex-col">
      {/* Category chip */}
      {categoryLabel && (
        <div className="mb-4">
          <Chip size="sm" variant="soft" className="text-xs font-medium">
            {categoryLabel}
          </Chip>
        </div>
      )}

      {/* Name */}
      <h1 className="text-3xl lg:text-4xl font-bold tracking-tight font-heading text-[var(--color-graphite)] leading-tight">
        {product.name}
      </h1>

      {/* Price */}
      <div className="flex items-baseline gap-2 mt-3">
        <span className="text-2xl lg:text-3xl font-semibold text-[var(--color-caramel)]">
          {formatPrice(price)}
        </span>
        {isPerUnit ? (
          <span className="text-sm text-[var(--color-graphite-light)]/60">за штуку</span>
        ) : weightOptions.length > 1 ? (
          <span className="text-sm text-[var(--color-graphite-light)]/60">
            за {(selectedWeight / 1000).toLocaleString('ru-RU')} кг
          </span>
        ) : null}
      </div>

      {/* Description */}
      {product.description && (
        <p className="text-base text-[var(--color-graphite-light)] leading-relaxed mt-6">
          {product.description}
        </p>
      )}

      {/* Divider */}
      <div className="border-t border-[var(--color-champagne)] my-6" />

      {/* Buy block */}
      <div className="bg-[var(--color-warm-ivory)]/50 p-6 rounded-2xl border border-[var(--color-champagne)]/60">
        {/* Weight selector */}
        {weightOptions.length > 1 && (
          <div className="flex flex-col gap-3 mb-6">
            <p className="text-sm font-semibold text-[var(--color-graphite)]">Вес торта</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Выбор веса">
              {weightOptions.map((w) => (
                <button
                  key={w}
                  onClick={() => setSelectedWeight(w)}
                  aria-pressed={w === selectedWeight}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                    w === selectedWeight
                      ? 'bg-[var(--color-caramel)] text-white border-[var(--color-caramel)] shadow-sm'
                      : 'bg-white text-[var(--color-graphite)] border-[var(--color-champagne)] hover:border-[var(--color-caramel)] hover:text-[var(--color-caramel)]'
                  }`}
                >
                  {(w / 1000).toLocaleString('ru-RU')} кг
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Inscription input */}
        <div className="flex flex-col gap-2 mb-6">
          <label
            htmlFor="inscription"
            className="text-sm font-semibold text-[var(--color-graphite)]"
          >
            Надпись на торте{' '}
            <span className="font-normal text-[var(--color-graphite-light)]/60">(необязательно)</span>
          </label>
          <div className="relative">
            <input
              id="inscription"
              type="text"
              value={inscription}
              onChange={(e) => setInscription(e.target.value.slice(0, 50))}
              placeholder="Например: С днём рождения, Аня!"
              maxLength={50}
              className="w-full rounded-xl border border-[var(--color-champagne)] px-4 py-3 text-sm text-[var(--color-graphite)] placeholder:text-[var(--color-graphite-light)]/60 focus:outline-none focus:border-[var(--color-caramel)] focus:ring-1 focus:ring-[var(--color-caramel)] transition-colors duration-200 pr-14"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-graphite-light)]/60 select-none pointer-events-none">
              {inscription.length}/50
            </span>
          </div>
        </div>

        {/* Add to cart button */}
        <Button
          onPress={handleAddToCart}
          isDisabled={product.isAvailable === false}
          className={`w-full rounded-xl h-12 text-base font-medium text-white transition-all duration-300 cursor-pointer ${
            added
              ? 'bg-emerald-500 hover:bg-emerald-500'
              : 'bg-[var(--color-caramel)] hover:bg-[var(--color-caramel-hover)]'
          }`}
        >
          {added ? (
            <span className="flex items-center justify-center gap-2">
              <Check size={18} />
              Добавлено
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <ShoppingCart size={18} />
              В корзину — {formatPrice(price)}
            </span>
          )}
        </Button>

        {product.isAvailable === false && (
          <p className="text-center text-sm text-[var(--color-graphite-light)]/60 mt-3">
            Этот товар временно недоступен
          </p>
        )}
      </div>

      {/* Details disclosure — shown when product has both description and weight */}
      {hasDetails && (
        <div className="mt-6">
          <Disclosure className="border-t border-[var(--color-champagne)]">
            <Disclosure.Heading>
              <Disclosure.Trigger className="flex w-full items-center justify-between py-4 text-sm font-semibold text-[var(--color-graphite)] hover:text-[var(--color-caramel)] transition-colors duration-200 cursor-pointer">
                Состав и детали
                <Disclosure.Indicator className="transition-transform duration-200 data-[open]:rotate-180">
                  <ChevronDown size={16} />
                </Disclosure.Indicator>
              </Disclosure.Trigger>
            </Disclosure.Heading>
            <Disclosure.Content>
              <Disclosure.Body className="pb-4 flex flex-col gap-2 text-sm text-[var(--color-graphite-light)] leading-relaxed">
                {weightDisplay && (
                  <p>
                    <span className="font-medium text-[var(--color-graphite)]">Вес: </span>
                    {weightDisplay}
                  </p>
                )}
                {product.composition && (
                  <p>
                    <span className="font-medium text-[var(--color-graphite)]">Состав: </span>
                    {product.composition}
                  </p>
                )}
              </Disclosure.Body>
            </Disclosure.Content>
          </Disclosure>
        </div>
      )}

      {/* Pickup info */}
      {product.isAvailable !== false && (
        <p className="text-xs text-[var(--color-graphite-light)]/60 leading-relaxed mt-6">
          Самовывоз из кондитерской: г. Арзамас, ул. Ленина, д. 15
          <br />
          Готовность: уточняется при оформлении заказа
        </p>
      )}
    </div>
  );
}
