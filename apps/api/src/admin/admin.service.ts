import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AnyPgTable } from 'drizzle-orm/pg-core';
import { PgColumn } from 'drizzle-orm/pg-core';
import * as schema from '@bakery/db/schema';
import { DRIZZLE } from '../database/drizzle.token';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UpdateOrderStatusDto, OrderStatus } from './dto/update-status.dto';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { UpdateIngredientDto, IngredientType } from './dto/update-ingredient.dto';
import { SearchService } from '../search/search.service';

// Valid transitions: current status -> allowed next statuses
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.CREATED]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  [OrderStatus.PICKED_UP]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly searchService: SearchService,
  ) {}

  async getStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      [{ newOrdersToday }],
      [{ ordersInProgress }],
      [{ totalRevenue }],
      recentOrders,
    ] = await Promise.all([
      this.db
        .select({ newOrdersToday: sql<number>`cast(count(*) as int)` })
        .from(schema.orders)
        .where(
          and(
            gte(schema.orders.createdAt, todayStart),
            sql`${schema.orders.status} != 'cancelled'`,
          ),
        ),

      this.db
        .select({ ordersInProgress: sql<number>`cast(count(*) as int)` })
        .from(schema.orders)
        .where(
          inArray(schema.orders.status, ['created', 'accepted', 'preparing']),
        ),

      this.db
        .select({
          totalRevenue: sql<number>`cast(coalesce(sum(${schema.orders.totalPrice}), 0) as int)`,
        })
        .from(schema.orders)
        .where(inArray(schema.orders.status, ['completed', 'picked_up'])),

      this.db
        .select({
          id: schema.orders.id,
          orderNumber: schema.orders.orderNumber,
          status: schema.orders.status,
          totalPrice: schema.orders.totalPrice,
          createdAt: schema.orders.createdAt,
        })
        .from(schema.orders)
        .orderBy(desc(schema.orders.createdAt))
        .limit(5),
    ]);

    return {
      newOrdersToday,
      ordersInProgress,
      totalRevenue,
      recentOrders,
    };
  }

  async getAllProducts(query: PaginationDto) {
    const { page, limit, order } = query;
    const offset = (page - 1) * limit;

    const orderExpr =
      order === 'asc'
        ? asc(schema.products.createdAt)
        : desc(schema.products.createdAt);

    const [rows, [{ count: total }]] = await Promise.all([
      this.db
        .select({
          id: schema.products.id,
          slug: schema.products.slug,
          name: schema.products.name,
          description: schema.products.description,
          imageUrl: schema.products.imageUrl,
          images: schema.products.images,
          priceType: schema.products.priceType,
          pricePerKg: schema.products.pricePerKg,
          pricePerUnit: schema.products.pricePerUnit,
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
        .where(eq(schema.products.isDeleted, false))
        .orderBy(orderExpr)
        .limit(limit)
        .offset(offset),

      this.db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(schema.products)
        .where(eq(schema.products.isDeleted, false)),
    ]);

    const data = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      imageUrl: row.imageUrl,
      images: row.images,
      priceType: row.priceType,
      pricePerKg: row.pricePerKg,
      pricePerUnit: row.pricePerUnit,
      minWeight: row.minWeight,
      maxWeight: row.maxWeight,
      weightStep: row.weightStep,
      isAvailable: row.isAvailable,
      createdAt: row.createdAt,
      category: row.categoryId
        ? { id: row.categoryId, name: row.categoryName, slug: row.categorySlug }
        : null,
    }));

    return { data, meta: { page, limit, total } };
  }

  async getAllOrders(query: PaginationDto & { status?: string }) {
    const { page, limit, order } = query;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (query.status) {
      conditions.push(
        eq(
          schema.orders.status,
          query.status as 'created' | 'accepted' | 'preparing' | 'ready' | 'picked_up' | 'completed' | 'cancelled',
        ),
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderExpr =
      order === 'asc'
        ? asc(schema.orders.createdAt)
        : desc(schema.orders.createdAt);

    const [paginatedOrders, [{ count: total }]] = await Promise.all([
      this.db
        .select({
          id: schema.orders.id,
          orderNumber: schema.orders.orderNumber,
          status: schema.orders.status,
          totalPrice: schema.orders.totalPrice,
          pickupDate: schema.orders.pickupDate,
          pickupTimeSlot: schema.orders.pickupTimeSlot,
          comment: schema.orders.comment,
          createdAt: schema.orders.createdAt,
          updatedAt: schema.orders.updatedAt,
          userId: schema.orders.userId,
          userName: schema.users.name,
          userEmail: schema.users.email,
          userPhone: schema.users.phone,
        })
        .from(schema.orders)
        .leftJoin(schema.users, eq(schema.orders.userId, schema.users.id))
        .where(where)
        .orderBy(orderExpr)
        .limit(limit)
        .offset(offset),

      this.db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(schema.orders)
        .where(where),
    ]);

    const orderIds = paginatedOrders.map((row) => row.id);

    const allItems =
      orderIds.length > 0
        ? await this.db
            .select()
            .from(schema.orderItems)
            .where(inArray(schema.orderItems.orderId, orderIds))
        : [];

    const itemsByOrderId = new Map<string, typeof allItems>();
    for (const item of allItems) {
      const list = itemsByOrderId.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrderId.set(item.orderId, list);
    }

    const data = paginatedOrders.map((row) => ({
      id: row.id,
      orderNumber: row.orderNumber,
      status: row.status,
      totalPrice: row.totalPrice,
      pickupDate: row.pickupDate,
      pickupTimeSlot: row.pickupTimeSlot,
      comment: row.comment,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        id: row.userId,
        name: row.userName,
        email: row.userEmail,
        phone: row.userPhone,
      },
      items: itemsByOrderId.get(row.id) ?? [],
    }));

    return { data, meta: { page, limit, total } };
  }

  async getOrderById(id: string) {
    const [order] = await this.db
      .select({
        id: schema.orders.id,
        orderNumber: schema.orders.orderNumber,
        status: schema.orders.status,
        totalPrice: schema.orders.totalPrice,
        pickupDate: schema.orders.pickupDate,
        pickupTimeSlot: schema.orders.pickupTimeSlot,
        comment: schema.orders.comment,
        createdAt: schema.orders.createdAt,
        updatedAt: schema.orders.updatedAt,
        userId: schema.orders.userId,
        userName: schema.users.name,
        userEmail: schema.users.email,
        userPhone: schema.users.phone,
      })
      .from(schema.orders)
      .leftJoin(schema.users, eq(schema.orders.userId, schema.users.id))
      .where(eq(schema.orders.id, id))
      .limit(1);

    if (!order) {
      throw new NotFoundException(`Order "${id}" not found`);
    }

    const items = await this.db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, id));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalPrice: order.totalPrice,
      pickupDate: order.pickupDate,
      pickupTimeSlot: order.pickupTimeSlot,
      comment: order.comment,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      user: {
        id: order.userId,
        name: order.userName,
        email: order.userEmail,
        phone: order.userPhone,
      },
      items,
    };
  }

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const [order] = await this.db
      .select({ id: schema.orders.id, status: schema.orders.status })
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);

    if (!order) {
      throw new NotFoundException(`Order "${id}" not found`);
    }

    const currentStatus = order.status as OrderStatus;
    const nextStatus = dto.status;
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] ?? [];

    if (!allowedTransitions.includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot transition order from "${currentStatus}" to "${nextStatus}". ` +
          `Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`,
      );
    }

    const [updated] = await this.db
      .update(schema.orders)
      .set({
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, id))
      .returning();

    this.logger.log('Order status changed', {
      orderId: id,
      from: currentStatus,
      to: nextStatus,
    });
    return updated;
  }

  async createProduct(dto: CreateProductDto) {
    const [existingProduct] = await this.db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.slug, dto.slug))
      .limit(1);

    if (existingProduct) {
      throw new ConflictException(`Product with slug "${dto.slug}" already exists`);
    }

    const [product] = await this.db
      .insert(schema.products)
      .values({
        slug: dto.slug,
        name: dto.name,
        description: dto.description ?? null,
        composition: dto.composition ?? null,
        imageUrl: dto.imageUrl ?? null,
        images: dto.images ?? [],
        pricePerKg: dto.pricePerKg,
        minWeight: dto.minWeight ?? '1.0',
        maxWeight: dto.maxWeight ?? '5.0',
        weightStep: dto.weightStep ?? '0.5',
        categoryId: dto.categoryId ?? null,
        isAvailable: dto.isAvailable ?? true,
      })
      .returning();

    await this.syncProductToSearch(product);
    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const [existingProduct] = await this.db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.id, id))
      .limit(1);

    if (!existingProduct) {
      throw new NotFoundException(`Product "${id}" not found`);
    }

    if (dto.slug) {
      const [slugConflict] = await this.db
        .select({ id: schema.products.id })
        .from(schema.products)
        .where(eq(schema.products.slug, dto.slug))
        .limit(1);

      if (slugConflict && slugConflict.id !== id) {
        throw new ConflictException(
          `Product with slug "${dto.slug}" already exists`,
        );
      }
    }

    const updateValues: Partial<typeof schema.products.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.slug !== undefined) updateValues.slug = dto.slug;
    if (dto.name !== undefined) updateValues.name = dto.name;
    if (dto.description !== undefined) updateValues.description = dto.description;
    if (dto.composition !== undefined) updateValues.composition = dto.composition;
    if (dto.imageUrl !== undefined) updateValues.imageUrl = dto.imageUrl;
    if (dto.images !== undefined) updateValues.images = dto.images;
    if (dto.pricePerKg !== undefined) updateValues.pricePerKg = dto.pricePerKg;
    if (dto.minWeight !== undefined) updateValues.minWeight = dto.minWeight;
    if (dto.maxWeight !== undefined) updateValues.maxWeight = dto.maxWeight;
    if (dto.weightStep !== undefined) updateValues.weightStep = dto.weightStep;
    if (dto.categoryId !== undefined) updateValues.categoryId = dto.categoryId;
    if (dto.isAvailable !== undefined) updateValues.isAvailable = dto.isAvailable;

    const [updated] = await this.db
      .update(schema.products)
      .set(updateValues)
      .where(eq(schema.products.id, id))
      .returning();

    await this.syncProductToSearch(updated);
    return updated;
  }

  async deleteProduct(id: string) {
    const [existingProduct] = await this.db
      .select({ id: schema.products.id, isDeleted: schema.products.isDeleted })
      .from(schema.products)
      .where(eq(schema.products.id, id))
      .limit(1);

    if (!existingProduct) {
      throw new NotFoundException(`Product "${id}" not found`);
    }

    if (existingProduct.isDeleted) {
      throw new NotFoundException(`Product "${id}" not found`);
    }

    await this.db
      .update(schema.products)
      .set({ isDeleted: true, isAvailable: false, updatedAt: new Date() })
      .where(eq(schema.products.id, id));

    await this.removeProductFromSearch(id);
    return { deleted: true, id };
  }

  private async getCategoryName(categoryId: string | null): Promise<string> {
    if (!categoryId) return '';
    const [cat] = await this.db
      .select({ name: schema.categories.name })
      .from(schema.categories)
      .where(eq(schema.categories.id, categoryId))
      .limit(1);
    return cat?.name ?? '';
  }

  private async syncProductToSearch(product: typeof schema.products.$inferSelect): Promise<void> {
    try {
      if (!product.isAvailable || product.isDeleted) {
        await this.searchService.removeProduct(product.id);
        return;
      }
      const categoryName = await this.getCategoryName(product.categoryId);
      await this.searchService.indexProduct({
        id: product.id,
        name: product.name,
        description: product.description ?? '',
        slug: product.slug,
        imageUrl: product.imageUrl ?? null,
        pricePerKg: product.pricePerKg ?? null,
        pricePerUnit: product.pricePerUnit ?? null,
        priceType: product.priceType,
        category: categoryName,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to sync product ${product.id} to search index: ${(err as Error).message}`,
      );
    }
  }

  private async removeProductFromSearch(id: string): Promise<void> {
    try {
      await this.searchService.removeProduct(id);
    } catch (err) {
      this.logger.warn(
        `Failed to remove product ${id} from search index: ${(err as Error).message}`,
      );
    }
  }

  async updateIngredient(id: string, dto: UpdateIngredientDto) {
    switch (dto.type) {
      case IngredientType.BASE:
        return this.updateBase(id, dto);
      case IngredientType.FILLING:
        return this.updateFilling(id, dto);
      case IngredientType.COATING:
        return this.updateCoating(id, dto);
      case IngredientType.DECORATION:
        return this.updateDecoration(id, dto);
      default:
        throw new BadRequestException(`Unknown ingredient type: ${String(dto.type)}`);
    }
  }

  private async updateBase(id: string, dto: UpdateIngredientDto) {
    const values: Record<string, unknown> = {};
    if (dto.pricePerKg !== undefined) values['pricePerKg'] = dto.pricePerKg;
    if (dto.isAvailable !== undefined) values['isAvailable'] = dto.isAvailable;
    return this.updateIngredientTable(
      schema.constructorBases,
      schema.constructorBases.id,
      id,
      values,
      'Base',
    );
  }

  private async updateFilling(id: string, dto: UpdateIngredientDto) {
    const values: Record<string, unknown> = {};
    if (dto.pricePerKg !== undefined) values['pricePerKg'] = dto.pricePerKg;
    if (dto.isAvailable !== undefined) values['isAvailable'] = dto.isAvailable;
    return this.updateIngredientTable(
      schema.constructorFillings,
      schema.constructorFillings.id,
      id,
      values,
      'Filling',
    );
  }

  private async updateCoating(id: string, dto: UpdateIngredientDto) {
    const values: Record<string, unknown> = {};
    if (dto.pricePerKg !== undefined) values['pricePerKg'] = dto.pricePerKg;
    if (dto.isAvailable !== undefined) values['isAvailable'] = dto.isAvailable;
    return this.updateIngredientTable(
      schema.constructorCoatings,
      schema.constructorCoatings.id,
      id,
      values,
      'Coating',
    );
  }

  private async updateDecoration(id: string, dto: UpdateIngredientDto) {
    const values: Record<string, unknown> = {};
    if (dto.pricePerUnit !== undefined) values['pricePerUnit'] = dto.pricePerUnit;
    if (dto.isAvailable !== undefined) values['isAvailable'] = dto.isAvailable;
    return this.updateIngredientTable(
      schema.constructorDecorations,
      schema.constructorDecorations.id,
      id,
      values,
      'Decoration',
    );
  }

  private async updateIngredientTable(
    table: AnyPgTable,
    idCol: PgColumn,
    id: string,
    values: Record<string, unknown>,
    label: string,
  ) {
    const [existing] = await this.db
      .select({ id: idCol })
      .from(table)
      .where(eq(idCol, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`${label} ingredient "${id}" not found`);
    }

    const [updated] = await this.db
      .update(table)
      .set(values)
      .where(eq(idCol, id))
      .returning();

    return updated;
  }
}
