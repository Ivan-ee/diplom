import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Meilisearch } from 'meilisearch';
import { ProductsService } from '../products/products.service';
import type { SearchHit, PriceType } from '@bakery/shared-types';
import {
  RUSSIAN_STOP_WORDS,
  BAKERY_SYNONYMS,
  TYPO_TOLERANCE_CONFIG,
  SEARCH_DEFAULT_LIMIT,
  MEILI_INDEX_NAME,
} from './search.constants';

export type { SearchHit } from '@bakery/shared-types';

interface MeiliProduct {
  id: string;
  name: string;
  description: string;
  slug: string;
  imageUrl: string | null;
  pricePerKg: number | null;
  pricePerUnit: number | null;
  priceType: string;
  category: string;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private readonly client: Meilisearch;
  private readonly index: ReturnType<Meilisearch['index']>;

  constructor(
    private readonly configService: ConfigService,
    private readonly productsService: ProductsService,
  ) {
    const host = this.configService.get<string>('MEILI_HOST', 'http://localhost:7700');
    const apiKey = this.configService.get<string>('MEILI_MASTER_KEY', 'devMasterKey123');

    this.client = new Meilisearch({ host, apiKey });
    this.index = this.client.index<MeiliProduct>(MEILI_INDEX_NAME);
  }

  async onModuleInit(): Promise<void> {
    try {
      // createIndex is idempotent — if index exists, the task just fails silently
      await this.client.createIndex(MEILI_INDEX_NAME, { primaryKey: 'id' }).waitTask();

      await this.index.updateSearchableAttributes(['name', 'description']).waitTask();
      await this.index.updateFilterableAttributes(['category', 'pricePerKg']).waitTask();
      await this.index.updateSortableAttributes(['pricePerKg']).waitTask();

      await this.index.updateStopWords(RUSSIAN_STOP_WORDS).waitTask();
      await this.index.updateSynonyms(BAKERY_SYNONYMS).waitTask();
      await this.index.updateTypoTolerance(TYPO_TOLERANCE_CONFIG).waitTask();
      await this.index.updateLocalizedAttributes([
        { attributePatterns: ['name', 'description'], locales: ['rus'] },
      ]).waitTask();

      await this.reindexAll();
    } catch (err) {
      this.logger.warn(
        `Meilisearch is unavailable — search features will be degraded. Reason: ${(err as Error).message}`,
      );
    }
  }

  async reindexAll(): Promise<void> {
    await this.index.deleteAllDocuments().waitTask();

    const PAGE_SIZE = 500;
    let page = 1;
    let totalIndexed = 0;

    while (true) {
      const { data: products, meta } = await this.productsService.findAll({
        page,
        limit: PAGE_SIZE,
        order: 'desc',
      });

      if (products.length === 0) break;

      const documents: MeiliProduct[] = products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? '',
        slug: p.slug,
        imageUrl: p.imageUrl ?? null,
        pricePerKg: p.pricePerKg ?? null,
        pricePerUnit: p.pricePerUnit ?? null,
        priceType: p.priceType,
        category: p.category?.name ?? '',
      }));

      await this.index.addDocuments(documents).waitTask();
      totalIndexed += documents.length;

      if (totalIndexed >= meta.total) break;
      page++;
    }

    this.logger.log(`Meilisearch: indexed ${totalIndexed} products`);
  }

  async search(query: string, limit: number = SEARCH_DEFAULT_LIMIT): Promise<SearchHit[]> {
    try {
      const results = await this.index.search(query, {
        limit,
        attributesToHighlight: ['name', 'description'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
      });

      return results.hits.map((hit) => {
        const doc = hit as unknown as MeiliProduct & { _formatted?: Record<string, string> };
        return {
          id: doc.id,
          name: doc.name,
          highlightedName: doc._formatted?.name ?? null,
          highlightedDescription: doc._formatted?.description ?? null,
          slug: doc.slug,
          imageUrl: doc.imageUrl,
          pricePerKg: doc.pricePerKg,
          pricePerUnit: doc.pricePerUnit,
          priceType: doc.priceType as PriceType,
          category: doc.category,
        };
      });
    } catch (err) {
      this.logger.warn(`Search failed for query "${query}": ${(err as Error).message}`);
      return [];
    }
  }

  async indexProduct(product: MeiliProduct): Promise<void> {
    await this.index.addDocuments([product]);
  }

  async removeProduct(id: string): Promise<void> {
    await this.index.deleteDocument(id);
  }
}
