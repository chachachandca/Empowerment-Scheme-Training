import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const applicantsTable = pgTable("applicants", {
  id: serial("id").primaryKey(),
  registrationNumber: text("registration_number").notNull().unique(),
  fullName: text("full_name").notNull().default(""),
  gender: text("gender").notNull().default(""),
  dateOfBirth: text("date_of_birth").notNull().default(""),
  phoneNumber: text("phone_number").notNull().default(""),
  email: text("email").notNull().default(""),
  residentialAddress: text("residential_address").notNull().default(""),
  state: text("state").notNull().default(""),
  lga: text("lga").notNull().default(""),
  stateOfOrigin: text("state_of_origin").notNull().default(""),
  lgaOfOrigin: text("lga_of_origin").notNull().default(""),
  nin: text("nin").notNull().default(""),
  bankName: text("bank_name").notNull().default(""),
  bankAccountNumber: text("bank_account_number").notNull().default(""),
  passportPhotoUrl: text("passport_photo_url"),
  highestEducation: text("highest_education").notNull().default(""),
  schoolAttended: text("school_attended").notNull().default(""),
  graduationYear: text("graduation_year").notNull().default(""),
  skills: text("skills").array().notNull().default([]),
  otherSkill: text("other_skill"),
  hasPreviousExperience: boolean("has_previous_experience").notNull().default(false),
  previousSkillDescription: text("previous_skill_description"),
  trainingExpectation: text("training_expectation").notNull().default(""),
  employmentStatus: text("employment_status").notNull().default(""),
  hasExistingBusiness: boolean("has_existing_business").notNull().default(false),
  businessDescription: text("business_description"),
  declarationName: text("declaration_name").notNull().default(""),
  digitalSignature: text("digital_signature"),
  declarationDate: text("declaration_date").notNull().default(""),
  agreedToTerms: boolean("agreed_to_terms").notNull().default(false),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertApplicantSchema = createInsertSchema(applicantsTable).omit({
  id: true,
  registrationNumber: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertApplicant = z.infer<typeof insertApplicantSchema>;
export type Applicant = typeof applicantsTable.$inferSelect;
