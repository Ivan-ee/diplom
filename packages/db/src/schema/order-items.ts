import { pgTable, uuid, varchar, integer, numeric, text, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { orders } from './orders';
import { products } from './products';

export const orderItemTypeEnum = pgEnum('order_item_type', ['product', 'constructor']);

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  type: orderItemTypeEnum('type').notNull(),
  productId: uuid('product_id').references(() => products.id),
  cakeConfig: jsonb('cake_config'),
  /** Weight in kilograms (decimal, e.g. 1.5 for 1.5 kg) */
  weight: numeric('weight', { precision: 4, scale: 1 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  /** Item price in kopecks */
  price: integer('price').notNull(),
  inscription: varchar('inscription', { length: 50 }),
  screenshotUrl: text('screenshot_url'),
}, (table) => [
  index('order_items_order_id_idx').on(table.orderId),
]);
