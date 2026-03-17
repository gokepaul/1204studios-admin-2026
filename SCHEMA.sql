-- ═══════════════════════════════════════════════════════════════
--  1204STUDIOS — INVOICE APP — DEFINITIVE DATABASE SCHEMA
--  Run this entire file in Supabase SQL Editor (New Query → Run)
--  Safe to re-run: uses IF NOT EXISTS and DROP POLICY IF EXISTS
-- ═══════════════════════════════════════════════════════════════

-- ── 1. INVOICES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id          text PRIMARY KEY,
  client      text,
  company     text,
  email       text,
  phone       text,
  address     text,
  project     text,
  category    text,
  date        text,
  due         text,
  account     text,          -- FK → accounts.id (loose)
  currency    text DEFAULT 'NGN',
  status      text DEFAULT 'draft',
  items       jsonb DEFAULT '[]',
  payments    jsonb DEFAULT '[]',
  discount    numeric DEFAULT 0,
  tax         numeric DEFAULT 0,
  "desc"      text,          -- scope of work (matches JS property name)
  terms       text,
  created_at  timestamptz DEFAULT now()
);

-- ── 2. CLIENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id          text PRIMARY KEY,
  name        text,          -- company name
  contact     text,          -- individual contact name
  email       text,
  phone       text,
  address     text,
  notes       text,
  created_at  timestamptz DEFAULT now()
);

-- ── 3. ACCOUNTS (payment accounts) ───────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id          text PRIMARY KEY,
  label       text,          -- e.g. "NGN — GTBank"
  bank        text,
  aname       text,          -- account name
  anum        text,          -- account number
  swift       text,
  currency    text DEFAULT 'NGN',
  instr       text,          -- payment instructions
  created_at  timestamptz DEFAULT now()
);

-- ── 4. EXPENSES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id          text PRIMARY KEY,
  date        text,
  amount      numeric DEFAULT 0,
  description text,
  supplier    text,
  method      text,
  coa_code    text,
  receipt     text,
  notes       text,
  currency    text DEFAULT 'NGN',
  created_at  timestamptz DEFAULT now()
);

-- ── 5. PRESETS (invoice line item presets) ────────────────────
CREATE TABLE IF NOT EXISTS presets (
  id          serial PRIMARY KEY,
  name        text,
  price       numeric DEFAULT 0,
  cur         text DEFAULT 'NGN'
);

-- ── 6. SETTINGS (key-value store for studio config) ───────────
CREATE TABLE IF NOT EXISTS settings (
  "key"       text PRIMARY KEY,
  value       text
);

-- ── 7. CONTRACTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contracts (
  id               text PRIMARY KEY,
  number           text,
  title            text,
  -- Always linked to a saved invoice
  invoice_id       text REFERENCES invoices(id) ON DELETE SET NULL,
  -- Client details (denormalised from invoice for PDF)
  client           text,
  company          text,
  email            text,
  phone            text,
  address          text,
  -- Project
  category         text,
  description      text,
  deliverables     text,
  timeline         text,
  -- Financials
  value            text,
  currency         text DEFAULT 'NGN',
  start_date       text,
  end_date         text,
  -- Standard clauses (editable per contract)
  revisions        text,
  payment_terms    text,
  deposit_rule     text,
  ip_clause        text,
  cancellation     text,
  liability        text,
  confidential     text,
  comm_channel     text,
  approval_process text,
  force_majeure    text,
  -- Status & meta
  status           text DEFAULT 'draft',
  notes            text,
  created_at       timestamptz DEFAULT now()
);

-- ── 8. DISABLE RLS (single-user app with passcode auth) ───────
-- The anon key is the only credential used. RLS would block all reads.
ALTER TABLE invoices   DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients    DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts   DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses   DISABLE ROW LEVEL SECURITY;
ALTER TABLE presets    DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings   DISABLE ROW LEVEL SECURITY;
ALTER TABLE contracts  DISABLE ROW LEVEL SECURITY;

-- ── 9. INDEXES (for common query patterns) ────────────────────
CREATE INDEX IF NOT EXISTS idx_invoices_client    ON invoices(client);
CREATE INDEX IF NOT EXISTS idx_invoices_status    ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created   ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_date      ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_contracts_invoice  ON contracts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status   ON contracts(status);

-- ── 10. VERIFY ─────────────────────────────────────────────────
-- After running, confirm all 7 tables exist:
SELECT table_name, 
       (SELECT count(*) FROM information_schema.columns 
        WHERE table_name = t.table_name 
        AND table_schema = 'public') AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('invoices','clients','accounts','expenses','presets','settings','contracts')
ORDER BY table_name;
