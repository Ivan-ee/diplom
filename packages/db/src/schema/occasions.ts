import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

export const occasions = pgTable('occasions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
});
