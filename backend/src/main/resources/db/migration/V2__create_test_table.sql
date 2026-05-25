CREATE TABLE IF NOT EXISTS public.test_migration_v2 (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_migration_v2_name
  ON public.test_migration_v2 (name);