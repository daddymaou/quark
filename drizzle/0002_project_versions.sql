CREATE TABLE IF NOT EXISTS "project_versions" (
  "id" text PRIMARY KEY,
  "project_id" text NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
  "files" json NOT NULL,
  "summary" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "project_versions_project_created_idx"
  ON "project_versions" ("project_id", "created_at" DESC);
