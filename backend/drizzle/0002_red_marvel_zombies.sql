CREATE TYPE "public"."catalog_kind" AS ENUM('dispatch_zone', 'inventory_zone', 'error_type');--> statement-breakpoint
CREATE TYPE "public"."line_status" AS ENUM('pending', 'picked', 'not_found', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."pick_event_type" AS ENUM('started', 'line_picked', 'line_not_found', 'line_reset', 'delivered', 'validated', 'returned');--> statement-breakpoint
CREATE TYPE "public"."pick_list_status" AS ENUM('assigned', 'picking', 'validating', 'returned', 'done');--> statement-breakpoint
ALTER TYPE "public"."system_role" ADD VALUE 'validator' BEFORE 'supervisor';--> statement-breakpoint
ALTER TYPE "public"."system_role" ADD VALUE 'control_desk' BEFORE 'supervisor';--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pick_list_id" uuid NOT NULL,
	"assignee_id" uuid NOT NULL,
	"assigned_by" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"details" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "catalog_kind" NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_code" text NOT NULL,
	"product_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"lot" text NOT NULL,
	"expires_on" date,
	"status" "line_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"client_code" text NOT NULL,
	"client_name" text NOT NULL,
	"department" text NOT NULL,
	"municipality" text NOT NULL,
	"notes" text,
	"due_at" timestamp with time zone NOT NULL,
	"dispatch_zone_id" uuid,
	"inventory_zone_id" uuid,
	"pick_list_id" uuid,
	"cancelled_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "pick_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pick_list_id" uuid NOT NULL,
	"line_id" uuid,
	"account_id" uuid NOT NULL,
	"type" "pick_event_type" NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pick_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" serial NOT NULL,
	"status" "pick_list_status" DEFAULT 'assigned' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pick_lists_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pick_list_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"cause_id" uuid NOT NULL,
	"note" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "validation_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pick_list_id" uuid NOT NULL,
	"line_id" uuid NOT NULL,
	"picker_id" uuid NOT NULL,
	"validator_id" uuid NOT NULL,
	"error_type_id" uuid NOT NULL,
	"units" integer NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_pick_list_id_pick_lists_id_fk" FOREIGN KEY ("pick_list_id") REFERENCES "public"."pick_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_assignee_id_accounts_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_assigned_by_accounts_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_accounts_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_dispatch_zone_id_catalog_entries_id_fk" FOREIGN KEY ("dispatch_zone_id") REFERENCES "public"."catalog_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_inventory_zone_id_catalog_entries_id_fk" FOREIGN KEY ("inventory_zone_id") REFERENCES "public"."catalog_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_pick_list_id_pick_lists_id_fk" FOREIGN KEY ("pick_list_id") REFERENCES "public"."pick_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_accounts_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick_events" ADD CONSTRAINT "pick_events_pick_list_id_pick_lists_id_fk" FOREIGN KEY ("pick_list_id") REFERENCES "public"."pick_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick_events" ADD CONSTRAINT "pick_events_line_id_order_lines_id_fk" FOREIGN KEY ("line_id") REFERENCES "public"."order_lines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick_events" ADD CONSTRAINT "pick_events_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick_lists" ADD CONSTRAINT "pick_lists_created_by_accounts_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stops" ADD CONSTRAINT "stops_pick_list_id_pick_lists_id_fk" FOREIGN KEY ("pick_list_id") REFERENCES "public"."pick_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stops" ADD CONSTRAINT "stops_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stops" ADD CONSTRAINT "stops_cause_id_stop_causes_id_fk" FOREIGN KEY ("cause_id") REFERENCES "public"."stop_causes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_errors" ADD CONSTRAINT "validation_errors_pick_list_id_pick_lists_id_fk" FOREIGN KEY ("pick_list_id") REFERENCES "public"."pick_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_errors" ADD CONSTRAINT "validation_errors_line_id_order_lines_id_fk" FOREIGN KEY ("line_id") REFERENCES "public"."order_lines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_errors" ADD CONSTRAINT "validation_errors_picker_id_accounts_id_fk" FOREIGN KEY ("picker_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_errors" ADD CONSTRAINT "validation_errors_validator_id_accounts_id_fk" FOREIGN KEY ("validator_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_errors" ADD CONSTRAINT "validation_errors_error_type_id_catalog_entries_id_fk" FOREIGN KEY ("error_type_id") REFERENCES "public"."catalog_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_entries_kind_name_unique" ON "catalog_entries" USING btree ("kind",lower("name"));--> statement-breakpoint
INSERT INTO "catalog_entries" ("kind", "name") VALUES ('dispatch_zone', 'Managua'), ('dispatch_zone', 'Sur oriente'), ('dispatch_zone', 'Occidente'), ('dispatch_zone', 'Correo'), ('inventory_zone', 'Cuarto frío y climatizado'), ('inventory_zone', 'Medicamentos instituciones y controlados'), ('inventory_zone', 'Dispositivos médicos'), ('inventory_zone', 'Picking'), ('error_type', 'Golpe'), ('error_type', 'Código de barras'), ('error_type', 'Lote'), ('error_type', 'Vencimiento'), ('error_type', 'Cantidad');
