ALTER TYPE "public"."line_status" ADD VALUE 'partial';--> statement-breakpoint
ALTER TYPE "public"."pick_event_type" ADD VALUE 'line_partial' BEFORE 'delivered';--> statement-breakpoint
ALTER TABLE "order_lines" ADD COLUMN "picked_quantity" integer;--> statement-breakpoint
ALTER TABLE "order_lines" ADD COLUMN "substitute_lot" text;--> statement-breakpoint
ALTER TABLE "order_lines" ADD COLUMN "substitute_expires_on" date;--> statement-breakpoint
ALTER TABLE "order_lines" ADD COLUMN "substitute_packaging" text;--> statement-breakpoint
ALTER TABLE "order_lines" ADD COLUMN "substitute_note" text;