import { pgTable, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { products } from './products.js';
import { occasions } from './occasions.js';

export const productOccasions = pgTable(
  'product_occasions',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    occasionId: uuid('occasion_id')
      .notNull()
      .references(() => occasions.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.occasionId] })],
);
