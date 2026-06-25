import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const sql = `
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

ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'applicants' AND policyname = 'Allow service role full access'
  ) THEN
    CREATE POLICY "Allow service role full access" ON applicants
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error("Could not extract project ref from VITE_SUPABASE_URL");
  process.exit(1);
}

console.log(`Running SQL on Supabase project: ${projectRef}`);

const response = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  }
);

if (!response.ok) {
  const text = await response.text();
  console.error("API error:", response.status, text);

  // Try direct REST upsert as a connectivity test
  console.log("\nTrying REST API connectivity test...");
  const test = await supabase.from("applicants").select("id").limit(1);
  if (test.error) {
    console.log("Table does not exist yet:", test.error.message);
    console.log("\n--- MANUAL STEP REQUIRED ---");
    console.log("Please run this SQL in your Supabase dashboard SQL Editor:");
    console.log("https://supabase.com/dashboard/project/" + projectRef + "/sql/new");
    console.log("\n" + sql);
  } else {
    console.log("Table already exists! Row count probe:", test.data?.length);
  }
  process.exit(0);
}

const data = await response.json();
console.log("Success:", JSON.stringify(data, null, 2));
console.log("\nSupabase applicants table is ready.");
