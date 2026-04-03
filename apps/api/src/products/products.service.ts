import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AnyColumn, and, asc, desc, eq, gte, inArray, lte, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@bakery/db/schema';
import { DRIZZLE } from '../database/drizzle.token';
import { QueryProductsDto } from './dto/query-products.dto';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(query: QueryProductsDto) {
    const { page, limit, sort, order, type, occasion, priceMin, priceMax } =
      query;
    const offset = (page - 1) * limit;

    // ---- resolve category id from slug ----
    let categoryId: string | undefined;
    if (type) {
      const [cat] = await this.db
        .select({ id: schema.categories.id })
        .from(schema.categories)
        .where(eq(schema.categories.slug, type))
        .limit(1);
      if (!cat) {
        return {
          data: [],
          meta: { page, limit, total: 0 },
        };
      }
      categoryId = cat.id;
    }

    // ---- resolve occasion id from slug ----
    let occasionId: string | undefined;
    if (occasion) {
      const [occ] = await this.db
        .select({ id: schema.occasions.id })
        .from(schema.occasions)
        .where(eq(schema.occasions.slug, occasion))
        .limit(1);
      if (!occ) {
        return {
          data: [],
          meta: { page, limit, total: 0 },
        };
      }
      occasionId = occ.id;
    }

    // ---- collect product ids that match the occasion filter ----
    let occasionProductIds: string[] | undefined;
    if (occasionId) {
      const rows = await this.db
        .select({ productId: schema.productOccasions.productId })
        .from(schema.productOccasions)
        .where(eq(schema.productOccasions.occasionId, occasionId));
      occasionProductIds = rows.map((r) => r.productId);
      if (occasionProductIds.length === 0) {
        return {
          data: [],
          meta: { page, limit, total: 0 },
        };
      }
    }

    // ---- build WHERE conditions ----
    const conditions: SQL[] = [eq(schema.products.isAvailable, true)];

    if (categoryId) {
      conditions.push(eq(schema.products.categoryId, categoryId));
    }
    if (occasionProductIds) {
      conditions.push(inArray(schema.products.id, occasionProductIds));
    }
    if (priceMin !== undefined) {
      conditions.push(gte(schema.products.pricePerKg, priceMin));
    }
    if (priceMax !== undefined) {
      conditions.push(lte(schema.products.pricePerKg, priceMax));
    }

    const where = and(...conditions);

    // ---- resolve sort column ----
    const sortableColumns: Record<string, AnyColumn> = {
      createdAt: schema.products.createdAt,
      pricePerKg: schema.products.pricePerKg,
      name: schema.products.name,
    };
    const sortCol: AnyColumn =
      sortableColumns[sort ?? 'createdAt'] ?? schema.products.createdAt;
    const orderExpr = order === 'asc' ? asc(sortCol) : desc(sortCol);

    // ---- fetch total count ----
    const countResult = await this.db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(where);
    const total = countResult.length;

    // ---- fetch paginated products with category ----
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

    // ---- attach occasions to each product ----
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

    if (!row) {
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
