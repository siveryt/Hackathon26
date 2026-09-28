// schema.ts
import {
	pgTable,
	serial,
	integer,
	text,
	doublePrecision,
	timestamp,
	boolean
} from 'drizzle-orm/pg-core';

export const task = pgTable('task', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

// Point of Interest
export const poi = pgTable('poi', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	category: text('category').notNull().default('general'),
	latitude: doublePrecision('latitude').notNull(),
	longitude: doublePrecision('longitude').notNull(),
	address: text('address'),
	imageUrl: text('image_url'),
	isPublished: boolean('is_published').notNull().default(false),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export type Poi = typeof poi.$inferSelect;
export type NewPoi = typeof poi.$inferInsert;
