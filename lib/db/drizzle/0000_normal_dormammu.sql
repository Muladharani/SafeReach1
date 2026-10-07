CREATE TABLE "safereach_admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"auth_provider_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "safereach_admins_email_unique" UNIQUE("email"),
	CONSTRAINT "safereach_admins_auth_provider_id_unique" UNIQUE("auth_provider_id")
);
--> statement-breakpoint
CREATE TABLE "safereach_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"location" text NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"radius_km" real DEFAULT 10 NOT NULL,
	"recommended_action" text NOT NULL,
	"siren_enabled" boolean DEFAULT false NOT NULL,
	"notification_enabled" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"is_demo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "safereach_disasters" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"location" text NOT NULL,
	"severity" text NOT NULL,
	"start_time" timestamp with time zone DEFAULT now() NOT NULL,
	"end_time" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "safereach_facilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"shelter_id" integer NOT NULL,
	"food" boolean DEFAULT false NOT NULL,
	"water" boolean DEFAULT false NOT NULL,
	"medical" boolean DEFAULT false NOT NULL,
	"toilet" boolean DEFAULT false NOT NULL,
	"electricity" boolean DEFAULT false NOT NULL,
	"wheelchair" boolean DEFAULT false NOT NULL,
	"childcare" boolean DEFAULT false NOT NULL,
	"women_facility" boolean DEFAULT false NOT NULL,
	"pet_friendly" boolean DEFAULT false NOT NULL,
	CONSTRAINT "safereach_facilities_shelter_id_unique" UNIQUE("shelter_id")
);
--> statement-breakpoint
CREATE TABLE "safereach_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"alert_id" integer,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_demo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "safereach_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"shelter_id" integer NOT NULL,
	"problem_type" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "safereach_shelters" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"capacity" integer NOT NULL,
	"occupied" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"type" text DEFAULT 'government' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "safereach_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"location" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "safereach_facilities" ADD CONSTRAINT "safereach_facilities_shelter_id_safereach_shelters_id_fk" FOREIGN KEY ("shelter_id") REFERENCES "public"."safereach_shelters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safereach_notifications" ADD CONSTRAINT "safereach_notifications_alert_id_safereach_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."safereach_alerts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safereach_reports" ADD CONSTRAINT "safereach_reports_shelter_id_safereach_shelters_id_fk" FOREIGN KEY ("shelter_id") REFERENCES "public"."safereach_shelters"("id") ON DELETE cascade ON UPDATE no action;