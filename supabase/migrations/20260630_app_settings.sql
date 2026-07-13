-- App-level settings: brand colour and logo for the HSES sidebar.
-- Single-row table (id = 1). Uses service-role client for all reads/writes.

CREATE TABLE IF NOT EXISTS app_settings (
  id           INT PRIMARY KEY DEFAULT 1,
  brand_colour TEXT NOT NULL DEFAULT '#2d9692',
  logo_url     TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure exactly one row exists
INSERT INTO app_settings (id, brand_colour, logo_url)
VALUES (1, '#2d9692', NULL)
ON CONFLICT (id) DO NOTHING;
