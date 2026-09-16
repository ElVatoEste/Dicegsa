CREATE TYPE "public"."accion_admin" AS ENUM('alta', 'reseteo', 'cambio_rol', 'baja', 'reactivacion');--> statement-breakpoint
CREATE TYPE "public"."rol_operativo" AS ENUM('alistador', 'valeador');--> statement-breakpoint
CREATE TYPE "public"."rol_sistema" AS ENUM('operario', 'supervisor', 'gerencia', 'admin');--> statement-breakpoint
CREATE TABLE "colaboradores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cuenta_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"rol_operativo" "rol_operativo" DEFAULT 'alistador' NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "colaboradores_cuenta_id_unique" UNIQUE("cuenta_id")
);
--> statement-breakpoint
CREATE TABLE "cuentas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre_cuenta" text NOT NULL,
	"hash_password" text NOT NULL,
	"rol" "rol_sistema" DEFAULT 'operario' NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"debe_cambiar_password" boolean DEFAULT true NOT NULL,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizada_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eventos_admin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"cuenta_objetivo_id" uuid NOT NULL,
	"accion" "accion_admin" NOT NULL,
	"detalle" jsonb,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_cuenta_id_cuentas_id_fk" FOREIGN KEY ("cuenta_id") REFERENCES "public"."cuentas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos_admin" ADD CONSTRAINT "eventos_admin_actor_id_cuentas_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."cuentas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos_admin" ADD CONSTRAINT "eventos_admin_cuenta_objetivo_id_cuentas_id_fk" FOREIGN KEY ("cuenta_objetivo_id") REFERENCES "public"."cuentas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cuentas_nombre_cuenta_unico" ON "cuentas" USING btree (lower("nombre_cuenta"));