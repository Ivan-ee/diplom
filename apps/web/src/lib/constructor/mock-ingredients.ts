import type { Ingredients } from '@/stores/constructor-store';

export function getMockIngredients(): Ingredients {
  return {
    bases: [
      {
        id: 'base-vanilla',
        name: 'Ванильный бисквит',
        description: 'Классический нежный бисквит с ароматом ванили',
        pricePerKg: 80000,
        color: '#FFF8E7',
        available: true,
      },
      {
        id: 'base-chocolate',
        name: 'Шоколадный бисквит',
        description: 'Насыщенный бисквит на бельгийском какао',
        pricePerKg: 90000,
        color: '#5C3D2E',
        available: true,
      },
      {
        id: 'base-red-velvet',
        name: 'Красный бархат',
        description: 'Бархатистый бисквит с характерным красным цветом',
        pricePerKg: 100000,
        color: '#C0392B',
        available: true,
      },
    ],

    fillings: [
      {
        id: 'filling-strawberry',
        name: 'Клубничный крем',
        description: 'Нежный крем-чиз с клубничным пюре',
        pricePerKg: 40000,
        available: true,
      },
      {
        id: 'filling-chocolate',
        name: 'Шоколадный ганаш',
        description: 'Шёлковый ганаш из тёмного шоколада',
        pricePerKg: 45000,
        available: true,
      },
      {
        id: 'filling-caramel',
        name: 'Солёная карамель',
        description: 'Домашняя карамель с щепоткой морской соли',
        pricePerKg: 50000,
        available: true,
      },
    ],

    coatings: [
      {
        id: 'coating-cream',
        type: 'cream',
        name: 'Крем-чиз',
        pricePerKg: 20000,
        available: true,
      },
      {
        id: 'coating-fondant',
        type: 'fondant',
        name: 'Мастика',
        pricePerKg: 35000,
        available: true,
      },
    ],

    decorations: [
      {
        id: 'decor-strawberry',
        name: 'Клубника',
        category: 'Ягоды',
        pricePerUnit: 5000,
        available: true,
      },
      {
        id: 'decor-blueberry',
        name: 'Черника',
        category: 'Ягоды',
        pricePerUnit: 5000,
        available: true,
      },
      {
        id: 'decor-raspberry',
        name: 'Малина',
        category: 'Ягоды',
        pricePerUnit: 6000,
        available: true,
      },
      {
        id: 'decor-choco-drip',
        name: 'Шоколадные подтёки',
        category: 'Шоколад',
        pricePerUnit: 8000,
        available: true,
      },
      {
        id: 'decor-choco-figure',
        name: 'Шоколадные фигурки',
        category: 'Шоколад',
        pricePerUnit: 12000,
        available: true,
      },
      {
        id: 'decor-topper-star',
        name: 'Топпер «Звезда»',
        category: 'Топперы',
        pricePerUnit: 15000,
        available: true,
      },
      {
        id: 'decor-topper-heart',
        name: 'Топпер «Сердце»',
        category: 'Топперы',
        pricePerUnit: 15000,
        available: true,
      },
      {
        id: 'decor-rose',
        name: 'Роза из крема',
        category: 'Цветы',
        pricePerUnit: 10000,
        available: true,
      },
      {
        id: 'decor-lily',
        name: 'Лилия из мастики',
        category: 'Цветы',
        pricePerUnit: 20000,
        available: true,
      },
      {
        id: 'decor-figurine',
        name: 'Фигурка из мастики',
        category: 'Фигурки',
        pricePerUnit: 18000,
        available: true,
      },
    ],

    shapes: [
      { id: 'circle', name: 'Круглый', surchargePercent: 0 },
      { id: 'square', name: 'Квадратный', surchargePercent: 10 },
      { id: 'heart', name: 'Сердце', surchargePercent: 15 },
    ],

    tierSurcharges: [
      { tierCount: 1, surcharge: 0 },
      { tierCount: 2, surcharge: 30000 },
      { tierCount: 3, surcharge: 60000 },
    ],

    config: {
      maxDecorations: 20,
      maxInscriptionLength: 50,
      minWeightPerTier: 500,
      maxWeightPerTier: 5000,
      weightStep: 500,
    },
  };
}
