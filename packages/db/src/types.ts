import type {
  users,
  categories,
  occasions,
  products,
  constructorBases,
  constructorFillings,
  constructorCoatings,
  constructorDecorations,
  orders,
  orderItems,
  favorites,
  reviews,
} from './schema/index';

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Occasion = typeof occasions.$inferSelect;
export type NewOccasion = typeof occasions.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ConstructorBase = typeof constructorBases.$inferSelect;
export type NewConstructorBase = typeof constructorBases.$inferInsert;

export type ConstructorFilling = typeof constructorFillings.$inferSelect;
export type NewConstructorFilling = typeof constructorFillings.$inferInsert;

export type ConstructorCoating = typeof constructorCoatings.$inferSelect;
export type NewConstructorCoating = typeof constructorCoatings.$inferInsert;

export type ConstructorDecoration = typeof constructorDecorations.$inferSelect;
export type NewConstructorDecoration = typeof constructorDecorations.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type Favorite = typeof favorites.$inferSelect;
export type Review = typeof reviews.$inferSelect;
