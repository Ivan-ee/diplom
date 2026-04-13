import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@bakery/db/schema';
import { DRIZZLE } from '../database/drizzle.token';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';

export interface ValidatePromoCodeResult {
  valid: boolean;
  promoCodeId?: string;
  code: string;
  discountType?: string;
  discountValue?: number;
  discountAmount: number;
  message?: string;
}

@Injectable()
export class PromoCodesService {
  private readonly logger = new Logger(PromoCodesService.name);

  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(dto: CreatePromoCodeDto) {
    const [existing] = await this.db
      .select({ id: schema.promoCodes.id })
      .from(schema.promoCodes)
      .where(eq(schema.promoCodes.code, dto.code))
      .limit(1);

    if (existing) {
      throw new ConflictException(`Promo code "${dto.code}" already exists`);
    }

    const [created] = await this.db
      .insert(schema.promoCodes)
      .values({
        code: dto.code,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderAmount: dto.minOrderAmount ?? null,
        maxDiscountAmount: dto.maxDiscountAmount ?? null,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        usageLimit: dto.usageLimit ?? null,
        usageLimitPerUser: dto.usageLimitPerUser ?? null,
        isActive: dto.isActive ?? true,
        description: dto.description ?? null,
      })
      .returning();

    this.logger.log('Promo code created', { code: created.code, id: created.id });
    return created;
  }

  async findAll(query: { page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const [data, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(schema.promoCodes)
        .orderBy(desc(schema.promoCodes.createdAt))
        .limit(limit)
        .offset(offset),

      this.db
        .select({ total: sql<number>`cast(count(*) as int)` })
        .from(schema.promoCodes),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { data, meta: { page, limit, total, totalPages } };
  }

  async findById(id: string) {
    const [promo] = await this.db
      .select()
      .from(schema.promoCodes)
      .where(eq(schema.promoCodes.id, id))
      .limit(1);

    if (!promo) {
      throw new NotFoundException(`Promo code "${id}" not found`);
    }

    return promo;
  }

  async update(id: string, dto: UpdatePromoCodeDto) {
    await this.findById(id);

    if (dto.code !== undefined) {
      const [conflict] = await this.db
        .select({ id: schema.promoCodes.id })
        .from(schema.promoCodes)
        .where(eq(schema.promoCodes.code, dto.code))
        .limit(1);

      if (conflict && conflict.id !== id) {
        throw new ConflictException(`Promo code "${dto.code}" already exists`);
      }
    }

    const updateValues: Partial<typeof schema.promoCodes.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.code !== undefined) updateValues.code = dto.code;
    if (dto.discountType !== undefined) updateValues.discountType = dto.discountType;
    if (dto.discountValue !== undefined) updateValues.discountValue = dto.discountValue;
    if (dto.minOrderAmount !== undefined) updateValues.minOrderAmount = dto.minOrderAmount;
    if (dto.maxDiscountAmount !== undefined) updateValues.maxDiscountAmount = dto.maxDiscountAmount;
    if (dto.startsAt !== undefined) updateValues.startsAt = new Date(dto.startsAt);
    if (dto.expiresAt !== undefined) updateValues.expiresAt = new Date(dto.expiresAt);
    if (dto.usageLimit !== undefined) updateValues.usageLimit = dto.usageLimit;
    if (dto.usageLimitPerUser !== undefined) updateValues.usageLimitPerUser = dto.usageLimitPerUser;
    if (dto.isActive !== undefined) updateValues.isActive = dto.isActive;
    if (dto.description !== undefined) updateValues.description = dto.description;

    const [updated] = await this.db
      .update(schema.promoCodes)
      .set(updateValues)
      .where(eq(schema.promoCodes.id, id))
      .returning();

    this.logger.log('Promo code updated', { id, fields: Object.keys(updateValues) });
    return updated;
  }

  async deactivate(id: string) {
    await this.findById(id);

    const [updated] = await this.db
      .update(schema.promoCodes)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.promoCodes.id, id))
      .returning();

    this.logger.log('Promo code deactivated', { id });
    return updated;
  }

  async validate(
    code: string,
    cartTotal: number,
    userId: string,
  ): Promise<ValidatePromoCodeResult> {
    const [promo] = await this.db
      .select()
      .from(schema.promoCodes)
      .where(eq(schema.promoCodes.code, code.toUpperCase()))
      .limit(1);

    if (!promo) {
      return { valid: false, code, discountAmount: 0, message: 'Промокод не найден' };
    }

    if (!promo.isActive) {
      return { valid: false, code, discountAmount: 0, message: 'Промокод недействителен' };
    }

    if (promo.startsAt && new Date() < promo.startsAt) {
      return { valid: false, code, discountAmount: 0, message: 'Промокод ещё не действует' };
    }

    if (promo.expiresAt && new Date() > promo.expiresAt) {
      return { valid: false, code, discountAmount: 0, message: 'Срок действия промокода истёк' };
    }

    if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
      return { valid: false, code, discountAmount: 0, message: 'Промокод исчерпан' };
    }

    if (promo.usageLimitPerUser !== null) {
      const [{ userUsageCount }] = await this.db
        .select({ userUsageCount: sql<number>`cast(count(*) as int)` })
        .from(schema.promoCodeUsages)
        .where(
          and(
            eq(schema.promoCodeUsages.promoCodeId, promo.id),
            eq(schema.promoCodeUsages.userId, userId),
          ),
        );

      if (userUsageCount >= promo.usageLimitPerUser) {
        return {
          valid: false,
          code,
          discountAmount: 0,
          message: 'Вы уже использовали этот промокод максимальное число раз',
        };
      }
    }

    if (promo.minOrderAmount !== null && cartTotal < promo.minOrderAmount) {
      return {
        valid: false,
        code,
        discountAmount: 0,
        message: `Минимальная сумма заказа для этого промокода — ${(promo.minOrderAmount / 100).toFixed(0)} руб.`,
      };
    }

    let discountAmount: number;

    if (promo.discountType === 'percentage') {
      discountAmount = Math.round((cartTotal * promo.discountValue) / 100);
      if (promo.maxDiscountAmount !== null && discountAmount > promo.maxDiscountAmount) {
        discountAmount = promo.maxDiscountAmount;
      }
    } else {
      discountAmount = Math.min(promo.discountValue, cartTotal);
    }

    return {
      valid: true,
      promoCodeId: promo.id,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount,
    };
  }

  async applyToOrder(
    promoCodeId: string,
    userId: string,
    orderId: string,
    discountAmount: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any,
  ): Promise<void> {
    await tx.insert(schema.promoCodeUsages).values({
      promoCodeId,
      userId,
      orderId,
      discountAmount,
    });

    await tx
      .update(schema.promoCodes)
      .set({ usageCount: sql`${schema.promoCodes.usageCount} + 1` })
      .where(eq(schema.promoCodes.id, promoCodeId));
  }
}
