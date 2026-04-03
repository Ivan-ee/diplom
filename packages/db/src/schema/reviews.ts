import { pgTable, uuid, varchar, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorName: varchar('author_name', { length: 100 }).notNull(),
  text: text('text').notNull(),
  rating: integer('rating').notNull(),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
