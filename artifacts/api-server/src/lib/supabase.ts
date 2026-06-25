import { createClient } from "@supabase/supabase-js";
import { logger } from "./logger";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to sync data to Supabase."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

type ApplicantRecord = Record<string, unknown>;

export async function syncToSupabase(applicant: ApplicantRecord): Promise<void> {
  const row = {
    id: applicant.id,
    registration_number: applicant.registrationNumber,
    full_name: applicant.fullName,
    gender: applicant.gender,
    date_of_birth: applicant.dateOfBirth,
    phone_number: applicant.phoneNumber,
    email: applicant.email,
    residential_address: applicant.residentialAddress,
    state: applicant.state,
    lga: applicant.lga,
    state_of_origin: applicant.stateOfOrigin,
    lga_of_origin: applicant.lgaOfOrigin,
    nin: applicant.nin,
    bank_name: applicant.bankName,
    bank_account_number: applicant.bankAccountNumber,
    passport_photo_url: applicant.passportPhotoUrl ?? null,
    highest_education: applicant.highestEducation,
    school_attended: applicant.schoolAttended,
    graduation_year: applicant.graduationYear,
    skills: applicant.skills,
    other_skill: applicant.otherSkill ?? null,
    has_previous_experience: applicant.hasPreviousExperience,
    previous_skill_description: applicant.previousSkillDescription ?? null,
    training_expectation: applicant.trainingExpectation,
    employment_status: applicant.employmentStatus,
    has_existing_business: applicant.hasExistingBusiness,
    business_description: applicant.businessDescription ?? null,
    declaration_name: applicant.declarationName,
    digital_signature: applicant.digitalSignature ?? null,
    declaration_date: applicant.declarationDate,
    agreed_to_terms: applicant.agreedToTerms,
    status: applicant.status,
    created_at: applicant.createdAt,
    updated_at: applicant.updatedAt,
  };

  const { error } = await supabaseAdmin
    .from("applicants")
    .upsert(row, { onConflict: "id" });

  if (error) {
    logger.error({ error, id: applicant.id }, "Failed to sync applicant to Supabase");
  } else {
    logger.info({ id: applicant.id, registrationNumber: applicant.registrationNumber }, "Synced applicant to Supabase");
  }
}

export async function deleteFromSupabase(id: number): Promise<void> {
  const { error } = await supabaseAdmin
    .from("applicants")
    .delete()
    .eq("id", id);

  if (error) {
    logger.error({ error, id }, "Failed to delete applicant from Supabase");
  } else {
    logger.info({ id }, "Deleted applicant from Supabase");
  }
}
