import { relations } from 'drizzle-orm';
import { users } from './users';
import { categories } from './categories';
import { products } from './products';
import { occasions } from './occasions';
import { productOccasions } from './product-occasions';
import { orders } from './orders';
import { orderItems } from './order-items';
import { favorites } from './favorites';
import { promoCodes, promoCodeUsages } from './promo-codes';

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  favorites: many(favorites),
  promoCodeUsages: many(promoCodeUsages),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  productOccasions: many(productOccasions),
  orderItems: many(orderItems),
  favorites: many(favorites),
}));

export const occasionsRelations = relations(occasions, ({ many }) => ({
  productOccasions: many(productOccasions),
}));

export const productOccasionsRelations = relations(productOccasions, ({ one }) => ({
  product: one(products, {
    fields: [productOccasions.productId],
    references: [products.id],
  }),
  occasion: one(occasions, {
    fields: [productOccasions.occasionId],
    references: [occasions.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  promoCode: one(promoCodes, {
    fields: [orders.promoCodeId],
    references: [promoCodes.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [favorites.productId],
    references: [products.id],
  }),
}));

export const promoCodesRelations = relations(promoCodes, ({ many }) => ({
  usages: many(promoCodeUsages),
  orders: many(orders),
}));

export const promoCodeUsagesRelations = relations(promoCodeUsages, ({ one }) => ({
  promoCode: one(promoCodes, {
    fields: [promoCodeUsages.promoCodeId],
    references: [promoCodes.id],
  }),
  user: one(users, {
    fields: [promoCodeUsages.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [promoCodeUsages.orderId],
    references: [orders.id],
  }),
}));
