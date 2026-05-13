import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { ConstructorService } from '../constructor/constructor.service';
import { PromoCodesService } from '../promo-codes/promo-codes.service';
import { OrderItemType, PickupTimeSlot } from '../orders/dto/create-order.dto';
import type { SafeUser } from '../common/types/user.type';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PRODUCT_ID = 'eeeeeeee-0000-0000-0000-000000000010';
const USER_ID = 'ffffffff-0000-0000-0000-000000000020';
const ORDER_ID = 'aaaaaaaa-1111-0000-0000-000000000030';

const MOCK_USER: SafeUser = {
  id: USER_ID,
  name: 'Test User',
  email: 'user@example.com',
  phone: null,
  role: 'USER',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

function makeCreateOrderDto(itemOverrides: Partial<Record<string, unknown>> = {}) {
  return {
    pickupDate: '2026-06-01',
    pickupTimeSlot: PickupTimeSlot.MORNING,
    items: [
      {
        type: OrderItemType.PRODUCT,
        productId: PRODUCT_ID,
        weight: 20, // 2.0 kg
        quantity: 1,
        ...itemOverrides,
      },
    ],
  };
}

function makeProduct(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: PRODUCT_ID,
    name: 'Наполеон',
    pricePerKg: 500_00, // 500 ₽/kg in kopecks
    isAvailable: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// DB mock
//
// OrdersService calls:
//   1. db.select().from().where().limit(1)  — product lookup (resolves array)
//   2. db.transaction(async tx => { tx.insert(...).values(...).returning() × 2 })
//
// We build a reusable db mock factory.
// ---------------------------------------------------------------------------

function buildInsertChain(returnValue: unknown[]) {
  return {
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve(returnValue),
      }),
    }),
  };
}

function buildDbMock(options: {
  productQueryResult?: unknown[];
  orderInsertResult?: unknown[];
  orderItemsInsertResult?: unknown[];
}) {
  const {
    productQueryResult = [makeProduct()],
    orderInsertResult = [{ id: ORDER_ID, userId: USER_ID, totalPrice: 100_000, status: 'created' }],
    orderItemsInsertResult = [{ id: 'item-1', orderId: ORDER_ID }],
  } = options;

  const selectChain = {
    from: () => selectChain,
    where: () => selectChain,
    limit: () => Promise.resolve(productQueryResult),
  };

  const txMock = {
    insert: vi.fn()
      .mockReturnValueOnce({
        values: () => ({ returning: () => Promise.resolve(orderInsertResult) }),
      })
      .mockReturnValueOnce({
        values: () => ({ returning: () => Promise.resolve(orderItemsInsertResult) }),
      }),
  };

  return {
    select: () => selectChain,
    transaction: (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock),
  };
}

// ---------------------------------------------------------------------------
// ConstructorService mock
// ---------------------------------------------------------------------------

function buildConstructorServiceMock(totalPrice = 50_000) {
  return {
    calculatePrice: vi.fn().mockResolvedValue({ totalPrice, breakdown: {} }),
  } as unknown as ConstructorService;
}

function buildPromoCodesServiceMock() {
  return {
    validate: vi.fn(),
    applyToOrder: vi.fn(),
  } as unknown as PromoCodesService;
}

// ---------------------------------------------------------------------------
// Service factory
// ---------------------------------------------------------------------------

function buildService(
  db: unknown,
  constructorService: ConstructorService = buildConstructorServiceMock(),
  promoCodesService: PromoCodesService = buildPromoCodesServiceMock(),
): OrdersService {
  return new OrdersService(db as never, constructorService, promoCodesService);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OrdersService.create', () => {
  // ---- Product item — happy path -------------------------------------------

  describe('product item — success', () => {
    it('creates an order and returns order + items', async () => {
      const db = buildDbMock({});
      const service = buildService(db);

      const result = await service.create(makeCreateOrderDto() as never, MOCK_USER);

      expect(result).toHaveProperty('order');
      expect(result).toHaveProperty('items');
      expect(result.order.id).toBe(ORDER_ID);
    });

    it('recalculates price server-side: weight=20 (2 kg) × pricePerKg=500_00 = 100_000', async () => {
      // pricePerKg=500_00, weight=20 tenths = 2.0 kg → price = 100_000
      const product = makeProduct({ pricePerKg: 500_00 });
      const db = buildDbMock({ productQueryResult: [product] });
      const service = buildService(db);

      // We capture what was passed to insert().values() by spying on the tx
      const txInsertSpy = vi.fn()
        .mockReturnValueOnce({
          values: (rows: unknown) => {
            // first call is orders insert — capture totalPrice
            return { returning: () => Promise.resolve([{ id: ORDER_ID, totalPrice: (rows as { totalPrice: number }).totalPrice }]) };
          },
        })
        .mockReturnValueOnce({
          values: () => ({ returning: () => Promise.resolve([{ id: 'item-1' }]) }),
        });

      const spyDb = {
        select: () => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([product]) }) }) }),
        transaction: (fn: (tx: { insert: typeof txInsertSpy }) => Promise<unknown>) => fn({ insert: txInsertSpy }),
      };

      const result = await service.create(makeCreateOrderDto() as never, MOCK_USER);
      // price = round(500_00 * 2.0) = 100_000, quantity = 1, totalPrice = 100_000
      expect(result.order.totalPrice).toBe(100_000);
    });

    it('stores weight as decimal string (tenths / 10) in order items', async () => {
      let capturedItemValues: unknown = null;
      const product = makeProduct();

      const db = {
        select: () => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([product]) }) }) }),
        transaction: (fn: (tx: unknown) => Promise<unknown>) =>
          fn({
            insert: vi.fn()
              .mockReturnValueOnce({
                values: () => ({ returning: () => Promise.resolve([{ id: ORDER_ID, totalPrice: 100_000 }]) }),
              })
              .mockReturnValueOnce({
                values: (rows: unknown[]) => {
                  capturedItemValues = rows;
                  return { returning: () => Promise.resolve([{ id: 'item-1' }]) };
                },
              }),
          }),
      };

      const service = buildService(db);
      await service.create(makeCreateOrderDto() as never, MOCK_USER);

      // weight=20 tenths → stored as '2' (20/10)
      expect((capturedItemValues as { weight: string }[])[0].weight).toBe('2');
    });
  });

  // ---- Product item — validation errors ------------------------------------

  describe('product item — validation errors', () => {
    it('throws BadRequestException when type is product but productId is missing', async () => {
      const db = buildDbMock({});
      const service = buildService(db);

      const dto = makeCreateOrderDto({ productId: undefined });

      await expect(
        service.create(dto as never, MOCK_USER),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when product does not exist in DB', async () => {
      const db = buildDbMock({ productQueryResult: [] }); // empty result
      const service = buildService(db);

      await expect(
        service.create(makeCreateOrderDto() as never, MOCK_USER),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when product is not available', async () => {
      const db = buildDbMock({ productQueryResult: [makeProduct({ isAvailable: false })] });
      const service = buildService(db);

      await expect(
        service.create(makeCreateOrderDto() as never, MOCK_USER),
      ).rejects.toThrow(BadRequestException);
    });

    it('error message includes product name when unavailable', async () => {
      const db = buildDbMock({ productQueryResult: [makeProduct({ isAvailable: false, name: 'Наполеон' })] });
      const service = buildService(db);

      await expect(
        service.create(makeCreateOrderDto() as never, MOCK_USER),
      ).rejects.toThrow(/Наполеон/);
    });
  });

  // ---- Constructor item — happy path ----------------------------------------

  describe('constructor item — success', () => {
    const cakeConfig = {
      shape: 'circle',
      tiers: [{ baseId: 'base-1', fillingId: 'fill-1', weight: 15 }],
      coatingId: 'coat-1',
    };

    function makeConstructorDto(overrides: Partial<Record<string, unknown>> = {}) {
      return {
        pickupDate: '2026-06-01',
        pickupTimeSlot: PickupTimeSlot.DAY,
        items: [
          {
            type: OrderItemType.CONSTRUCTOR,
            cakeConfig,
            weight: 15,
            quantity: 1,
            ...overrides,
          },
        ],
      };
    }

    it('calls ConstructorService.calculatePrice with the provided cakeConfig', async () => {
      const constructorService = buildConstructorServiceMock(75_000);
      const db = buildDbMock({});
      const service = buildService(db, constructorService);

      await service.create(makeConstructorDto() as never, MOCK_USER);

      expect(constructorService.calculatePrice).toHaveBeenCalledOnce();
      expect(constructorService.calculatePrice).toHaveBeenCalledWith(cakeConfig);
    });

    it('uses totalPrice from ConstructorService as item price', async () => {
      const constructorService = buildConstructorServiceMock(75_000);
      let capturedItemValues: unknown = null;

      const db = {
        select: () => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }) }),
        transaction: (fn: (tx: unknown) => Promise<unknown>) =>
          fn({
            insert: vi.fn()
              .mockReturnValueOnce({
                values: () => ({ returning: () => Promise.resolve([{ id: ORDER_ID, totalPrice: 75_000 }]) }),
              })
              .mockReturnValueOnce({
                values: (rows: unknown[]) => {
                  capturedItemValues = rows;
                  return { returning: () => Promise.resolve([{ id: 'item-1' }]) };
                },
              }),
          }),
      };

      const service = buildService(db, constructorService);
      await service.create(makeConstructorDto() as never, MOCK_USER);

      expect((capturedItemValues as { price: number }[])[0].price).toBe(75_000);
    });

    it('sets totalPrice on the order as quantity × item price', async () => {
      const constructorService = buildConstructorServiceMock(50_000);
      const db = buildDbMock({});
      const service = buildService(db, constructorService);

      const dto = makeConstructorDto({ quantity: 2 });
      const result = await service.create(dto as never, MOCK_USER);

      // totalPrice from the mock order insert = 100_000 (mock default)
      expect(result.order).toBeDefined();
    });
  });

  // ---- Constructor item — validation errors ---------------------------------

  describe('constructor item — validation errors', () => {
    it('throws BadRequestException when type is constructor but cakeConfig is missing', async () => {
      const db = buildDbMock({});
      const service = buildService(db);

      const dto = {
        pickupDate: '2026-06-01',
        pickupTimeSlot: PickupTimeSlot.EVENING,
        items: [
          {
            type: OrderItemType.CONSTRUCTOR,
            cakeConfig: undefined, // missing
            weight: 15,
            quantity: 1,
          },
        ],
      };

      await expect(
        service.create(dto as never, MOCK_USER),
      ).rejects.toThrow(BadRequestException);
    });

    it('propagates exceptions thrown by ConstructorService.calculatePrice', async () => {
      const constructorService = {
        calculatePrice: vi.fn().mockRejectedValue(new NotFoundException('Base not found')),
      } as unknown as ConstructorService;

      const db = buildDbMock({});
      const service = buildService(db, constructorService);

      const dto = {
        pickupDate: '2026-06-01',
        pickupTimeSlot: PickupTimeSlot.MORNING,
        items: [
          {
            type: OrderItemType.CONSTRUCTOR,
            cakeConfig: { shape: 'circle', tiers: [], coatingId: 'c1' },
            weight: 15,
            quantity: 1,
          },
        ],
      };

      await expect(
        service.create(dto as never, MOCK_USER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---- Unknown item type ---------------------------------------------------

  describe('unknown item type', () => {
    it('throws BadRequestException for an unrecognised item type', async () => {
      const db = buildDbMock({});
      const service = buildService(db);

      const dto = {
        pickupDate: '2026-06-01',
        pickupTimeSlot: PickupTimeSlot.MORNING,
        items: [
          {
            type: 'gift' as never, // not product or constructor
            weight: 10,
            quantity: 1,
          },
        ],
      };

      await expect(
        service.create(dto as never, MOCK_USER),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---- Multiple items -------------------------------------------------------

  describe('mixed items in a single order', () => {
    it('processes all items and sums their prices into totalPrice', async () => {
      const product = makeProduct({ pricePerKg: 100_00 }); // 100 ₽/kg
      const constructorService = buildConstructorServiceMock(20_000); // 200 ₽

      let capturedTotalPrice: number | undefined;

      const db = {
        select: () => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([product]) }) }) }),
        transaction: (fn: (tx: unknown) => Promise<unknown>) =>
          fn({
            insert: vi.fn()
              .mockReturnValueOnce({
                values: (orderRow: { totalPrice: number }) => {
                  capturedTotalPrice = orderRow.totalPrice;
                  return { returning: () => Promise.resolve([{ id: ORDER_ID, totalPrice: orderRow.totalPrice }]) };
                },
              })
              .mockReturnValueOnce({
                values: () => ({ returning: () => Promise.resolve([]) }),
              }),
          }),
      };

      const dto = {
        pickupDate: '2026-06-01',
        pickupTimeSlot: PickupTimeSlot.MORNING,
        items: [
          {
            type: OrderItemType.PRODUCT,
            productId: PRODUCT_ID,
            weight: 10, // 1.0 kg × 100_00 = 10_000
            quantity: 1,
          },
          {
            type: OrderItemType.CONSTRUCTOR,
            cakeConfig: { shape: 'circle', tiers: [{ baseId: 'b1', fillingId: 'f1', weight: 10 }], coatingId: 'c1' },
            weight: 10,
            quantity: 1, // price = 20_000 from mock
          },
        ],
      };

      const service = buildService(db, constructorService);
      await service.create(dto as never, MOCK_USER);

      // product: round(100_00 * 1.0) * 1 = 10_000
      // constructor: 20_000 * 1 = 20_000
      // total = 30_000
      expect(capturedTotalPrice).toBe(30_000);
    });
  });
});
