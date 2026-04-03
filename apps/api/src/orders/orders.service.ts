import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@bakery/db/schema';
import { DRIZZLE } from '../database/drizzle.token';
import { ConstructorService } from '../constructor/constructor.service';
import {
  CreateOrderDto,
  CreateOrderItemDto,
  OrderItemType,
} from './dto/create-order.dto';


@Injectable()
export class OrdersService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly constructorService: ConstructorService,
  ) {}

  async create(dto: CreateOrderDto, user: any) {
    // ---- server-side price recalculation for each item ----
    const pricedItems = await Promise.all(
      dto.items.map((item) => this.recalculateItemPrice(item)),
    );

    const totalPrice = pricedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // ---- insert order + items in a single transaction ----
    const result = await this.db.transaction(async (tx) => {
      const [order] = await tx
        .insert(schema.orders)
        .values({
          userId: user.id,
          status: 'created',
          totalPrice,
          pickupDate: dto.pickupDate,
          pickupTimeSlot: dto.pickupTimeSlot,
          comment: dto.comment ?? null,
        })
        .returning();

      const itemRows = await tx
        .insert(schema.orderItems)
        .values(
          pricedItems.map((item) => ({
            orderId: order.id,
            type: item.type as 'product' | 'constructor',
            productId: item.productId ?? null,
            cakeConfig: item.cakeConfig ?? null,
            weight: String(item.weight / 10), // store as decimal string
            quantity: item.quantity,
            price: item.price,
            inscription: item.inscription ?? null,
            screenshotUrl: item.screenshotUrl ?? null,
          })),
        )
        .returning();

      return { order, items: itemRows };
    });

    return result;
  }

  async findByUser(userId: string) {
    const orders = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.userId, userId))
      .orderBy(schema.orders.createdAt);

    if (orders.length === 0) return [];

    const orderIds = orders.map((o) => o.id);
    const allItems = await this.db
      .select()
      .from(schema.orderItems)
      .where(
        orderIds.length === 1
          ? eq(schema.orderItems.orderId, orderIds[0])
          : inArray(schema.orderItems.orderId, orderIds),
      );

    const itemsByOrder = new Map<string, typeof allItems>();
    for (const item of allItems) {
      if (!itemsByOrder.has(item.orderId)) itemsByOrder.set(item.orderId, []);
      itemsByOrder.get(item.orderId)!.push(item);
    }

    return orders.map((order) => ({
      ...order,
      items: itemsByOrder.get(order.id) ?? [],
    }));
  }

  // ---- private helpers ----

  private async recalculateItemPrice(item: CreateOrderItemDto): Promise<
    CreateOrderItemDto & { price: number }
  > {
    if (item.type === OrderItemType.PRODUCT) {
      if (!item.productId) {
        throw new BadRequestException(
          'productId is required for type "product"',
        );
      }

      const [product] = await this.db
        .select({
          id: schema.products.id,
          pricePerKg: schema.products.pricePerKg,
          isAvailable: schema.products.isAvailable,
          name: schema.products.name,
        })
        .from(schema.products)
        .where(eq(schema.products.id, item.productId))
        .limit(1);

      if (!product) {
        throw new NotFoundException(`Product "${item.productId}" not found`);
      }
      if (!product.isAvailable) {
        throw new BadRequestException(
          `Product "${product.name}" is not currently available`,
        );
      }

      const weightKg = item.weight / 10;
      const price = Math.round(product.pricePerKg * weightKg);
      return { ...item, price };
    }

    if (item.type === OrderItemType.CONSTRUCTOR) {
      if (!item.cakeConfig) {
        throw new BadRequestException(
          'cakeConfig is required for type "constructor"',
        );
      }

      const { totalPrice } = await this.constructorService.calculatePrice(
        item.cakeConfig,
      );
      return { ...item, price: totalPrice };
    }

    throw new BadRequestException(`Unknown order item type: ${String(item.type)}`);
  }
}
