import { pgTable, uuid, varchar, integer, text, date, timestamp, pgEnum, serial } from 'drizzle-orm/pg-core';
import { users } from './users';

export const orderStatusEnum = pgEnum('order_status', [
  'created',
  'accepted',
  'preparing',
  'ready',
  'picked_up',
  'completed',
  'cancelled',
]);

export const pickupTimeSlotEnum = pgEnum('pickup_time_slot', ['morning', 'day', 'evening']);

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: serial('order_number'),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  status: orderStatusEnum('status').notNull().default('created'),
  /** Total order price in kopecks (1 ruble = 100 kopecks) */
  totalPrice: integer('total_price').notNull(),
  pickupDate: date('pickup_date').notNull(),
  pickupTimeSlot: pickupTimeSlotEnum('pickup_time_slot').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
