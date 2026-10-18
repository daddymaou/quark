CREATE TABLE IF NOT EXISTS "rate_limits" (
  "key" text PRIMARY KEY,
  "window_start" timestamp with time zone NOT NULL,
  "count" integer NOT NULL
);
