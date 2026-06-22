-- ============================================================
-- NES Portal — Supabase Setup Script
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ojenoifkzwiddtyjenqb/sql
-- ============================================================

-- 1. Create the passport photo storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('applicant-passports', 'applicant-passports', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow anyone to upload to the bucket (anon key is sufficient)
CREATE POLICY "Allow public uploads"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'applicant-passports');

-- 3. Allow anyone to read/view uploaded photos
CREATE POLICY "Allow public reads"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'applicant-passports');

-- ============================================================
-- OPTIONAL: Full applicants table (only needed if you later
-- want to migrate from PostgreSQL to Supabase as the database)
-- ============================================================

-- CREATE TABLE IF NOT EXISTS applicants (
--   id                      SERIAL PRIMARY KEY,
--   registration_number     TEXT UNIQUE NOT NULL,
--   full_name               TEXT NOT NULL,
--   gender                  TEXT NOT NULL,
--   date_of_birth           TEXT NOT NULL,
--   phone_number            TEXT NOT NULL,
--   email                   TEXT NOT NULL,
--   residential_address     TEXT NOT NULL,
--   state                   TEXT NOT NULL,
--   lga                     TEXT NOT NULL,
--   state_of_origin         TEXT NOT NULL,
--   lga_of_origin           TEXT NOT NULL,
--   nin                     TEXT NOT NULL,
--   bank_name               TEXT NOT NULL,
--   bank_account_number     TEXT NOT NULL,
--   passport_photo_url      TEXT,
--   highest_education       TEXT NOT NULL,
--   school_attended         TEXT NOT NULL,
--   graduation_year         TEXT NOT NULL,
--   skills                  TEXT[] NOT NULL DEFAULT '{}',
--   other_skill             TEXT,
--   has_previous_experience BOOLEAN NOT NULL DEFAULT false,
--   previous_skill_description TEXT,
--   training_expectation    TEXT NOT NULL,
--   employment_status       TEXT NOT NULL,
--   has_existing_business   BOOLEAN NOT NULL DEFAULT false,
--   business_description    TEXT,
--   declaration_name        TEXT NOT NULL,
--   digital_signature       TEXT,
--   declaration_date        TEXT NOT NULL,
--   agreed_to_terms         BOOLEAN NOT NULL DEFAULT false,
--   status                  TEXT NOT NULL DEFAULT 'draft',
--   created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
--   updated_at              TIMESTAMPTZ
-- );
--
-- ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Allow public insert" ON applicants
--   FOR INSERT TO anon WITH CHECK (true);
--
-- CREATE POLICY "Allow public select" ON applicants
--   FOR SELECT TO anon USING (true);
