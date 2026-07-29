CREATE TABLE "communities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(60) NOT NULL,
	"name_key" varchar(100) NOT NULL,
	"path" text NOT NULL,
	"type" varchar(20) DEFAULT 'club' NOT NULL,
	"parent_id" uuid,
	"description" text DEFAULT '' NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"instructions_updated_at" timestamp,
	"instructions_updated_by" uuid,
	"visibility" varchar(20) DEFAULT 'public' NOT NULL,
	"logo_url" text DEFAULT '' NOT NULL,
	"website" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"email_domains" text[] DEFAULT '{}' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"owner_id" uuid,
	"member_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "communities_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "community_members" (
	"community_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"title" varchar(60) DEFAULT '' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "community_members_community_id_user_id_pk" PRIMARY KEY("community_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_parent_id_communities_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_instructions_updated_by_users_id_fk" FOREIGN KEY ("instructions_updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "communities_root_slug_idx" ON "communities" USING btree ("slug") WHERE parent_id IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "communities_child_slug_idx" ON "communities" USING btree ("parent_id","slug") WHERE parent_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "communities_root_name_key_idx" ON "communities" USING btree ("name_key") WHERE parent_id IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "communities_child_name_key_idx" ON "communities" USING btree ("parent_id","name_key") WHERE parent_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "communities_parent_idx" ON "communities" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "communities_type_idx" ON "communities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "communities_owner_idx" ON "communities" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "community_members_user_idx" ON "community_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "community_members_community_role_idx" ON "community_members" USING btree ("community_id","role");