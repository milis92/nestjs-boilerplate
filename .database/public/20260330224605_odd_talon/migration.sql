CREATE TABLE "todos" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"owner_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "todos_owner_id_idx" ON "todos" ("owner_id");--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_owner_id_user_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."user"("id") ON DELETE CASCADE;