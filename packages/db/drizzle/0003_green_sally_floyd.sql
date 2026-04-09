ALTER TABLE "constructor_fillings" ALTER COLUMN "category" SET DEFAULT 'specialty';--> statement-breakpoint
UPDATE "constructor_fillings" SET "category" = 'specialty' WHERE "category" IS NULL;--> statement-breakpoint
ALTER TABLE "constructor_fillings" ALTER COLUMN "category" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_price_type_consistency" CHECK (("products"."price_type" = 'per_kg' AND "products"."price_per_kg" IS NOT NULL AND "products"."price_per_unit" IS NULL)
     OR ("products"."price_type" = 'per_unit' AND "products"."price_per_unit" IS NOT NULL AND "products"."price_per_kg" IS NULL));