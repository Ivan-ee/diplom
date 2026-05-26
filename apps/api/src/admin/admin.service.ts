import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, gte, ilike, inArray, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AnyPgTable } from 'drizzle-orm/pg-core';
import { PgColumn } from 'drizzle-orm/pg-core';
import * as schema from '@bakery/db/schema';
import { DRIZZLE } from '../database/drizzle.token';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UpdateOrderStatusDto, OrderStatus } from './dto/update-status.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { UpdateIngredientDto, IngredientType } from './dto/update-ingredient.dto';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { DeleteIngredientDto } from './dto/delete-ingredient.dto';
import { SearchService } from '../search/search.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddOrderItemDto } from './dto/add-order-item.dto';


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
          phone: schema.orders.phone,
          createdAt: schema.orders.createdAt,
          updatedAt: schema.orders.updatedAt,
          userId: schema.orders.userId,
          userName: schema.users.name,
          userEmail: schema.users.email,
          userPhone: schema.users.phone,
          promoCodeId: schema.orders.promoCodeId,
          discountAmount: schema.orders.discountAmount,
          originalPrice: schema.orders.originalPrice,
          promoCode: schema.promoCodes.code,
        })
        .from(schema.orders)
        .leftJoin(schema.users, eq(schema.orders.userId, schema.users.id))
        .leftJoin(schema.promoCodes, eq(schema.orders.promoCodeId, schema.promoCodes.id))
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
            .select({
              id: schema.orderItems.id,
              orderId: schema.orderItems.orderId,
              type: schema.orderItems.type,
              productId: schema.orderItems.productId,
              cakeConfig: schema.orderItems.cakeConfig,
              weight: schema.orderItems.weight,
              quantity: schema.orderItems.quantity,
              price: schema.orderItems.price,
              inscription: schema.orderItems.inscription,
              screenshotUrl: schema.orderItems.screenshotUrl,
              productName: schema.products.name,
              productImageUrl: schema.products.imageUrl,
            })
            .from(schema.orderItems)
            .leftJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
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
      phone: row.phone ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        id: row.userId,
        name: row.userName,
        email: row.userEmail,
        phone: row.userPhone,
      },
      promoCode: row.promoCode ?? null,
      discountAmount: row.discountAmount ?? null,
      originalPrice: row.originalPrice ?? null,
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
        phone: schema.orders.phone,
        createdAt: schema.orders.createdAt,
        updatedAt: schema.orders.updatedAt,
        userId: schema.orders.userId,
        userName: schema.users.name,
        userEmail: schema.users.email,
        userPhone: schema.users.phone,
        promoCodeId: schema.orders.promoCodeId,
        discountAmount: schema.orders.discountAmount,
        originalPrice: schema.orders.originalPrice,
        promoCode: schema.promoCodes.code,
      })
      .from(schema.orders)
      .leftJoin(schema.users, eq(schema.orders.userId, schema.users.id))
      .leftJoin(schema.promoCodes, eq(schema.orders.promoCodeId, schema.promoCodes.id))
      .where(eq(schema.orders.id, id))
      .limit(1);

    if (!order) {
      throw new NotFoundException(`Order "${id}" not found`);
    }

    const items = await this.db
      .select({
        id: schema.orderItems.id,
        orderId: schema.orderItems.orderId,
        type: schema.orderItems.type,
        productId: schema.orderItems.productId,
        cakeConfig: schema.orderItems.cakeConfig,
        weight: schema.orderItems.weight,
        quantity: schema.orderItems.quantity,
        price: schema.orderItems.price,
        inscription: schema.orderItems.inscription,
        screenshotUrl: schema.orderItems.screenshotUrl,
        productName: schema.products.name,
        productImageUrl: schema.products.imageUrl,
      })
      .from(schema.orderItems)
      .leftJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
      .where(eq(schema.orderItems.orderId, id));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalPrice: order.totalPrice,
      pickupDate: order.pickupDate,
      pickupTimeSlot: order.pickupTimeSlot,
      comment: order.comment,
      phone: order.phone ?? null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      user: {
        id: order.userId,
        name: order.userName,
        email: order.userEmail,
        phone: order.userPhone,
      },
      promoCode: order.promoCode ?? null,
      discountAmount: order.discountAmount ?? null,
      originalPrice: order.originalPrice ?? null,
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

  async updateOrder(id: string, dto: UpdateOrderDto) {
    const [order] = await this.db
      .select({ id: schema.orders.id, status: schema.orders.status })
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);

    if (!order) {
      throw new NotFoundException(`Order "${id}" not found`);
    }

    const updateValues: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.pickupDate !== undefined) updateValues.pickupDate = dto.pickupDate;
    if (dto.pickupTimeSlot !== undefined) updateValues.pickupTimeSlot = dto.pickupTimeSlot;
    if (dto.phone !== undefined) updateValues.phone = dto.phone;
    if (dto.comment !== undefined) updateValues.comment = dto.comment;

    const [updated] = await this.db
      .update(schema.orders)
      .set(updateValues)
      .where(eq(schema.orders.id, id))
      .returning();

    return updated;
  }

  async deleteOrder(id: string) {
    const [order] = await this.db
      .select({ id: schema.orders.id, status: schema.orders.status })
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);

    if (!order) {
      throw new NotFoundException(`Order "${id}" not found`);
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new BadRequestException(
        `Cannot cancel order with status "${order.status}"`,
      );
    }

    await this.db
      .update(schema.orders)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(schema.orders.id, id));

    this.logger.log('Order cancelled by admin', { orderId: id });
    return { cancelled: true, id };
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

  async getAllUsers(query: QueryUsersDto) {
    const { page, limit, order } = query;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (query.role) {
      conditions.push(eq(schema.users.role, query.role));
    }
    if (query.search) {
      const pattern = `%${query.search}%`;
      conditions.push(
        or(
          ilike(schema.users.name, pattern),
          ilike(schema.users.email, pattern),
        ),
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderExpr =
      order === 'asc'
        ? asc(schema.users.createdAt)
        : desc(schema.users.createdAt);

    const [rows, [{ count: total }]] = await Promise.all([
      this.db
        .select({
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          phone: schema.users.phone,
          role: schema.users.role,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt,
        })
        .from(schema.users)
        .where(where)
        .orderBy(orderExpr)
        .limit(limit)
        .offset(offset),

      this.db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(schema.users)
        .where(where),
    ]);

    const data = rows.map(({ ...row }) => {
      const r = row as typeof row & { passwordHash?: string };
      delete r.passwordHash;
      return r;
    });

    return { data, meta: { page, limit, total } };
  }

  async getUserById(id: string) {
    const [user] = await this.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        phone: schema.users.phone,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    if (!user) {
      throw new NotFoundException(`User "${id}" not found`);
    }

    const [{ count: ordersCount }] = await this.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(schema.orders)
      .where(eq(schema.orders.userId, id));

    return { ...user, ordersCount };
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const [existing] = await this.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`User "${id}" not found`);
    }

    const updateValues: Partial<typeof schema.users.$inferInsert> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (dto.name !== undefined) updateValues.name = dto.name;
    if (dto.phone !== undefined) updateValues.phone = dto.phone;
    if (dto.role !== undefined) updateValues.role = dto.role;

    const [updated] = await this.db
      .update(schema.users)
      .set(updateValues)
      .where(eq(schema.users.id, id))
      .returning();

    const { passwordHash: _pw, ...safeUser } = updated as typeof updated & {
      passwordHash?: string;
    };
    return safeUser;
  }

  async getAllCategories() {
    return this.db
      .select({
        id: schema.categories.id,
        name: schema.categories.name,
        slug: schema.categories.slug,
      })
      .from(schema.categories)
      .orderBy(asc(schema.categories.name));
  }

  async deleteOrderItem(orderId: string, itemId: string) {
    const [order] = await this.db
      .select({ id: schema.orders.id, status: schema.orders.status })
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new NotFoundException(`Order "${orderId}" not found`);
    }

    const [item] = await this.db
      .select({ id: schema.orderItems.id, price: schema.orderItems.price })
      .from(schema.orderItems)
      .where(and(eq(schema.orderItems.id, itemId), eq(schema.orderItems.orderId, orderId)))
      .limit(1);

    if (!item) {
      throw new NotFoundException(`Order item "${itemId}" not found`);
    }

    await this.db
      .delete(schema.orderItems)
      .where(eq(schema.orderItems.id, itemId));

    const [{ total }] = await this.db
      .select({ total: sql<number>`cast(coalesce(sum(${schema.orderItems.price}), 0) as int)` })
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, orderId));

    await this.db
      .update(schema.orders)
      .set({ totalPrice: total, updatedAt: new Date() })
      .where(eq(schema.orders.id, orderId));

    this.logger.log('Order item deleted', { orderId, itemId });
    return { deleted: true, itemId, newTotal: total };
  }

  async addOrderItem(orderId: string, dto: AddOrderItemDto) {
    const [order] = await this.db
      .select({ id: schema.orders.id })
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new NotFoundException(`Order "${orderId}" not found`);
    }

    const [product] = await this.db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        pricePerKg: schema.products.pricePerKg,
        pricePerUnit: schema.products.pricePerUnit,
        priceType: schema.products.priceType,
      })
      .from(schema.products)
      .where(and(eq(schema.products.id, dto.productId), eq(schema.products.isDeleted, false)))
      .limit(1);

    if (!product) {
      throw new NotFoundException(`Product "${dto.productId}" not found`);
    }

    const quantity = dto.quantity ?? 1;
    let price: number;
    if (product.priceType === 'per_unit') {
      price = (product.pricePerUnit ?? 0) * quantity;
    } else {
      const weightKg = dto.weight / 10;
      price = Math.round((product.pricePerKg ?? 0) * weightKg) * quantity;
    }

    const [item] = await this.db
      .insert(schema.orderItems)
      .values({
        orderId,
        type: 'product',
        productId: dto.productId,
        weight: String(dto.weight / 10),
        quantity,
        price,
        inscription: dto.inscription ?? null,
      })
      .returning();

    const [{ total }] = await this.db
      .select({ total: sql<number>`cast(coalesce(sum(${schema.orderItems.price}), 0) as int)` })
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, orderId));

    await this.db
      .update(schema.orders)
      .set({ totalPrice: total, updatedAt: new Date() })
      .where(eq(schema.orders.id, orderId));

    this.logger.log('Order item added', { orderId, itemId: item.id, productId: dto.productId });
    return { ...item, productName: product.name, newTotal: total };
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

  async getAdminIngredients() {
    const [bases, fillings, coatings, decorations] = await Promise.all([
      this.db
        .select()
        .from(schema.constructorBases)
        .orderBy(asc(schema.constructorBases.sortOrder)),
      this.db
        .select()
        .from(schema.constructorFillings)
        .orderBy(asc(schema.constructorFillings.sortOrder)),
      this.db
        .select()
        .from(schema.constructorCoatings)
        .orderBy(asc(schema.constructorCoatings.sortOrder)),
      this.db
        .select()
        .from(schema.constructorDecorations)
        .orderBy(asc(schema.constructorDecorations.sortOrder)),
    ]);

    const withAvailable = <T extends { isAvailable: boolean }>(row: T) => ({
      ...row,
      available: row.isAvailable,
    });

    return {
      bases: bases.map(withAvailable),
      fillings: fillings.map(withAvailable),
      coatings: coatings.map(withAvailable),
      decorations: decorations.map(withAvailable),
    };
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
    if (dto.visualKey !== undefined) values['visualKey'] = dto.visualKey;
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
    if (dto.visualKey !== undefined) values['visualKey'] = dto.visualKey;
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
    if (dto.visualKey !== undefined) values['visualKey'] = dto.visualKey;
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
    if (dto.visualKey !== undefined) values['visualKey'] = dto.visualKey;
    if (dto.category !== undefined) values['category'] = dto.category;
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

  async createIngredient(dto: CreateIngredientDto) {
    switch (dto.type) {
      case IngredientType.BASE: {
        const [created] = await this.db
          .insert(schema.constructorBases)
          .values({
            name: dto.name,
            description: dto.description ?? null,
            pricePerKg: dto.pricePerKg ?? 0,
            visualKey: dto.visualKey ?? 'default',
            sortOrder: dto.sortOrder ?? 0,
            isAvailable: dto.isAvailable ?? true,
          })
          .returning();
        this.logger.log('Constructor base created', { id: created.id, name: dto.name });
        return created;
      }
      case IngredientType.FILLING: {
        const [created] = await this.db
          .insert(schema.constructorFillings)
          .values({
            name: dto.name,
            description: dto.description ?? null,
            pricePerKg: dto.pricePerKg ?? 0,
            visualKey: dto.visualKey ?? 'cream',
            sortOrder: dto.sortOrder ?? 0,
            isAvailable: dto.isAvailable ?? true,
          })
          .returning();
        this.logger.log('Constructor filling created', { id: created.id, name: dto.name });
        return created;
      }
      case IngredientType.COATING: {
        const [created] = await this.db
          .insert(schema.constructorCoatings)
          .values({
            name: dto.name,
            pricePerKg: dto.pricePerKg ?? 0,
            type: 'cream',
            visualKey: dto.visualKey ?? 'cream',
            sortOrder: dto.sortOrder ?? 0,
            isAvailable: dto.isAvailable ?? true,
          })
          .returning();
        this.logger.log('Constructor coating created', { id: created.id, name: dto.name });
        return created;
      }
      case IngredientType.DECORATION: {
        const [created] = await this.db
          .insert(schema.constructorDecorations)
          .values({
            name: dto.name,
            pricePerUnit: dto.pricePerUnit ?? 0,
            category: dto.category ?? 'berries',
            visualKey: dto.visualKey ?? 'cream',
            sortOrder: dto.sortOrder ?? 0,
            isAvailable: dto.isAvailable ?? true,
          })
          .returning();
        this.logger.log('Constructor decoration created', { id: created.id, name: dto.name });
        return created;
      }
      default:
        throw new BadRequestException(`Unknown ingredient type: ${String(dto.type)}`);
    }
  }

  async deleteIngredient(id: string, dto: DeleteIngredientDto) {
    const tableMap = {
      [IngredientType.BASE]: { table: schema.constructorBases, idCol: schema.constructorBases.id, label: 'Base' },
      [IngredientType.FILLING]: { table: schema.constructorFillings, idCol: schema.constructorFillings.id, label: 'Filling' },
      [IngredientType.COATING]: { table: schema.constructorCoatings, idCol: schema.constructorCoatings.id, label: 'Coating' },
      [IngredientType.DECORATION]: { table: schema.constructorDecorations, idCol: schema.constructorDecorations.id, label: 'Decoration' },
    };

    const config = tableMap[dto.type];
    if (!config) {
      throw new BadRequestException(`Unknown ingredient type: ${String(dto.type)}`);
    }

    const [existing] = await this.db
      .select({ id: config.idCol })
      .from(config.table)
      .where(eq(config.idCol, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`${config.label} ingredient "${id}" not found`);
    }

    await this.db
      .delete(config.table)
      .where(eq(config.idCol, id));

    this.logger.log(`Constructor ${config.label.toLowerCase()} deleted`, { id });
    return { deleted: true, id };
  }
}
