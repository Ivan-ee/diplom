import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, getTableColumns, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@bakery/db/schema';
import { DRIZZLE } from '../database/drizzle.token';
import { ConstructorService } from '../constructor/constructor.service';
import {
  CreateOrderDto,
  CreateOrderItemDto,
  OrderItemType,
} from './dto/create-order.dto';
import { SafeUser } from '../common/types/user.type';
import { PromoCodesService } from '../promo-codes/promo-codes.service';


@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly constructorService: ConstructorService,
    private readonly promoCodesService: PromoCodesService,
  ) {}

  /** Creates order with server-side price recalculation. Client-supplied prices are overridden. */
  async create(dto: CreateOrderDto, user: SafeUser) {
    const pricedItems = await Promise.all(
      dto.items.map((item) => this.recalculateItemPrice(item)),
    );

    const originalPrice = pricedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // --- Promo code validation ---
    let promoCodeId: string | null = null;
    let discountAmount = 0;

    if (dto.promoCode) {
      const validation = await this.promoCodesService.validate(
        dto.promoCode,
        originalPrice,
        user.id,
      );
      if (!validation.valid) {
        throw new BadRequestException(validation.message ?? 'Промокод недействителен');
      }
      promoCodeId = validation.promoCodeId ?? null;
      discountAmount = validation.discountAmount;
    }

    const totalPrice = originalPrice - discountAmount;

    const result = await this.db.transaction(async (tx) => {
      const [order] = await tx
        .insert(schema.orders)
        .values({
          userId: user.id,
          status: 'created',
          totalPrice,
          originalPrice: promoCodeId ? originalPrice : null,
          discountAmount: promoCodeId ? discountAmount : null,
          promoCodeId,
          pickupDate: dto.pickupDate,
          pickupTimeSlot: dto.pickupTimeSlot,
          phone: dto.phone ?? null,
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
            weight: String(item.weight / 10),
            quantity: item.quantity,
            price: item.price,
            inscription: item.inscription ?? null,
            screenshotUrl: item.screenshotUrl ?? null,
          })),
        )
        .returning();

      // Record promo code usage inside the same transaction
      if (promoCodeId) {
        await this.promoCodesService.applyToOrder(
          promoCodeId,
          user.id,
          order.id,
          discountAmount,
          tx,
        );
      }

      return { order, items: itemRows };
    });

    this.logger.log('Order created', {
      orderId: result.order.id,
      userId: user.id,
      totalPrice: result.order.totalPrice,
      ...(promoCodeId && { promoCodeId, discountAmount }),
    });
    return result;
  }

  async findByUser(userId: string) {
    const orders = await this.db
      .select({
        ...getTableColumns(schema.orders),
        promoCode: schema.promoCodes.code,
      })
      .from(schema.orders)
      .leftJoin(schema.promoCodes, eq(schema.orders.promoCodeId, schema.promoCodes.id))
      .where(eq(schema.orders.userId, userId))
      .orderBy(desc(schema.orders.createdAt));

    if (orders.length === 0) return [];

    const orderIds = orders.map((o) => o.id);
    const allItems = await this.db
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
        productPriceType: schema.products.priceType,
      })
      .from(schema.orderItems)
      .leftJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
      .where(inArray(schema.orderItems.orderId, orderIds));

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

  async findOneByUser(orderId: string, userId: string) {
    const [order] = await this.db
      .select({
        ...getTableColumns(schema.orders),
        promoCode: schema.promoCodes.code,
      })
      .from(schema.orders)
      .leftJoin(schema.promoCodes, eq(schema.orders.promoCodeId, schema.promoCodes.id))
      .where(and(eq(schema.orders.id, orderId), eq(schema.orders.userId, userId)))
      .limit(1);

    if (!order) {
      throw new NotFoundException(`Order "${orderId}" not found`);
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
        productPriceType: schema.products.priceType,
      })
      .from(schema.orderItems)
      .leftJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
      .where(eq(schema.orderItems.orderId, orderId));

    return { ...order, items };
  }

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
          priceType: schema.products.priceType,
          pricePerKg: schema.products.pricePerKg,
          pricePerUnit: schema.products.pricePerUnit,
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

      let price: number;
      if (product.priceType === 'per_unit') {
        if (!product.pricePerUnit) {
          throw new BadRequestException(
            `Product "${product.name}" is per_unit but has no pricePerUnit`,
          );
        }
        price = product.pricePerUnit * (item.quantity ?? 1);
      } else {
        if (!product.pricePerKg) {
          throw new BadRequestException(
            `Product "${product.name}" is per_kg but has no pricePerKg`,
          );
        }
        if (item.weight < 5) {
          throw new BadRequestException(
            `Weight for "${product.name}" must be at least 0.5 kg`,
          );
        }
        const weightKg = item.weight / 10;
        price = Math.round(product.pricePerKg * weightKg);
      }
      return { ...item, price };
    }

    if (item.type === OrderItemType.CONSTRUCTOR) {
      if (!item.cakeConfig) {
        throw new BadRequestException(
          'cakeConfig is required for type "constructor"',
        );
      }

      const { totalPrice, breakdown } = await this.constructorService.calculatePrice(
        item.cakeConfig,
      );
      return {
        ...item,
        cakeConfig: {
          ...item.cakeConfig,
          layers: (breakdown.tiers ?? []).map((tier) => ({
            baseId: tier.base.id,
            fillingId: tier.filling.id,
            baseName: tier.base.name,
            fillingName: tier.filling.name,
            weight: tier.weightKg,
          })),
          ...(breakdown.coating ? { coatingName: breakdown.coating.name } : {}),
          decorations: (breakdown.decorations ?? []).map((decoration) => ({
            decorationId: decoration.id,
            name: decoration.name,
            quantity: decoration.quantity,
          })),
        } as unknown as CreateOrderItemDto['cakeConfig'],
        price: totalPrice,
      };
    }

    throw new BadRequestException(`Unknown order item type: ${String(item.type)}`);
  }
}
