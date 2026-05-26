ALTER TYPE "public"."decor_category" ADD VALUE 'candle';--> statement-breakpoint
ALTER TABLE "constructor_bases" ADD COLUMN "visual_key" varchar(64) DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "constructor_coatings" ADD COLUMN "visual_key" varchar(64) DEFAULT 'cream' NOT NULL;--> statement-breakpoint
ALTER TABLE "constructor_decorations" ADD COLUMN "visual_key" varchar(64) DEFAULT 'cream' NOT NULL;--> statement-breakpoint
ALTER TABLE "constructor_fillings" ADD COLUMN "visual_key" varchar(64) DEFAULT 'cream' NOT NULL;