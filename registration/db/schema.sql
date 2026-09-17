CREATE TABLE IF NOT EXISTS registrations (
  id             BIGSERIAL PRIMARY KEY,
  full_name      TEXT        NOT NULL,
  email          TEXT        NOT NULL UNIQUE,
  phone          TEXT        NOT NULL,
  college        TEXT        NOT NULL,
  role           TEXT        NOT NULL CHECK (role IN ('student', 'professional', 'other')),
  participation  TEXT        NOT NULL CHECK (participation IN ('solo', 'team')),
  teammate_name  TEXT,
  teammate_email TEXT,
  heard_from     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS registrations_created_at_idx ON registrations (created_at DESC);
