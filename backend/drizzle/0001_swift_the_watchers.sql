ALTER TYPE "public"."admin_action" ADD VALUE 'update_worker';--> statement-breakpoint
CREATE TABLE "stop_causes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"attributable" boolean NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stop_causes" ADD CONSTRAINT "stop_causes_created_by_accounts_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "stop_causes_name_unique" ON "stop_causes" USING btree (lower("name"));