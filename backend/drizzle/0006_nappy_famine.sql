CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"barcode" text,
	"name" text NOT NULL,
	"manufacturer" text,
	"zone" text,
	"lot" text,
	"expires_on" date,
	"quantity" integer NOT NULL
);
