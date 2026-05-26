import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConstructorService } from '../constructor/constructor.service';
import { DRIZZLE } from '../database/drizzle.token';

// ---------------------------------------------------------------------------
// Helpers — reusable fixture factories
// ---------------------------------------------------------------------------

const BASE_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
const FILLING_ID = 'bbbbbbbb-0000-0000-0000-000000000002';
const COATING_ID = 'cccccccc-0000-0000-0000-000000000003';
const DECOR_ID = 'dddddddd-0000-0000-0000-000000000004';
const CANDLE_DECOR_ID = 'dddddddd-0000-0000-0000-000000000005';

function makeBase(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: BASE_ID,
    name: 'Бисквит',
    pricePerKg: 100_00, // 100 ₽/kg in kopecks
    isAvailable: true,
    sortOrder: 0,
    ...overrides,
  };
}

function makeFilling(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: FILLING_ID,
    name: 'Клубника',
    pricePerKg: 200_00,
    isAvailable: true,
    sortOrder: 0,
    ...overrides,
  };
}

function makeCoating(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: COATING_ID,
    name: 'Крем',
    pricePerKg: 50_00,
    isAvailable: true,
    sortOrder: 0,
    ...overrides,
  };
}

function makeDecor(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: DECOR_ID,
    name: 'Роза',
    category: 'flowers',
    pricePerUnit: 30_00,
    visualKey: 'cream',
    isAvailable: true,
    sortOrder: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// DB mock builder
//
// ConstructorService.fetchIngredients calls Promise.all([bases, fillings,
// coatings, decorations]) where each element is a Drizzle query chain:
//   this.db.select().from(...).where(...)
//
// We mock db.select() to return a chainable object whose terminal call
// returns a promise. Because all four queries are built from the same
// `db.select()` call we use a call counter inside the mock so that
// successive calls return the right dataset.
// ---------------------------------------------------------------------------

function buildDbMock(
  basesResult: unknown[],
  fillingsResult: unknown[],
  coatingsResult: unknown[],
  decorationsResult: unknown[],
) {
  let callCount = 0;
  const results = [basesResult, fillingsResult, coatingsResult, decorationsResult];

  const chain = () => {
    const index = callCount++;
    const thenable = {
      from: () => thenable,
      where: () => Promise.resolve(results[index] ?? []),
      orderBy: () => thenable,
    };
    return thenable;
  };

  return { select: chain };
}

function buildIngredientsDbMock(
  basesResult: unknown[],
  fillingsResult: unknown[],
  coatingsResult: unknown[],
  decorationsResult: unknown[],
) {
  let callCount = 0;
  const results = [basesResult, fillingsResult, coatingsResult, decorationsResult];

  const chain = () => {
    const index = callCount++;
    const thenable = {
      from: () => thenable,
      where: () => thenable,
      orderBy: () => Promise.resolve(results[index] ?? []),
    };
    return thenable;
  };

  return { select: chain };
}

// ---------------------------------------------------------------------------
// Instantiate service directly (no NestJS DI needed for unit tests)
// ---------------------------------------------------------------------------

function buildService(db: unknown): ConstructorService {
  const service = new ConstructorService(db as never);
  return service;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ConstructorService.calculatePrice', () => {
  // ---- Validation: shape ---------------------------------------------------

  describe('shape validation', () => {
    it('throws BadRequestException for unknown shape', async () => {
      const db = buildDbMock([], [], [], []);
      const service = buildService(db);

      await expect(
        service.calculatePrice({
          shape: 'triangle',
          tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
          coatingId: COATING_ID,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('error message mentions the invalid shape and valid options', async () => {
      const db = buildDbMock([], [], [], []);
      const service = buildService(db);

      await expect(
        service.calculatePrice({
          shape: 'oval',
          tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
          coatingId: COATING_ID,
        }),
      ).rejects.toThrow(/circle, square, heart/);
    });
  });

  // ---- Validation: decorations count > 20 ----------------------------------

  describe('decorations limit', () => {
    it('throws BadRequestException when total decoration quantity exceeds 20', async () => {
      const db = buildDbMock([], [], [], []);
      const service = buildService(db);

      await expect(
        service.calculatePrice({
          shape: 'circle',
          tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
          coatingId: COATING_ID,
          decorations: [
            { decorationId: DECOR_ID, quantity: 21 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when multiple decoration items sum above 20', async () => {
      const db = buildDbMock([], [], [], []);
      const service = buildService(db);

      await expect(
        service.calculatePrice({
          shape: 'circle',
          tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
          coatingId: COATING_ID,
          decorations: [
            { decorationId: DECOR_ID, quantity: 11 },
            { decorationId: DECOR_ID, quantity: 10 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('does NOT throw when total decoration quantity is exactly 20', async () => {
      const db = buildDbMock(
        [makeBase()],
        [makeFilling()],
        [makeCoating()],
        [makeDecor()],
      );
      const service = buildService(db);

      await expect(
        service.calculatePrice({
          shape: 'circle',
          tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
          coatingId: COATING_ID,
          decorations: [{ decorationId: DECOR_ID, quantity: 20 }],
        }),
      ).resolves.toBeDefined();
    });
  });

  // ---- Validation: total weight > 10 kg ------------------------------------

  describe('weight limit', () => {
    it('throws BadRequestException when total weight exceeds 10 kg (>100 tenths)', async () => {
      const db = buildDbMock([], [], [], []);
      const service = buildService(db);

      await expect(
        service.calculatePrice({
          shape: 'circle',
          // 3 tiers × 40 tenths = 120 tenths = 12 kg
          tiers: [
            { baseId: BASE_ID, fillingId: FILLING_ID, weight: 40 },
            { baseId: BASE_ID, fillingId: FILLING_ID, weight: 40 },
            { baseId: BASE_ID, fillingId: FILLING_ID, weight: 40 },
          ],
          coatingId: COATING_ID,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('does NOT throw when total weight equals exactly 10 kg (100 tenths)', async () => {
      const db = buildDbMock(
        [makeBase()],
        [makeFilling()],
        [makeCoating()],
        [],
      );
      const service = buildService(db);

      await expect(
        service.calculatePrice({
          shape: 'circle',
          tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 100 }],
          coatingId: COATING_ID,
        }),
      ).resolves.toBeDefined();
    });
  });

  // ---- Validation: inscription > 50 chars ----------------------------------

  describe('inscription limit', () => {
    it('throws BadRequestException when inscription exceeds 50 characters', async () => {
      const db = buildDbMock([], [], [], []);
      const service = buildService(db);

      await expect(
        service.calculatePrice({
          shape: 'circle',
          tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
          coatingId: COATING_ID,
          inscription: 'A'.repeat(51),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('does NOT throw when inscription is exactly 50 characters', async () => {
      const db = buildDbMock(
        [makeBase()],
        [makeFilling()],
        [makeCoating()],
        [],
      );
      const service = buildService(db);

      await expect(
        service.calculatePrice({
          shape: 'circle',
          tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
          coatingId: COATING_ID,
          inscription: 'A'.repeat(50),
        }),
      ).resolves.toBeDefined();
    });
  });

  // ---- DB: not found / unavailable -----------------------------------------

  describe('ingredient not found / unavailable', () => {
    it('throws NotFoundException when coating is not in DB', async () => {
      const db = buildDbMock(
        [makeBase()],
        [makeFilling()],
        [], // empty coatings result
        [],
      );
      const service = buildService(db);

      await expect(
        service.calculatePrice({
          shape: 'circle',
          tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
          coatingId: COATING_ID,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when coating is unavailable', async () => {
      const db = buildDbMock(
        [makeBase()],
        [makeFilling()],
        [makeCoating({ isAvailable: false })],
        [],
      );
      const service = buildService(db);

      await expect(
        service.calculatePrice({
          shape: 'circle',
          tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
          coatingId: COATING_ID,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when base is not in DB', async () => {
      const db = buildDbMock(
        [], // base not found
        [makeFilling()],
        [makeCoating()],
        [],
      );
      const service = buildService(db);

      await expect(
        service.calculatePrice({
          shape: 'circle',
          tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
          coatingId: COATING_ID,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when filling is not in DB', async () => {
      const db = buildDbMock(
        [makeBase()],
        [], // filling not found
        [makeCoating()],
        [],
      );
      const service = buildService(db);

      await expect(
        service.calculatePrice({
          shape: 'circle',
          tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
          coatingId: COATING_ID,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when base ingredient is unavailable', async () => {
      const db = buildDbMock(
        [makeBase({ isAvailable: false })],
        [makeFilling()],
        [makeCoating()],
        [],
      );
      const service = buildService(db);

      await expect(
        service.calculatePrice({
          shape: 'circle',
          tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
          coatingId: COATING_ID,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when filling ingredient is unavailable', async () => {
      const db = buildDbMock(
        [makeBase()],
        [makeFilling({ isAvailable: false })],
        [makeCoating()],
        [],
      );
      const service = buildService(db);

      await expect(
        service.calculatePrice({
          shape: 'circle',
          tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
          coatingId: COATING_ID,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when decoration is not in DB', async () => {
      const db = buildDbMock(
        [makeBase()],
        [makeFilling()],
        [makeCoating()],
        [], // decoration not found
      );
      const service = buildService(db);

      await expect(
        service.calculatePrice({
          shape: 'circle',
          tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
          coatingId: COATING_ID,
          decorations: [{ decorationId: DECOR_ID, quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when decoration is unavailable', async () => {
      const db = buildDbMock(
        [makeBase()],
        [makeFilling()],
        [makeCoating()],
        [makeDecor({ isAvailable: false })],
      );
      const service = buildService(db);

      await expect(
        service.calculatePrice({
          shape: 'circle',
          tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
          coatingId: COATING_ID,
          decorations: [{ decorationId: DECOR_ID, quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---- Price calculation correctness ---------------------------------------

  describe('price calculation', () => {
    /**
     * Single tier, circle shape (0% surcharge), 1 tier (0 tier surcharge).
     *
     * Input:
     *   tier: weight=10 (1.0 kg), base pricePerKg=100_00, filling pricePerKg=200_00
     *   coating pricePerKg=50_00, no decorations
     *
     * Expected:
     *   baseCost    = 100_00 * 1.0 = 10000
     *   fillingCost = 200_00 * 1.0 = 20000
     *   coatingCost =  50_00 * 1.0 =  5000
     *   subtotal    = 35000
     *   shapeSurcharge = 0      (circle)
     *   tierSurcharge  = 0      (1 tier)
     *   totalPrice  = 35000
     */
    it('returns correct totalPrice for 1-tier circle cake', async () => {
      const db = buildDbMock(
        [makeBase()],
        [makeFilling()],
        [makeCoating()],
        [],
      );
      const service = buildService(db);

      const result = await service.calculatePrice({
        shape: 'circle',
        tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
        coatingId: COATING_ID,
      });

      expect(result.totalPrice).toBe(35_000);
    });

    it('returns correct breakdown structure for 1-tier circle cake', async () => {
      const db = buildDbMock(
        [makeBase()],
        [makeFilling()],
        [makeCoating()],
        [],
      );
      const service = buildService(db);

      const { breakdown } = await service.calculatePrice({
        shape: 'circle',
        tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
        coatingId: COATING_ID,
      });

      expect(breakdown.subtotal).toBe(35_000);
      expect(breakdown.shapeSurcharge).toBe(0);
      expect(breakdown.tierSurcharge).toBe(0);
      expect(breakdown.totalWeightKg).toBe(1.0);
      expect(breakdown.tiers).toHaveLength(1);
      expect(breakdown.tiers[0].baseCost).toBe(10_000);
      expect(breakdown.tiers[0].fillingCost).toBe(20_000);
    });

    /**
     * Square shape adds 10% surcharge on subtotal.
     * subtotal = 35000, shapeSurcharge = round(35000 * 10 / 100) = 3500
     * totalPrice = 35000 + 3500 + 0 = 38500
     */
    it('applies 10% surcharge for square shape', async () => {
      const db = buildDbMock(
        [makeBase()],
        [makeFilling()],
        [makeCoating()],
        [],
      );
      const service = buildService(db);

      const result = await service.calculatePrice({
        shape: 'square',
        tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
        coatingId: COATING_ID,
      });

      expect(result.breakdown.shapeSurcharge).toBe(3_500);
      expect(result.totalPrice).toBe(38_500);
    });

    /**
     * Heart shape adds 15% surcharge on subtotal.
     * subtotal = 35000, shapeSurcharge = round(35000 * 15 / 100) = 5250
     * totalPrice = 35000 + 5250 + 0 = 40250
     */
    it('applies 15% surcharge for heart shape', async () => {
      const db = buildDbMock(
        [makeBase()],
        [makeFilling()],
        [makeCoating()],
        [],
      );
      const service = buildService(db);

      const result = await service.calculatePrice({
        shape: 'heart',
        tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
        coatingId: COATING_ID,
      });

      expect(result.breakdown.shapeSurcharge).toBe(5_250);
      expect(result.totalPrice).toBe(40_250);
    });

    /**
     * 2-tier surcharge = 300_000 kopecks (3000 ₽).
     * subtotal = 35000, shapeSurcharge = 0, tierSurcharge = 300_000
     * totalPrice = 335_000
     */
    it('applies 2-tier surcharge of 300_000 kopecks', async () => {
      // Both tiers share the same base/filling IDs so the DB returns one row each.
      const db = buildDbMock(
        [makeBase()],
        [makeFilling()],
        [makeCoating()],
        [],
      );
      const service = buildService(db);

      const result = await service.calculatePrice({
        shape: 'circle',
        tiers: [
          { baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 },
          { baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 },
        ],
        coatingId: COATING_ID,
      });

      expect(result.breakdown.tierSurcharge).toBe(300_000);
    });

    /**
     * 3-tier surcharge = 600_000 kopecks.
     */
    it('applies 3-tier surcharge of 600_000 kopecks', async () => {
      const db = buildDbMock(
        [makeBase()],
        [makeFilling()],
        [makeCoating()],
        [],
      );
      const service = buildService(db);

      const result = await service.calculatePrice({
        shape: 'circle',
        tiers: [
          { baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 },
          { baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 },
          { baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 },
        ],
        coatingId: COATING_ID,
      });

      expect(result.breakdown.tierSurcharge).toBe(600_000);
    });

    /**
     * Decoration cost included in subtotal.
     * pricePerUnit = 30_00, quantity = 3 → decorationCost = 9000
     * subtotal = 35000 + 9000 = 44000, no surcharges
     * totalPrice = 44000
     */
    it('includes decoration cost in total', async () => {
      const db = buildDbMock(
        [makeBase()],
        [makeFilling()],
        [makeCoating()],
        [makeDecor()],
      );
      const service = buildService(db);

      const result = await service.calculatePrice({
        shape: 'circle',
        tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
        coatingId: COATING_ID,
        decorations: [{ decorationId: DECOR_ID, quantity: 3 }],
      });

      expect(result.breakdown.decorations[0].cost).toBe(9_000);
      expect(result.totalPrice).toBe(44_000);
    });

    it('prices candle as a regular paid decoration', async () => {
      const db = buildDbMock(
        [makeBase()],
        [makeFilling()],
        [makeCoating()],
        [makeDecor({
          id: CANDLE_DECOR_ID,
          name: 'Свеча золотая',
          category: 'candle',
          pricePerUnit: 15_00,
          visualKey: 'candle',
        })],
      );
      const service = buildService(db);

      const result = await service.calculatePrice({
        shape: 'circle',
        tiers: [{ baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 }],
        coatingId: COATING_ID,
        decorations: [{ decorationId: CANDLE_DECOR_ID, quantity: 1 }],
      });

      expect(result.breakdown.decorations).toEqual([
        expect.objectContaining({
          id: CANDLE_DECOR_ID,
          name: 'Свеча золотая',
          quantity: 1,
          cost: 1_500,
        }),
      ]);
      expect(result.totalPrice).toBe(36_500);
    });

    /**
     * Coating cost scales with total weight across all tiers.
     * 2 tiers × weight=10 → totalWeightKg=2.0
     * coatingCost = 50_00 * 2.0 = 10000
     */
    it('scales coating cost by total weight across all tiers', async () => {
      const db = buildDbMock(
        [makeBase()],
        [makeFilling()],
        [makeCoating()],
        [],
      );
      const service = buildService(db);

      const result = await service.calculatePrice({
        shape: 'circle',
        tiers: [
          { baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 },
          { baseId: BASE_ID, fillingId: FILLING_ID, weight: 10 },
        ],
        coatingId: COATING_ID,
      });

      expect(result.breakdown.coating.cost).toBe(10_000);
      expect(result.breakdown.totalWeightKg).toBe(2.0);
    });
  });
});

describe('ConstructorService.getIngredients', () => {
  it('returns constructor config using shared web keys', async () => {
    const db = buildIngredientsDbMock(
      [makeBase({ visualKey: 'default' })],
      [makeFilling({ visualKey: 'cream' })],
      [makeCoating({ visualKey: 'cream' })],
      [makeDecor({ visualKey: 'cream' })],
    );
    const service = buildService(db);

    const result = await service.getIngredients();

    expect(result.config).toEqual({
      maxDecorations: 20,
      maxInscriptionLength: 50,
      minWeightPerTier: 500,
      maxWeightPerTier: 5000,
      weightStep: 500,
    });
    expect(result.bases[0]).toMatchObject({
      available: true,
      visualKey: 'default',
    });
  });
});
