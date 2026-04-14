import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SearchService } from '../search/search.service';
import { ProductsService } from '../products/products.service';
import {
  RUSSIAN_STOP_WORDS,
  BAKERY_SYNONYMS,
  TYPO_TOLERANCE_CONFIG,
} from '../search/search.constants';

// ---------------------------------------------------------------------------
// Meilisearch mock
// ---------------------------------------------------------------------------

const { waitTask, mockIndex, MockMeilisearch } = vi.hoisted(() => {
  const waitTask = vi.fn().mockResolvedValue(undefined);
  const mockIndex = {
    updateSearchableAttributes: vi.fn().mockReturnValue({ waitTask }),
    updateFilterableAttributes: vi.fn().mockReturnValue({ waitTask }),
    updateSortableAttributes: vi.fn().mockReturnValue({ waitTask }),
    updateStopWords: vi.fn().mockReturnValue({ waitTask }),
    updateSynonyms: vi.fn().mockReturnValue({ waitTask }),
    updateTypoTolerance: vi.fn().mockReturnValue({ waitTask }),
    updateLocalizedAttributes: vi.fn().mockReturnValue({ waitTask }),
    search: vi.fn(),
    addDocuments: vi.fn().mockResolvedValue(undefined),
    deleteDocument: vi.fn().mockResolvedValue(undefined),
    deleteAllDocuments: vi.fn().mockReturnValue({ waitTask }),
  };

  class MockMeilisearch {
    createIndex = vi.fn().mockReturnValue({ waitTask });
    index = vi.fn().mockReturnValue(mockIndex);
  }

  return { waitTask, mockIndex, MockMeilisearch };
});

vi.mock('meilisearch', () => ({
  Meilisearch: MockMeilisearch,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMPTY_PRODUCTS_RESPONSE = {
  data: [],
  meta: { page: 1, limit: 1000, total: 0 },
};

async function buildService(): Promise<SearchService> {
  const module = await Test.createTestingModule({
    providers: [
      SearchService,
      {
        provide: ConfigService,
        useValue: {
          get: vi.fn().mockImplementation((key: string, defaultValue?: string) => defaultValue),
        },
      },
      {
        provide: ProductsService,
        useValue: {
          findAll: vi.fn().mockResolvedValue(EMPTY_PRODUCTS_RESPONSE),
        },
      },
    ],
  }).compile();

  return module.get<SearchService>(SearchService);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-apply default mocks cleared by clearAllMocks
    waitTask.mockResolvedValue(undefined);
    mockIndex.updateSearchableAttributes.mockReturnValue({ waitTask });
    mockIndex.updateFilterableAttributes.mockReturnValue({ waitTask });
    mockIndex.updateSortableAttributes.mockReturnValue({ waitTask });
    mockIndex.updateStopWords.mockReturnValue({ waitTask });
    mockIndex.updateSynonyms.mockReturnValue({ waitTask });
    mockIndex.updateTypoTolerance.mockReturnValue({ waitTask });
    mockIndex.updateLocalizedAttributes.mockReturnValue({ waitTask });
    mockIndex.addDocuments.mockResolvedValue(undefined);
    mockIndex.deleteDocument.mockResolvedValue(undefined);
  });

  // -------------------------------------------------------------------------
  // onModuleInit — Russian language settings
  // -------------------------------------------------------------------------

  describe('onModuleInit', () => {
    it('calls updateStopWords with RUSSIAN_STOP_WORDS', async () => {
      const service = await buildService();
      await service.onModuleInit();

      expect(mockIndex.updateStopWords).toHaveBeenCalledWith(RUSSIAN_STOP_WORDS);
    });

    it('calls updateSynonyms with BAKERY_SYNONYMS', async () => {
      const service = await buildService();
      await service.onModuleInit();

      expect(mockIndex.updateSynonyms).toHaveBeenCalledWith(BAKERY_SYNONYMS);
    });

    it('calls updateTypoTolerance with TYPO_TOLERANCE_CONFIG', async () => {
      const service = await buildService();
      await service.onModuleInit();

      expect(mockIndex.updateTypoTolerance).toHaveBeenCalledWith(TYPO_TOLERANCE_CONFIG);
    });

    it('calls updateLocalizedAttributes with rus locale for name and description', async () => {
      const service = await buildService();
      await service.onModuleInit();

      expect(mockIndex.updateLocalizedAttributes).toHaveBeenCalledWith([
        { attributePatterns: ['name', 'description'], locales: ['rus'] },
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // reindexAll() — pagination
  // -------------------------------------------------------------------------

  describe('reindexAll()', () => {
    function makeMockProduct(id: number) {
      return {
        id: `p-${id}`,
        name: `Product ${id}`,
        description: `Desc ${id}`,
        slug: `product-${id}`,
        imageUrl: null,
        pricePerKg: 50000,
        pricePerUnit: null,
        priceType: 'per_kg' as const,
        category: { id: 'c-1', name: 'Торты', slug: 'cakes' },
      };
    }

    it('deletes all documents before reindexing', async () => {
      mockIndex.deleteAllDocuments.mockReturnValue({ waitTask });

      const service = await buildService();
      const productsService = (service as any).productsService;
      productsService.findAll = vi.fn().mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 500, total: 0 },
      });

      await service.reindexAll();

      expect(mockIndex.deleteAllDocuments).toHaveBeenCalledTimes(1);
    });

    it('fetches all pages when total exceeds page size', async () => {
      mockIndex.deleteAllDocuments.mockReturnValue({ waitTask });
      mockIndex.addDocuments.mockReturnValue({ waitTask });

      const products1 = Array.from({ length: 500 }, (_, i) => makeMockProduct(i + 1));
      const products2 = Array.from({ length: 500 }, (_, i) => makeMockProduct(i + 501));
      const products3 = Array.from({ length: 200 }, (_, i) => makeMockProduct(i + 1001));

      const service = await buildService();
      const productsService = (service as any).productsService;
      productsService.findAll = vi.fn()
        .mockResolvedValueOnce({ data: products1, meta: { page: 1, limit: 500, total: 1200 } })
        .mockResolvedValueOnce({ data: products2, meta: { page: 2, limit: 500, total: 1200 } })
        .mockResolvedValueOnce({ data: products3, meta: { page: 3, limit: 500, total: 1200 } });

      await service.reindexAll();

      expect(productsService.findAll).toHaveBeenCalledTimes(3);
      expect(productsService.findAll).toHaveBeenNthCalledWith(1, expect.objectContaining({ page: 1 }));
      expect(productsService.findAll).toHaveBeenNthCalledWith(2, expect.objectContaining({ page: 2 }));
      expect(productsService.findAll).toHaveBeenNthCalledWith(3, expect.objectContaining({ page: 3 }));
      expect(mockIndex.addDocuments).toHaveBeenCalledTimes(3);
    });

    it('handles empty catalog gracefully', async () => {
      mockIndex.deleteAllDocuments.mockReturnValue({ waitTask });

      const service = await buildService();
      const productsService = (service as any).productsService;
      productsService.findAll = vi.fn().mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 500, total: 0 },
      });

      await service.reindexAll();

      expect(mockIndex.addDocuments).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // search() — highlighting and mapping
  // -------------------------------------------------------------------------

  describe('search()', () => {
    it('highlights both name and description', async () => {
      mockIndex.search.mockResolvedValue({ hits: [] });
      const service = await buildService();

      await service.search('торт');

      expect(mockIndex.search).toHaveBeenCalledWith(
        'торт',
        expect.objectContaining({
          attributesToHighlight: ['name', 'description'],
        }),
      );
    });

    it('maps _formatted.description to highlightedDescription', async () => {
      mockIndex.search.mockResolvedValue({
        hits: [
          {
            id: 'p-1',
            name: 'Наполеон',
            description: 'Классический торт',
            slug: 'napoleon',
            imageUrl: null,
            pricePerKg: 50000,
            pricePerUnit: null,
            priceType: 'per_kg',
            category: 'Торты',
            _formatted: {
              name: '<mark>Наполеон</mark>',
              description: 'Классический <mark>торт</mark>',
            },
          },
        ],
      });

      const service = await buildService();
      const results = await service.search('торт');

      expect(results).toHaveLength(1);
      expect(results[0].highlightedDescription).toBe('Классический <mark>торт</mark>');
      expect(results[0].highlightedName).toBe('<mark>Наполеон</mark>');
    });

    it('sets highlightedDescription to null when _formatted.description is absent', async () => {
      mockIndex.search.mockResolvedValue({
        hits: [
          {
            id: 'p-2',
            name: 'Медовик',
            description: 'Медовый торт',
            slug: 'medovik',
            imageUrl: null,
            pricePerKg: 45000,
            pricePerUnit: null,
            priceType: 'per_kg',
            category: 'Торты',
            _formatted: { name: '<mark>Медовик</mark>' },
          },
        ],
      });

      const service = await buildService();
      const results = await service.search('мед');

      expect(results[0].highlightedDescription).toBeNull();
    });

    it('returns empty array and logs warning when Meilisearch fails', async () => {
      mockIndex.search.mockRejectedValue(new Error('Connection refused'));

      const service = await buildService();
      const warnSpy = vi.spyOn(service['logger'], 'warn');

      const results = await service.search('торт');

      expect(results).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Connection refused'),
      );
    });
  });
});
