CREATE TYPE "public"."filling_category" AS ENUM('white', 'chocolate', 'honey', 'sour_cream', 'shortcrust', 'specialty');--> statement-breakpoint
CREATE TYPE "public"."price_type" AS ENUM('per_kg', 'per_unit');--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "price_per_kg" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "constructor_fillings" ADD COLUMN "category" "filling_category";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "price_type" "price_type" DEFAULT 'per_kg' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "price_per_unit" integer;