-- ============================================================
-- NES Portal — Supabase Setup Script
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ojenoifkzwiddtyjenqb/sql/new
-- ============================================================

-- 1. Create the passport photo storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('applicant-passports', 'applicant-passports', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow anyone to upload passport photos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Allow public uploads') THEN
    CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT TO anon
      WITH CHECK (bucket_id = 'applicant-passports');
  END IF;
END $$;

-- 3. Allow anyone to read/view uploaded photos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Allow public reads') THEN
    CREATE POLICY "Allow public reads" ON storage.objects FOR SELECT TO anon
      USING (bucket_id = 'applicant-passports');
  END IF;
END $$;

-- ============================================================
-- 4. Create the applicants table (for backend auto-sync)
-- ============================================================

CREATE TABLE IF NOT EXISTS applicants (
  id                         SERIAL PRIMARY KEY,
  registration_number        TEXT UNIQUE NOT NULL,
  full_name                  TEXT NOT NULL DEFAULT '',
  gender                     TEXT NOT NULL DEFAULT '',
  date_of_birth              TEXT NOT NULL DEFAULT '',
  phone_number               TEXT NOT NULL DEFAULT '',
  email                      TEXT NOT NULL DEFAULT '',
  residential_address        TEXT NOT NULL DEFAULT '',
  state                      TEXT NOT NULL DEFAULT '',
  lga                        TEXT NOT NULL DEFAULT '',
  state_of_origin            TEXT NOT NULL DEFAULT '',
  lga_of_origin              TEXT NOT NULL DEFAULT '',
  nin                        TEXT NOT NULL DEFAULT '',
  bank_name                  TEXT NOT NULL DEFAULT '',
  bank_account_number        TEXT NOT NULL DEFAULT '',
  passport_photo_url         TEXT,
  highest_education          TEXT NOT NULL DEFAULT '',
  school_attended            TEXT NOT NULL DEFAULT '',
  graduation_year            TEXT NOT NULL DEFAULT '',
  skills                     TEXT[] NOT NULL DEFAULT '{}',
  other_skill                TEXT,
  has_previous_experience    BOOLEAN NOT NULL DEFAULT false,
  previous_skill_description TEXT,
  training_expectation       TEXT NOT NULL DEFAULT '',
  employment_status          TEXT NOT NULL DEFAULT '',
  has_existing_business      BOOLEAN NOT NULL DEFAULT false,
  business_description       TEXT,
  declaration_name           TEXT NOT NULL DEFAULT '',
  digital_signature          TEXT,
  declaration_date           TEXT NOT NULL DEFAULT '',
  agreed_to_terms            BOOLEAN NOT NULL DEFAULT false,
  status                     TEXT NOT NULL DEFAULT 'draft',
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ
);

-- 5. Enable Row Level Security
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

-- 6. Allow the backend (service_role key) full access
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='applicants' AND policyname='service_role_all') THEN
    CREATE POLICY "service_role_all" ON applicants
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
