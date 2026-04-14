import { describe, it, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { AdminService } from '../admin/admin.service';
import { DRIZZLE } from '../database/drizzle.token';
import { SearchService } from '../search/search.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ORDER_ID = 'cccccccc-0000-0000-0000-000000000001';
const USER_ID  = 'dddddddd-0000-0000-0000-000000000002';

function makeOrderRow(overrides: Record<string, unknown> = {}) {
  return {
    id: ORDER_ID,
    orderNumber: 1001,
    status: 'created',
    totalPrice: 75000,
    pickupDate: '2026-06-01',
    pickupTimeSlot: 'morning',
    comment: null,
    createdAt: new Date('2026-04-09T10:00:00.000Z'),
    updatedAt: new Date('2026-04-09T10:00:00.000Z'),
    userId: USER_ID,
    userName: 'Анна',
    userEmail: 'anna@example.com',
    userPhone: '+79991234567',
    ...overrides,
  };
}

function makePaginationQuery(overrides: Record<string, unknown> = {}) {
  return {
    page: 1,
    limit: 20,
    order: 'desc' as const,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// DB mock helpers
//
// Both getStats and getAllOrders use Promise.all internally.
// Drizzle query builders are fluent chains — each .select() call returns a
// new chain that is thenable (awaitable). We use a `terminal()` helper that
// makes any chain thenable and resolves to the provided value, while all
// intermediate methods (.from, .where, .orderBy, .limit, .offset,
// .leftJoin, .innerJoin) return the same chain.
//
// getStats — 4 select() calls in order:
//   1. select({ newOrdersToday })  → [{ newOrdersToday: N }]
//   2. select({ ordersInProgress }) → [{ ordersInProgress: N }]
//   3. select({ totalRevenue })    → [{ totalRevenue: N }]
//   4. select({ id, ... })         → recentOrders[]
//
// getAllOrders — 2 select() calls in order:
//   1. select({ id, ...fields }) → paginatedOrders[]
//   2. select({ count })         → [{ count: N }]
// ---------------------------------------------------------------------------

/** Creates a thenable Drizzle-like fluent chain that resolves to `result`. */
function terminal(result: unknown[]) {
  const chain: Record<string, unknown> = {};
  for (const method of [
    'from', 'where', 'limit', 'offset', 'orderBy',
    'leftJoin', 'innerJoin', 'groupBy',
  ]) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  // Make the chain itself awaitable
  chain['then'] = (
    resolve: (v: unknown) => unknown,
    reject: unknown,
  ) => Promise.resolve(result).then(resolve as never, reject as never);
  return chain;
}

/**
 * Build a db mock for getStats.
 * 4 successive .select() calls map to the 4 stats queries.
 */
function buildGetStatsDb(options: {
  newOrdersToday?: number;
  ordersInProgress?: number;
  totalRevenue?: number;
  recentOrders?: unknown[];
} = {}) {
  const {
    newOrdersToday = 3,
    ordersInProgress = 5,
    totalRevenue = 150000,
    recentOrders = [makeOrderRow()],
  } = options;

  const selectMock = vi.fn()
    .mockReturnValueOnce(terminal([{ newOrdersToday }]))
    .mockReturnValueOnce(terminal([{ ordersInProgress }]))
    .mockReturnValueOnce(terminal([{ totalRevenue }]))
    .mockReturnValueOnce(terminal(recentOrders));

  return { select: selectMock };
}

/**
 * Build a db mock for getAllOrders.
 * 2 successive .select() calls: paginated rows + count.
 */
function buildGetAllOrdersDb(options: {
  rows?: unknown[];
  count?: number;
} = {}) {
  const {
    rows = [makeOrderRow()],
    count = 1,
  } = options;

  const selectMock = vi.fn()
    .mockReturnValueOnce(terminal(rows))
    .mockReturnValueOnce(terminal([{ count }]));

  return { select: selectMock };
}

// ---------------------------------------------------------------------------
// Service factory
// ---------------------------------------------------------------------------

async function buildService(db: unknown, searchService?: unknown): Promise<AdminService> {
  const module = await Test.createTestingModule({
    providers: [
      AdminService,
      { provide: DRIZZLE, useValue: db },
      ...(searchService
        ? [{ provide: SearchService, useValue: searchService }]
        : [{ provide: SearchService, useValue: { indexProduct: vi.fn(), removeProduct: vi.fn() } }]),
    ],
  }).compile();

  return module.get<AdminService>(AdminService);
}

// ---------------------------------------------------------------------------
// AdminService.getStats
// ---------------------------------------------------------------------------

describe('AdminService.getStats', () => {
  it('returns object with all four stat fields', async () => {
    const db = buildGetStatsDb();
    const service = await buildService(db);

    const result = await service.getStats();

    expect(result).toHaveProperty('newOrdersToday');
    expect(result).toHaveProperty('ordersInProgress');
    expect(result).toHaveProperty('totalRevenue');
    expect(result).toHaveProperty('recentOrders');
  });

  it('returns correct numeric values from db', async () => {
    const db = buildGetStatsDb({
      newOrdersToday: 7,
      ordersInProgress: 12,
      totalRevenue: 300000,
    });
    const service = await buildService(db);

    const result = await service.getStats();

    expect(result.newOrdersToday).toBe(7);
    expect(result.ordersInProgress).toBe(12);
    expect(result.totalRevenue).toBe(300000);
  });

  it('returns recentOrders array from db', async () => {
    const recent = [makeOrderRow({ orderNumber: 2001 }), makeOrderRow({ orderNumber: 2002 })];
    const db = buildGetStatsDb({ recentOrders: recent });
    const service = await buildService(db);

    const result = await service.getStats();

    expect(Array.isArray(result.recentOrders)).toBe(true);
    expect(result.recentOrders).toHaveLength(2);
  });

  it('returns empty recentOrders when no orders exist', async () => {
    const db = buildGetStatsDb({
      newOrdersToday: 0,
      ordersInProgress: 0,
      totalRevenue: 0,
      recentOrders: [],
    });
    const service = await buildService(db);

    const result = await service.getStats();

    expect(result.recentOrders).toHaveLength(0);
    expect(result.newOrdersToday).toBe(0);
    expect(result.totalRevenue).toBe(0);
  });

  it('executes exactly 4 select calls in parallel via Promise.all', async () => {
    const db = buildGetStatsDb();
    const service = await buildService(db);

    await service.getStats();

    expect((db.select as ReturnType<typeof vi.fn>).mock.calls.length).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// AdminService.getAllOrders
// ---------------------------------------------------------------------------

describe('AdminService.getAllOrders', () => {
  it('returns object with data and meta fields', async () => {
    const db = buildGetAllOrdersDb();
    const service = await buildService(db);

    const result = await service.getAllOrders(makePaginationQuery());

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('meta');
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('meta contains page, limit and total', async () => {
    const db = buildGetAllOrdersDb({ count: 42 });
    const service = await buildService(db);

    const result = await service.getAllOrders(makePaginationQuery({ page: 2, limit: 10 }));

    expect(result.meta.page).toBe(2);
    expect(result.meta.limit).toBe(10);
    expect(result.meta.total).toBe(42);
  });

  it('maps row data to user sub-object in each data item', async () => {
    const db = buildGetAllOrdersDb({ rows: [makeOrderRow()] });
    const service = await buildService(db);

    const result = await service.getAllOrders(makePaginationQuery());

    const item = result.data[0];
    expect(item).toHaveProperty('user');
    expect(item.user).toMatchObject({
      id: USER_ID,
      name: 'Анна',
      email: 'anna@example.com',
      phone: '+79991234567',
    });
  });

  it('data item contains order fields: id, orderNumber, status, totalPrice', async () => {
    const db = buildGetAllOrdersDb({ rows: [makeOrderRow()] });
    const service = await buildService(db);

    const result = await service.getAllOrders(makePaginationQuery());

    const item = result.data[0];
    expect(item.id).toBe(ORDER_ID);
    expect(item.orderNumber).toBe(1001);
    expect(item.status).toBe('created');
    expect(item.totalPrice).toBe(75000);
  });

  it('returns empty data array when no orders match', async () => {
    const db = buildGetAllOrdersDb({ rows: [], count: 0 });
    const service = await buildService(db);

    const result = await service.getAllOrders(makePaginationQuery());

    expect(result.data).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });

  it('executes exactly 2 select calls in parallel via Promise.all', async () => {
    const db = buildGetAllOrdersDb();
    const service = await buildService(db);

    await service.getAllOrders(makePaginationQuery());

    expect((db.select as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Product CRUD fixtures
// ---------------------------------------------------------------------------

const PRODUCT_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
const CATEGORY_ID = 'bbbbbbbb-0000-0000-0000-000000000002';

function makeProductRow(overrides: Record<string, unknown> = {}) {
  return {
    id: PRODUCT_ID,
    slug: 'chocolate-cake',
    name: 'Шоколадный торт',
    description: 'Описание',
    composition: null,
    imageUrl: null,
    images: [],
    priceType: 'per_kg' as const,
    pricePerKg: 80000,
    pricePerUnit: null,
    minWeight: '1.0',
    maxWeight: '5.0',
    weightStep: '0.5',
    categoryId: CATEGORY_ID,
    isAvailable: true,
    isDeleted: false,
    createdAt: new Date('2026-04-01T10:00:00.000Z'),
    updatedAt: new Date('2026-04-01T10:00:00.000Z'),
    ...overrides,
  };
}

function makeSearchService() {
  return {
    indexProduct: vi.fn().mockResolvedValue(undefined),
    removeProduct: vi.fn().mockResolvedValue(undefined),
  };
}

/**
 * Builds a db mock for createProduct:
 *   1. select({ id }) — slug conflict check → []
 *   2. insert().values().returning() → [product]
 *   3. select({ name }) from categories — getCategoryName → [{ name: 'Торты' }]
 */
function buildCreateProductDb(product = makeProductRow()) {
  // insert chain
  const insertChain: Record<string, unknown> = {};
  insertChain['values'] = vi.fn().mockReturnValue(insertChain);
  insertChain['returning'] = vi.fn().mockResolvedValue([product]);

  const selectSlugConflict = terminal([]);            // no conflict
  const selectCategoryName = terminal([{ name: 'Торты' }]);

  const selectMock = vi.fn()
    .mockReturnValueOnce(selectSlugConflict)
    .mockReturnValueOnce(selectCategoryName);

  return {
    select: selectMock,
    insert: vi.fn().mockReturnValue(insertChain),
  };
}

/**
 * Builds a db mock for updateProduct:
 *   1. select({ id }) — existence check → [{ id }]
 *   2. (optional slug check skipped — dto has no slug conflict)
 *   3. update().set().where().returning() → [updated]
 *   4. select({ name }) from categories — getCategoryName → [{ name: 'Торты' }]
 */
function buildUpdateProductDb(product = makeProductRow()) {
  const updateChain: Record<string, unknown> = {};
  updateChain['set'] = vi.fn().mockReturnValue(updateChain);
  updateChain['where'] = vi.fn().mockReturnValue(updateChain);
  updateChain['returning'] = vi.fn().mockResolvedValue([product]);

  const selectExistence = terminal([{ id: PRODUCT_ID }]);
  const selectCategoryName = terminal([{ name: 'Торты' }]);

  const selectMock = vi.fn()
    .mockReturnValueOnce(selectExistence)
    .mockReturnValueOnce(selectCategoryName);

  return {
    select: selectMock,
    update: vi.fn().mockReturnValue(updateChain),
  };
}

/**
 * Builds a db mock for deleteProduct:
 *   1. select({ id, isDeleted }) — existence check → [{ id, isDeleted: false }]
 *   2. update().set().where() — soft-delete (no .returning())
 */
function buildDeleteProductDb() {
  const updateChain: Record<string, unknown> = {};
  updateChain['set'] = vi.fn().mockReturnValue(updateChain);
  updateChain['where'] = vi.fn().mockResolvedValue([]);

  const selectExistence = terminal([{ id: PRODUCT_ID, isDeleted: false }]);

  const selectMock = vi.fn().mockReturnValueOnce(selectExistence);

  return {
    select: selectMock,
    update: vi.fn().mockReturnValue(updateChain),
  };
}

const CREATE_DTO = {
  slug: 'chocolate-cake',
  name: 'Шоколадный торт',
  pricePerKg: 80000,
  categoryId: CATEGORY_ID,
};

const UPDATE_DTO = { name: 'Обновлённый торт' };

// ---------------------------------------------------------------------------
// AdminService — Search index synchronization
// ---------------------------------------------------------------------------

describe('AdminService — search index synchronization', () => {
  it('createProduct calls searchService.indexProduct after insert', async () => {
    const db = buildCreateProductDb();
    const searchService = makeSearchService();
    const service = await buildService(db, searchService);

    await service.createProduct(CREATE_DTO as never);

    expect(searchService.indexProduct).toHaveBeenCalledOnce();
    expect(searchService.indexProduct).toHaveBeenCalledWith(
      expect.objectContaining({ id: PRODUCT_ID, slug: 'chocolate-cake' }),
    );
  });

  it('updateProduct calls searchService.indexProduct after update', async () => {
    const db = buildUpdateProductDb();
    const searchService = makeSearchService();
    const service = await buildService(db, searchService);

    await service.updateProduct(PRODUCT_ID, UPDATE_DTO as never);

    expect(searchService.indexProduct).toHaveBeenCalledOnce();
    expect(searchService.indexProduct).toHaveBeenCalledWith(
      expect.objectContaining({ id: PRODUCT_ID }),
    );
  });

  it('deleteProduct calls searchService.removeProduct after soft-delete', async () => {
    const db = buildDeleteProductDb();
    const searchService = makeSearchService();
    const service = await buildService(db, searchService);

    await service.deleteProduct(PRODUCT_ID);

    expect(searchService.removeProduct).toHaveBeenCalledOnce();
    expect(searchService.removeProduct).toHaveBeenCalledWith(PRODUCT_ID);
  });

  it('createProduct still returns product when search indexing throws', async () => {
    const db = buildCreateProductDb();
    const searchService = {
      indexProduct: vi.fn().mockRejectedValue(new Error('Meilisearch unavailable')),
      removeProduct: vi.fn(),
    };
    const service = await buildService(db, searchService);

    const result = await service.createProduct(CREATE_DTO as never);

    expect(result).toMatchObject({ id: PRODUCT_ID, slug: 'chocolate-cake' });
    expect(searchService.indexProduct).toHaveBeenCalledOnce();
  });

  it('updateProduct calls removeProduct when isAvailable becomes false', async () => {
    const unavailableProduct = makeProductRow({ isAvailable: false });
    const db = buildUpdateProductDb(unavailableProduct);
    const searchService = makeSearchService();
    const service = await buildService(db, searchService);

    await service.updateProduct(PRODUCT_ID, { isAvailable: false } as never);

    expect(searchService.removeProduct).toHaveBeenCalledOnce();
    expect(searchService.removeProduct).toHaveBeenCalledWith(PRODUCT_ID);
    expect(searchService.indexProduct).not.toHaveBeenCalled();
  });
});
