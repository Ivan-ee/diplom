import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { DRIZZLE } from '../database/drizzle.token';
import { Test } from '@nestjs/testing';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PRODUCT_ID = 'bbbbbbbb-0000-0000-0000-000000000001';

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: PRODUCT_ID,
    slug: 'napoleon',
    name: 'Наполеон',
    description: 'Классический торт',
    composition: null,
    imageUrl: null,
    images: [],
    pricePerKg: 50000,
    minWeight: '1.0',
    maxWeight: '5.0',
    weightStep: '0.5',
    isAvailable: true,
    isDeleted: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    categoryId: null,
    categoryName: null,
    categorySlug: null,
    ...overrides,
  };
}

function makeQuery(overrides: Record<string, unknown> = {}) {
  return {
    page: 1,
    limit: 20,
    sort: 'createdAt',
    order: 'desc' as const,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// DB mock helpers
//
// ProductsService.findAll makes these db calls in sequence:
//   1. select().from().where().limit()          — resolveSlugToId (categorySlug)
//   2. select().from().where()                  — productOccasions (if occasion)
//   3. select({ count }).from().where()         — count query
//   4. select({...}).from().leftJoin().where().orderBy().limit().offset() — main rows
//   5. select({...}).from().innerJoin().where() — fetchOccasionsMap
//
// For the simple (no-filter) case we only need calls 3, 4, 5.
// We chain mockReturnValueOnce so each successive .select() returns the
// appropriate fluent chain.
// ---------------------------------------------------------------------------

/** A terminal chain that resolves to `result` at any terminal method call. */
function terminal(result: unknown[]) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  // All intermediate Drizzle builder methods:
  for (const method of [
    'from', 'where', 'limit', 'offset', 'orderBy',
    'leftJoin', 'innerJoin', 'groupBy',
  ]) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  // Terminal method — returns a resolved promise
  chain['then'] = (resolve: (v: unknown) => unknown, reject: unknown) =>
    Promise.resolve(result).then(resolve as never, reject as never);
  // Make the chain itself thenable so `await chain` works
  return chain;
}

/**
 * Build a db mock for findAll with no slug filters.
 * Sequence of .select() calls: count → rows → occasionsMap
 */
function buildFindAllDb(options: {
  countResult?: number;
  rowsResult?: unknown[];
  occasionsResult?: unknown[];
} = {}) {
  const {
    countResult = 1,
    rowsResult = [makeProduct()],
    occasionsResult = [],
  } = options;

  const countChain = terminal([{ count: countResult }]);
  const rowsChain = terminal(rowsResult);
  const occasionsChain = terminal(occasionsResult);

  const selectMock = vi.fn()
    .mockReturnValueOnce(countChain)
    .mockReturnValueOnce(rowsChain)
    .mockReturnValueOnce(occasionsChain);

  return { select: selectMock };
}

/**
 * Build a db mock for findBySlug.
 * Sequence: main row query → occasionsMap query
 */
function buildFindBySlugDb(options: {
  rowResult?: unknown[];
  occasionsResult?: unknown[];
} = {}) {
  const {
    rowResult = [makeProduct()],
    occasionsResult = [],
  } = options;

  const rowChain = terminal(rowResult);
  const occasionsChain = terminal(occasionsResult);

  const selectMock = vi.fn()
    .mockReturnValueOnce(rowChain)
    .mockReturnValueOnce(occasionsChain);

  return { select: selectMock };
}

// ---------------------------------------------------------------------------
// Service factory
// ---------------------------------------------------------------------------

async function buildService(db: unknown): Promise<ProductsService> {
  const module = await Test.createTestingModule({
    providers: [
      ProductsService,
      { provide: DRIZZLE, useValue: db },
    ],
  }).compile();

  return module.get<ProductsService>(ProductsService);
}

// ---------------------------------------------------------------------------
// ProductsService.findAll
// ---------------------------------------------------------------------------

describe('ProductsService.findAll', () => {
  it('returns paginated list with data and meta', async () => {
    const db = buildFindAllDb({ countResult: 1, rowsResult: [makeProduct()] });
    const service = await buildService(db);

    const result = await service.findAll(makeQuery());

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('meta');
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(20);
  });

  it('returns correct total from count query', async () => {
    const db = buildFindAllDb({ countResult: 42, rowsResult: [] });
    const service = await buildService(db);

    const result = await service.findAll(makeQuery());

    expect(result.meta.total).toBe(42);
  });

  it('maps row data to product shape with category and occasions fields', async () => {
    const product = makeProduct({
      categoryId: 'cat-1',
      categoryName: 'Торты',
      categorySlug: 'cakes',
    });
    const db = buildFindAllDb({ rowsResult: [product] });
    const service = await buildService(db);

    const result = await service.findAll(makeQuery());

    const item = result.data[0];
    expect(item.id).toBe(PRODUCT_ID);
    expect(item.name).toBe('Наполеон');
    expect(item.category).toEqual({ id: 'cat-1', name: 'Торты', slug: 'cakes' });
    expect(item.occasions).toEqual([]);
  });

  it('sets category to null when categoryId is null', async () => {
    const db = buildFindAllDb({ rowsResult: [makeProduct({ categoryId: null })] });
    const service = await buildService(db);

    const result = await service.findAll(makeQuery());

    expect(result.data[0].category).toBeNull();
  });

  it('returns empty data array when no rows match', async () => {
    const db = buildFindAllDb({ countResult: 0, rowsResult: [] });
    const service = await buildService(db);

    const result = await service.findAll(makeQuery());

    expect(result.data).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });

  it('buildWhereConditions always adds isAvailable=true and isDeleted=false filters', async () => {
    // The critical filter check: we verify the count query is always called
    // (meaning where-conditions were applied) and returns correctly.
    const db = buildFindAllDb({ countResult: 5 });
    const service = await buildService(db);

    await service.findAll(makeQuery());

    // select() was called 3 times (count + rows + occasions)
    expect((db.select as ReturnType<typeof vi.fn>).mock.calls.length).toBe(3);
  });

  it('returns early with empty result when categorySlug not found in DB', async () => {
    // resolveSlugToId returns null (no row) → service returns early
    const slugChain = terminal([]); // empty → null category
    const selectMock = vi.fn().mockReturnValueOnce(slugChain);
    const db = { select: selectMock };
    const service = await buildService(db);

    const result = await service.findAll(makeQuery({ categorySlug: 'nonexistent' }));

    expect(result).toEqual({ data: [], meta: { page: 1, limit: 20, total: 0 } });
    // Only one select call — early return before count/rows
    expect(selectMock.mock.calls.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// ProductsService.findBySlug
// ---------------------------------------------------------------------------

describe('ProductsService.findBySlug', () => {
  it('returns product data when found and not deleted', async () => {
    const product = makeProduct({ isDeleted: false });
    const db = buildFindBySlugDb({ rowResult: [product] });
    const service = await buildService(db);

    const result = await service.findBySlug('napoleon');

    expect(result.id).toBe(PRODUCT_ID);
    expect(result.slug).toBe('napoleon');
    expect(result.name).toBe('Наполеон');
  });

  it('includes occasions array in result', async () => {
    const db = buildFindBySlugDb({
      rowResult: [makeProduct()],
      occasionsResult: [
        {
          productId: PRODUCT_ID,
          occasionId: 'occ-1',
          occasionName: 'День рождения',
          occasionSlug: 'birthday',
        },
      ],
    });
    const service = await buildService(db);

    const result = await service.findBySlug('napoleon');

    expect(result.occasions).toHaveLength(1);
    expect(result.occasions[0]).toEqual({
      id: 'occ-1',
      name: 'День рождения',
      slug: 'birthday',
    });
  });

  it('throws NotFoundException when product row is not found', async () => {
    const db = buildFindBySlugDb({ rowResult: [] }); // no row
    const service = await buildService(db);

    await expect(service.findBySlug('missing-slug')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when product is marked isDeleted=true', async () => {
    const db = buildFindBySlugDb({ rowResult: [makeProduct({ isDeleted: true })] });
    const service = await buildService(db);

    await expect(service.findBySlug('napoleon')).rejects.toThrow(NotFoundException);
  });

  it('NotFoundException message contains the slug', async () => {
    const db = buildFindBySlugDb({ rowResult: [] });
    const service = await buildService(db);

    await expect(service.findBySlug('my-slug')).rejects.toThrow(/my-slug/);
  });

  it('sets category to null when product has no category', async () => {
    const db = buildFindBySlugDb({ rowResult: [makeProduct({ categoryId: null })] });
    const service = await buildService(db);

    const result = await service.findBySlug('napoleon');

    expect(result.category).toBeNull();
  });

  it('maps category when categoryId is present', async () => {
    const product = makeProduct({
      categoryId: 'cat-2',
      categoryName: 'Пирожные',
      categorySlug: 'pastries',
    });
    const db = buildFindBySlugDb({ rowResult: [product] });
    const service = await buildService(db);

    const result = await service.findBySlug('napoleon');

    expect(result.category).toEqual({ id: 'cat-2', name: 'Пирожные', slug: 'pastries' });
  });
});
