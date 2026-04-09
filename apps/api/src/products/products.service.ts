import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AnyColumn, and, asc, desc, eq, gte, inArray, lte, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@bakery/db/schema';
import { DRIZZLE } from '../database/drizzle.token';
import { QueryProductsDto } from './dto/query-products.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(query: QueryProductsDto) {
    const { page, limit, sort, order, categorySlug, occasion, priceMin, priceMax } =
      query;
    const offset = (page - 1) * limit;

    const categoryId = categorySlug
      ? await this.resolveSlugToId(schema.categories, schema.categories.slug, categorySlug, schema.categories.id)
      : undefined;

    if (categorySlug && categoryId === null) {
      return { data: [], meta: { page, limit, total: 0 } };
    }

    const occasionId = occasion
      ? await this.resolveSlugToId(schema.occasions, schema.occasions.slug, occasion, schema.occasions.id)
      : undefined;

    if (occasion && occasionId === null) {
      return { data: [], meta: { page, limit, total: 0 } };
    }

    let occasionProductIds: string[] | undefined;
    if (occasionId) {
      const rows = await this.db
        .select({ productId: schema.productOccasions.productId })
        .from(schema.productOccasions)
        .where(eq(schema.productOccasions.occasionId, occasionId));
      occasionProductIds = rows.map((r) => r.productId);
      if (occasionProductIds.length === 0) {
        return { data: [], meta: { page, limit, total: 0 } };
      }
    }

    const where = this.buildWhereConditions({
      categoryId: categoryId ?? undefined,
      occasionProductIds,
      priceMin,
      priceMax,
    });

    const sortableColumns: Record<string, AnyColumn> = {
      createdAt: schema.products.createdAt,
      pricePerKg: schema.products.pricePerKg,
      name: schema.products.name,
    };
    const sortCol: AnyColumn =
      sortableColumns[sort ?? 'createdAt'] ?? schema.products.createdAt;
    const orderExpr = order === 'asc' ? asc(sortCol) : desc(sortCol);

    const [{ count: total }] = await this.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(schema.products)
      .where(where);

    const rows = await this.db
      .select({
        id: schema.products.id,
        slug: schema.products.slug,
        name: schema.products.name,
        description: schema.products.description,
        imageUrl: schema.products.imageUrl,
        images: schema.products.images,
        pricePerKg: schema.products.pricePerKg,
        minWeight: schema.products.minWeight,
        maxWeight: schema.products.maxWeight,
        weightStep: schema.products.weightStep,
        isAvailable: schema.products.isAvailable,
        createdAt: schema.products.createdAt,
        categoryId: schema.products.categoryId,
        categoryName: schema.categories.name,
        categorySlug: schema.categories.slug,
      })
      .from(schema.products)
      .leftJoin(
        schema.categories,
        eq(schema.products.categoryId, schema.categories.id),
      )
      .where(where)
      .orderBy(orderExpr)
      .limit(limit)
      .offset(offset);

    const productIds = rows.map((r) => r.id);
    const occasionsMap = await this.fetchOccasionsMap(productIds);

    const data = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      imageUrl: row.imageUrl,
      images: row.images,
      pricePerKg: row.pricePerKg,
      minWeight: row.minWeight,
      maxWeight: row.maxWeight,
      weightStep: row.weightStep,
      isAvailable: row.isAvailable,
      createdAt: row.createdAt,
      category: row.categoryId
        ? { id: row.categoryId, name: row.categoryName, slug: row.categorySlug }
        : null,
      occasions: occasionsMap[row.id] ?? [],
    }));

    return { data, meta: { page, limit, total } };
  }

  private async resolveSlugToId(
    table: Parameters<typeof this.db.select>[0] extends never ? never : any,
    slugCol: AnyColumn,
    slugValue: string,
    idCol: AnyColumn,
  ): Promise<string | null> {
    const [row] = await this.db
      .select({ id: idCol as any })
      .from(table as any)
      .where(eq(slugCol, slugValue))
      .limit(1);
    return row ? (row.id as string) : null;
  }

  private buildWhereConditions(filters: {
    categoryId?: string;
    occasionProductIds?: string[];
    priceMin?: number;
    priceMax?: number;
  }): SQL {
    const conditions: SQL[] = [
      eq(schema.products.isAvailable, true),
      eq(schema.products.isDeleted, false),
    ];

    if (filters.categoryId) {
      conditions.push(eq(schema.products.categoryId, filters.categoryId));
    }
    if (filters.occasionProductIds) {
      conditions.push(inArray(schema.products.id, filters.occasionProductIds));
    }
    if (filters.priceMin !== undefined) {
      conditions.push(gte(schema.products.pricePerKg, filters.priceMin));
    }
    if (filters.priceMax !== undefined) {
      conditions.push(lte(schema.products.pricePerKg, filters.priceMax));
    }

    return and(...conditions) as SQL;
  }

  async findBySlug(slug: string) {
    const [row] = await this.db
      .select({
        id: schema.products.id,
        slug: schema.products.slug,
        name: schema.products.name,
        description: schema.products.description,
        composition: schema.products.composition,
        imageUrl: schema.products.imageUrl,
        images: schema.products.images,
        pricePerKg: schema.products.pricePerKg,
        minWeight: schema.products.minWeight,
        maxWeight: schema.products.maxWeight,
        weightStep: schema.products.weightStep,
        isAvailable: schema.products.isAvailable,
        isDeleted: schema.products.isDeleted,
        createdAt: schema.products.createdAt,
        updatedAt: schema.products.updatedAt,
        categoryId: schema.products.categoryId,
        categoryName: schema.categories.name,
        categorySlug: schema.categories.slug,
      })
      .from(schema.products)
      .leftJoin(
        schema.categories,
        eq(schema.products.categoryId, schema.categories.id),
      )
      .where(eq(schema.products.slug, slug))
      .limit(1);

    if (!row || row.isDeleted) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    const occasionsMap = await this.fetchOccasionsMap([row.id]);

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      composition: row.composition,
      imageUrl: row.imageUrl,
      images: row.images,
      pricePerKg: row.pricePerKg,
      minWeight: row.minWeight,
      maxWeight: row.maxWeight,
      weightStep: row.weightStep,
      isAvailable: row.isAvailable,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      category: row.categoryId
        ? { id: row.categoryId, name: row.categoryName, slug: row.categorySlug }
        : null,
      occasions: occasionsMap[row.id] ?? [],
    };
  }

  private async fetchOccasionsMap(
    productIds: string[],
  ): Promise<Record<string, { id: string; name: string; slug: string }[]>> {
    if (productIds.length === 0) return {};

    const rows = await this.db
      .select({
        productId: schema.productOccasions.productId,
        occasionId: schema.occasions.id,
        occasionName: schema.occasions.name,
        occasionSlug: schema.occasions.slug,
      })
      .from(schema.productOccasions)
      .innerJoin(
        schema.occasions,
        eq(schema.productOccasions.occasionId, schema.occasions.id),
      )
      .where(inArray(schema.productOccasions.productId, productIds));

    const map: Record<string, { id: string; name: string; slug: string }[]> =
      {};
    for (const row of rows) {
      if (!map[row.productId]) map[row.productId] = [];
      map[row.productId].push({
        id: row.occasionId,
        name: row.occasionName,
        slug: row.occasionSlug,
      });
    }
    return map;
  }
}
