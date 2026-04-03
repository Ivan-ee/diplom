import { relations } from 'drizzle-orm';
import { users } from './users.js';
import { categories } from './categories.js';
import { products } from './products.js';
import { occasions } from './occasions.js';
import { productOccasions } from './product-occasions.js';
import { orders } from './orders.js';
import { orderItems } from './order-items.js';
import { favorites } from './favorites.js';

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  favorites: many(favorites),
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
