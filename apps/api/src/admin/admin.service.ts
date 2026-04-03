import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@bakery/db/schema';
import { DRIZZLE } from '../database/drizzle.token';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UpdateOrderStatusDto, OrderStatus } from './dto/update-status.dto';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { UpdateIngredientDto, IngredientType } from './dto/update-ingredient.dto';

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
  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // ---- Orders ----

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

    const [allRows, countRows] = await Promise.all([
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
        .select({ id: schema.orders.id })
        .from(schema.orders)
        .where(where),
    ]);

    const total = countRows.length;

    const data = allRows.map((row) => ({
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

    return updated;
  }

  // ---- Products ----

  async createProduct(dto: CreateProductDto) {
    // Check slug uniqueness
    const [existing] = await this.db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.slug, dto.slug))
      .limit(1);

    if (existing) {
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

    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const [existing] = await this.db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Product "${id}" not found`);
    }

    // Check slug uniqueness if slug is being changed
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

    return updated;
  }

  async deleteProduct(id: string) {
    const [existing] = await this.db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Product "${id}" not found`);
    }

    await this.db
      .delete(schema.products)
      .where(eq(schema.products.id, id));

    return { deleted: true, id };
  }

  // ---- Constructor Ingredients ----

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
    const [existing] = await this.db
      .select({ id: schema.constructorBases.id })
      .from(schema.constructorBases)
      .where(eq(schema.constructorBases.id, id))
      .limit(1);

    if (!existing) throw new NotFoundException(`Base ingredient "${id}" not found`);

    const values: Partial<typeof schema.constructorBases.$inferInsert> = {};
    if (dto.pricePerKg !== undefined) values.pricePerKg = dto.pricePerKg;
    if (dto.isAvailable !== undefined) values.isAvailable = dto.isAvailable;

    const [updated] = await this.db
      .update(schema.constructorBases)
      .set(values)
      .where(eq(schema.constructorBases.id, id))
      .returning();

    return updated;
  }

  private async updateFilling(id: string, dto: UpdateIngredientDto) {
    const [existing] = await this.db
      .select({ id: schema.constructorFillings.id })
      .from(schema.constructorFillings)
      .where(eq(schema.constructorFillings.id, id))
      .limit(1);

    if (!existing) throw new NotFoundException(`Filling ingredient "${id}" not found`);

    const values: Partial<typeof schema.constructorFillings.$inferInsert> = {};
    if (dto.pricePerKg !== undefined) values.pricePerKg = dto.pricePerKg;
    if (dto.isAvailable !== undefined) values.isAvailable = dto.isAvailable;

    const [updated] = await this.db
      .update(schema.constructorFillings)
      .set(values)
      .where(eq(schema.constructorFillings.id, id))
      .returning();

    return updated;
  }

  private async updateCoating(id: string, dto: UpdateIngredientDto) {
    const [existing] = await this.db
      .select({ id: schema.constructorCoatings.id })
      .from(schema.constructorCoatings)
      .where(eq(schema.constructorCoatings.id, id))
      .limit(1);

    if (!existing) throw new NotFoundException(`Coating ingredient "${id}" not found`);

    const values: Partial<typeof schema.constructorCoatings.$inferInsert> = {};
    if (dto.pricePerKg !== undefined) values.pricePerKg = dto.pricePerKg;
    if (dto.isAvailable !== undefined) values.isAvailable = dto.isAvailable;

    const [updated] = await this.db
      .update(schema.constructorCoatings)
      .set(values)
      .where(eq(schema.constructorCoatings.id, id))
      .returning();

    return updated;
  }

  private async updateDecoration(id: string, dto: UpdateIngredientDto) {
    const [existing] = await this.db
      .select({ id: schema.constructorDecorations.id })
      .from(schema.constructorDecorations)
      .where(eq(schema.constructorDecorations.id, id))
      .limit(1);

    if (!existing)
      throw new NotFoundException(`Decoration ingredient "${id}" not found`);

    const values: Partial<typeof schema.constructorDecorations.$inferInsert> = {};
    if (dto.pricePerUnit !== undefined) values.pricePerUnit = dto.pricePerUnit;
    if (dto.isAvailable !== undefined) values.isAvailable = dto.isAvailable;

    const [updated] = await this.db
      .update(schema.constructorDecorations)
      .set(values)
      .where(eq(schema.constructorDecorations.id, id))
      .returning();

    return updated;
  }
}
