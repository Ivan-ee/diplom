'use client';

import { useState, useCallback } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  // Returns integer grams — same unit convention as ProductCard and constructor-store.
  if (product.weightOptions && product.weightOptions.length > 0) {
    return product.weightOptions;
  }
  // minWeight/maxWeight/weightStep are string kg from the API (e.g. '1.0').
  // weightMin/weightMax are numeric grams from the API (e.g. 1000).
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
  // weightG is integer grams; convert to kg before multiplying by pricePerKg.
  if (product.pricePerKg) {
    return Math.round(product.pricePerKg * (weightG / 1000));
  }
  return product.priceMin ?? 0;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const isPerUnit = product.priceType === 'per_unit';
  const weightOptions = isPerUnit ? [] : buildWeightOptions(product);
  /** selectedWeight is stored as integer grams */
  const [selectedWeight, setSelectedWeight] = useState(weightOptions[0] ?? 1000);
  const [inscription, setInscription] = useState('');
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const price = calcPrice(product, selectedWeight);
  const categoryName = typeof product.category === 'object' && product.category !== null
    ? product.category.name
    : (product.category ?? '');
  const categorySlug = typeof product.category === 'object' && product.category !== null
    ? product.category.slug
    : (product.type ?? '');
  const categoryLabel = categoryLabels[categorySlug] ?? categoryName;

  const handleAddToCart = useCallback(() => {
    addItem({
      type: 'product',
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl ?? product.images?.[0] ?? '',
      weight: isPerUnit ? Math.round(parseFloat(product.minWeight ?? '0') * 1000) : selectedWeight,
      price,
      inscription: inscription.trim() || undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }, [addItem, product, isPerUnit, selectedWeight, price, inscription]);

  return (
    <div className="flex flex-col gap-6">
      {/* Category badge */}
      {categoryLabel && (
        <div>
          <Badge variant="secondary">{categoryLabel}</Badge>
        </div>
      )}

      {/* Name */}
      <h1 className="font-heading font-bold text-3xl lg:text-4xl text-[var(--color-dark)] leading-tight">
        {product.name}
      </h1>

      {/* Price */}
      <div className="flex items-baseline gap-2">
        <span className="font-heading font-bold text-3xl text-[var(--color-dusty-rose)]">
          {formatPrice(price)}
        </span>
        {isPerUnit ? (
          <span className="text-sm text-[var(--color-text-secondary)]">за штуку</span>
        ) : weightOptions.length > 1 ? (
          <span className="text-sm text-[var(--color-text-secondary)]">
            за {(selectedWeight / 1000).toLocaleString('ru-RU')} кг
          </span>
        ) : null}
      </div>

      {/* Description */}
      {product.description && (
        <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm">
          {product.description}
        </p>
      )}

      {/* Weight selector */}
      {weightOptions.length > 1 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-[var(--color-dark)]">
            Вес торта
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Выбор веса">
            {weightOptions.map((w) => (
              <button
                key={w}
                onClick={() => setSelectedWeight(w)}
                aria-pressed={w === selectedWeight}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                  w === selectedWeight
                    ? 'bg-[var(--color-dusty-rose)] text-white border-[var(--color-dusty-rose)] shadow-sm'
                    : 'bg-white text-[var(--color-dark)] border-gray-200 hover:border-[var(--color-dusty-rose)] hover:text-[var(--color-dusty-rose)]'
                }`}
              >
                {(w / 1000).toLocaleString('ru-RU')} кг
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inscription input */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="inscription"
          className="text-sm font-semibold text-[var(--color-dark)]"
        >
          Надпись на торте{' '}
          <span className="font-normal text-[var(--color-text-secondary)]">(необязательно)</span>
        </label>
        <div className="relative">
          <input
            id="inscription"
            type="text"
            value={inscription}
            onChange={(e) => setInscription(e.target.value.slice(0, 50))}
            placeholder="Например: С днём рождения, Аня!"
            maxLength={50}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-[var(--color-dark)] placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-dusty-rose)] focus:ring-1 focus:ring-[var(--color-dusty-rose)] transition-colors duration-200 pr-14"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-secondary)] select-none pointer-events-none">
            {inscription.length}/50
          </span>
        </div>
      </div>

      {/* Add to cart */}
      <div className="flex flex-col gap-3 pt-2">
        <Button
          size="lg"
          onClick={handleAddToCart}
          disabled={product.isAvailable === false}
          className={`w-full transition-all duration-300 ${added ? 'bg-[var(--color-success)] hover:bg-[var(--color-success)]' : ''}`}
        >
          {added ? (
            <>
              <Check size={18} />
              Добавлено в корзину
            </>
          ) : (
            <>
              <ShoppingCart size={18} />
              В корзину — {formatPrice(price)}
            </>
          )}
        </Button>

        {product.isAvailable === false && (
          <p className="text-center text-sm text-[var(--color-text-secondary)]">
            Этот товар временно недоступен
          </p>
        )}
      </div>

      {/* Availability note */}
      {product.isAvailable !== false && (
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          Самовывоз из кондитерской: г. Арзамас, ул. Ленина, д. 15
          <br />
          Готовность: уточняется при оформлении заказа
        </p>
      )}
    </div>
  );
}
