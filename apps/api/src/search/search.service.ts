import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Meilisearch } from 'meilisearch';
import { ProductsService } from '../products/products.service';

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

export interface SearchHit {
  id: string;
  name: string;
  highlightedName: string | null;
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
    this.index = this.client.index<MeiliProduct>('products');
  }

  async onModuleInit(): Promise<void> {
    try {
      // createIndex is idempotent — if index exists, the task just fails silently
      await this.client.createIndex('products', { primaryKey: 'id' }).waitTask();

      await this.index.updateSearchableAttributes(['name', 'description']).waitTask();
      await this.index.updateFilterableAttributes(['category', 'pricePerKg']).waitTask();
      await this.index.updateSortableAttributes(['pricePerKg']).waitTask();

      await this.reindexAll();
    } catch (err) {
      this.logger.warn(
        `Meilisearch is unavailable — search features will be degraded. Reason: ${(err as Error).message}`,
      );
    }
  }

  async reindexAll(): Promise<void> {
    const { data: products } = await this.productsService.findAll({
      page: 1,
      limit: 1000,
      order: 'desc',
    });

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

    await this.index.addDocuments(documents);
    this.logger.log(`Meilisearch: indexed ${documents.length} products`);
  }

  async search(query: string, limit: number = 6): Promise<SearchHit[]> {
    const results = await this.index.search(query, {
      limit,
      attributesToHighlight: ['name'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
    });

    return results.hits.map((hit) => {
      const doc = hit as unknown as MeiliProduct & { _formatted?: Record<string, string> };
      return {
        id: doc.id,
        name: doc.name,
        highlightedName: doc._formatted?.name ?? null,
        slug: doc.slug,
        imageUrl: doc.imageUrl,
        pricePerKg: doc.pricePerKg,
        pricePerUnit: doc.pricePerUnit,
        priceType: doc.priceType,
        category: doc.category,
      };
    });
  }

  async indexProduct(product: MeiliProduct): Promise<void> {
    await this.index.addDocuments([product]);
  }

  async removeProduct(id: string): Promise<void> {
    await this.index.deleteDocument(id);
  }
}
