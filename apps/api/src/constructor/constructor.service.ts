import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { asc, eq, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@bakery/db/schema';
import { DRIZZLE } from '../database/drizzle.token';
import { CalculatePriceDto } from './dto/calculate.dto';

// Shape surcharges as percentage on top of the base price
const SHAPE_CONFIG = [
  { id: 'circle', name: 'Круг', surchargePercent: 0 },
  { id: 'square', name: 'Квадрат', surchargePercent: 10 },
  { id: 'heart', name: 'Сердце', surchargePercent: 15 },
];

// Tier surcharges as fixed amounts in kopecks
const TIER_SURCHARGES = [
  { tiers: 1, surcharge: 0 },
  { tiers: 2, surcharge: 3000_00 }, // 3000 rub = 300000 kopecks
  { tiers: 3, surcharge: 6000_00 }, // 6000 rub = 600000 kopecks
];

const CONSTRUCTOR_CONFIG = {
  minWeight: 1,
  maxWeight: 10,
  maxDecorations: 20,
  maxInscription: 50,
};

@Injectable()
export class ConstructorService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getIngredients() {
    const [bases, fillings, coatings, decorations] = await Promise.all([
      this.db
        .select()
        .from(schema.constructorBases)
        .where(eq(schema.constructorBases.isAvailable, true))
        .orderBy(asc(schema.constructorBases.sortOrder)),

      this.db
        .select()
        .from(schema.constructorFillings)
        .where(eq(schema.constructorFillings.isAvailable, true))
        .orderBy(asc(schema.constructorFillings.sortOrder)),

      this.db
        .select()
        .from(schema.constructorCoatings)
        .where(eq(schema.constructorCoatings.isAvailable, true))
        .orderBy(asc(schema.constructorCoatings.sortOrder)),

      this.db
        .select()
        .from(schema.constructorDecorations)
        .where(eq(schema.constructorDecorations.isAvailable, true))
        .orderBy(asc(schema.constructorDecorations.sortOrder)),
    ]);

    return {
      bases,
      fillings,
      coatings,
      decorations,
      shapes: SHAPE_CONFIG,
      tierSurcharges: TIER_SURCHARGES,
      config: CONSTRUCTOR_CONFIG,
    };
  }

  async calculatePrice(dto: CalculatePriceDto) {
    const { shape, tiers, coatingId, decorations = [] } = dto;

    // ---- validate shape ----
    const shapeConfig = SHAPE_CONFIG.find((s) => s.id === shape);
    if (!shapeConfig) {
      throw new BadRequestException(
        `Unknown shape "${shape}". Valid values: circle, square, heart`,
      );
    }

    // ---- validate limits ----
    const totalDecorationCount = decorations.reduce(
      (sum, d) => sum + d.quantity,
      0,
    );
    if (totalDecorationCount > CONSTRUCTOR_CONFIG.maxDecorations) {
      throw new BadRequestException(
        `Total decorations count cannot exceed ${CONSTRUCTOR_CONFIG.maxDecorations}`,
      );
    }

    const totalWeightTenthsCheck = tiers.reduce((sum, t) => sum + t.weight, 0);
    if (totalWeightTenthsCheck > CONSTRUCTOR_CONFIG.maxWeight * 10) {
      throw new BadRequestException(
        `Total cake weight cannot exceed ${CONSTRUCTOR_CONFIG.maxWeight} kg`,
      );
    }

    if (
      dto.inscription !== undefined &&
      dto.inscription.length > CONSTRUCTOR_CONFIG.maxInscription
    ) {
      throw new BadRequestException(
        `Inscription cannot exceed ${CONSTRUCTOR_CONFIG.maxInscription} characters`,
      );
    }

    // ---- fetch all referenced ingredients in parallel ----
    const baseIds = [...new Set(tiers.map((t) => t.baseId))];
    const fillingIds = [...new Set(tiers.map((t) => t.fillingId))];
    const decorationIds = [
      ...new Set(decorations.map((d) => d.decorationId)),
    ];

    const [basesRows, fillingsRows, coatingsRows, decorationsRows] =
      await Promise.all([
        this.db
          .select()
          .from(schema.constructorBases)
          .where(inArray(schema.constructorBases.id, baseIds)),

        this.db
          .select()
          .from(schema.constructorFillings)
          .where(inArray(schema.constructorFillings.id, fillingIds)),

        this.db
          .select()
          .from(schema.constructorCoatings)
          .where(eq(schema.constructorCoatings.id, coatingId)),

        decorationIds.length > 0
          ? this.db
              .select()
              .from(schema.constructorDecorations)
              .where(
                inArray(schema.constructorDecorations.id, decorationIds),
              )
          : Promise.resolve([]),
      ]);

    // ---- validate existence and availability ----
    const basesMap = new Map(basesRows.map((b) => [b.id, b]));
    const fillingsMap = new Map(fillingsRows.map((f) => [f.id, f]));
    const decorationsMap = new Map(decorationsRows.map((d) => [d.id, d]));

    if (coatingsRows.length === 0) {
      throw new NotFoundException(`Coating "${coatingId}" not found`);
    }
    const coating = coatingsRows[0];
    if (!coating.isAvailable) {
      throw new BadRequestException(`Coating "${coating.name}" is not available`);
    }

    for (const tier of tiers) {
      if (!basesMap.has(tier.baseId)) {
        throw new NotFoundException(`Base "${tier.baseId}" not found`);
      }
      if (!fillingsMap.has(tier.fillingId)) {
        throw new NotFoundException(`Filling "${tier.fillingId}" not found`);
      }
      const base = basesMap.get(tier.baseId)!;
      const filling = fillingsMap.get(tier.fillingId)!;
      if (!base.isAvailable) {
        throw new BadRequestException(`Base "${base.name}" is not available`);
      }
      if (!filling.isAvailable) {
        throw new BadRequestException(
          `Filling "${filling.name}" is not available`,
        );
      }
    }

    for (const decorItem of decorations) {
      if (!decorationsMap.has(decorItem.decorationId)) {
        throw new NotFoundException(
          `Decoration "${decorItem.decorationId}" not found`,
        );
      }
      const decor = decorationsMap.get(decorItem.decorationId)!;
      if (!decor.isAvailable) {
        throw new BadRequestException(
          `Decoration "${decor.name}" is not available`,
        );
      }
    }

    // ---- price calculation (all amounts in kopecks) ----
    // Weight is stored as integer tenths of kg (e.g. 15 = 1.5 kg)
    // pricePerKg is in kopecks per kg

    let baseIngredientCost = 0;
    let totalWeightTenths = 0;

    for (const tier of tiers) {
      const base = basesMap.get(tier.baseId)!;
      const filling = fillingsMap.get(tier.fillingId)!;
      const weightKg = tier.weight / 10;

      // base sponge + filling per kg * weight
      baseIngredientCost += Math.round(base.pricePerKg * weightKg);
      baseIngredientCost += Math.round(filling.pricePerKg * weightKg);
      totalWeightTenths += tier.weight;
    }

    const totalWeightKg = totalWeightTenths / 10;

    // coating per kg * total weight
    const coatingCost = Math.round(coating.pricePerKg * totalWeightKg);

    // decoration cost = sum(pricePerUnit * quantity)
    let decorationCost = 0;
    for (const decorItem of decorations) {
      const decor = decorationsMap.get(decorItem.decorationId)!;
      decorationCost += decor.pricePerUnit * decorItem.quantity;
    }

    // sub-total before surcharges
    const subtotal = baseIngredientCost + coatingCost + decorationCost;

    // shape surcharge (percentage on subtotal)
    const shapeSurcharge = Math.round(
      (subtotal * shapeConfig.surchargePercent) / 100,
    );

    // tier surcharge (fixed amount)
    const tierEntry = TIER_SURCHARGES.find((t) => t.tiers === tiers.length) ??
      TIER_SURCHARGES[0];
    const tierSurcharge = tierEntry.surcharge;

    const totalPrice = subtotal + shapeSurcharge + tierSurcharge;

    // ---- build breakdown for transparency ----
    const breakdown = {
      tiers: tiers.map((tier) => {
        const base = basesMap.get(tier.baseId)!;
        const filling = fillingsMap.get(tier.fillingId)!;
        const weightKg = tier.weight / 10;
        return {
          weightKg,
          base: { id: base.id, name: base.name, pricePerKg: base.pricePerKg },
          filling: {
            id: filling.id,
            name: filling.name,
            pricePerKg: filling.pricePerKg,
          },
          baseCost: Math.round(base.pricePerKg * weightKg),
          fillingCost: Math.round(filling.pricePerKg * weightKg),
        };
      }),
      coating: {
        id: coating.id,
        name: coating.name,
        pricePerKg: coating.pricePerKg,
        cost: coatingCost,
      },
      decorations: decorations.map((decorItem) => {
        const decor = decorationsMap.get(decorItem.decorationId)!;
        return {
          id: decor.id,
          name: decor.name,
          pricePerUnit: decor.pricePerUnit,
          quantity: decorItem.quantity,
          cost: decor.pricePerUnit * decorItem.quantity,
        };
      }),
      subtotal,
      shapeSurcharge,
      tierSurcharge,
      totalPrice,
      totalWeightKg,
    };

    return {
      totalPrice,
      breakdown,
    };
  }
}
