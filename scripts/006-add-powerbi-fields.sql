-- Add Power BI fields to dashboards table
ALTER TABLE dashboards
ADD COLUMN IF NOT EXISTS powerbi_workspace_id TEXT,
ADD COLUMN IF NOT EXISTS powerbi_report_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dashboards_powerbi_report ON dashboards(powerbi_report_id);

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE '[v0] Power BI fields added to dashboards table';
END $$;
