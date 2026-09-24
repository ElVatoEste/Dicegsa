CREATE TYPE "public"."admin_action" AS ENUM('create', 'reset_password', 'change_role', 'deactivate', 'reactivate');--> statement-breakpoint
CREATE TYPE "public"."floor_role" AS ENUM('picker', 'checker');--> statement-breakpoint
CREATE TYPE "public"."system_role" AS ENUM('operator', 'supervisor', 'management', 'admin');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "system_role" DEFAULT 'operator' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"must_change_password" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"target_account_id" uuid NOT NULL,
	"action" "admin_action" NOT NULL,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"floor_role" "floor_role" DEFAULT 'picker' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workers_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
ALTER TABLE "admin_events" ADD CONSTRAINT "admin_events_actor_id_accounts_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_events" ADD CONSTRAINT "admin_events_target_account_id_accounts_id_fk" FOREIGN KEY ("target_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers" ADD CONSTRAINT "workers_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_account_name_unique" ON "accounts" USING btree (lower("account_name"));