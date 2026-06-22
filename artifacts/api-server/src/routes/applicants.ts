import { Router, type IRouter } from "express";
import { eq, ilike, or, sql, desc } from "drizzle-orm";
import { db, applicantsTable } from "@workspace/db";
import {
  ListApplicantsQueryParams,
  CreateApplicantBody,
  SaveDraftBody,
  GetApplicantParams,
  UpdateApplicantParams,
  UpdateApplicantBody,
  DeleteApplicantParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function generateRegistrationNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `NES-${year}-${rand}`;
}

function formatApplicant(a: typeof applicantsTable.$inferSelect) {
  return {
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt ? a.updatedAt.toISOString() : null,
  };
}

router.get("/applicants/stats", async (req, res): Promise<void> => {
  const allApplicants = await db.select().from(applicantsTable);

  const totalRegistrations = allApplicants.length;
  const maleCount = allApplicants.filter(a => a.gender.toLowerCase() === "male").length;
  const femaleCount = allApplicants.filter(a => a.gender.toLowerCase() === "female").length;
  const otherGenderCount = allApplicants.filter(a => a.gender.toLowerCase() !== "male" && a.gender.toLowerCase() !== "female" && a.gender !== "").length;
  const submittedCount = allApplicants.filter(a => a.status === "submitted").length;
  const draftCount = allApplicants.filter(a => a.status === "draft").length;

  const stateCounts: Record<string, number> = {};
  const skillCounts: Record<string, number> = {};
  const educationCounts: Record<string, number> = {};
  const employmentCounts: Record<string, number> = {};

  for (const a of allApplicants) {
    if (a.state) stateCounts[a.state] = (stateCounts[a.state] || 0) + 1;
    for (const skill of a.skills) {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    }
    if (a.highestEducation) educationCounts[a.highestEducation] = (educationCounts[a.highestEducation] || 0) + 1;
    if (a.employmentStatus) employmentCounts[a.employmentStatus] = (employmentCounts[a.employmentStatus] || 0) + 1;
  }

  const byState = Object.entries(stateCounts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  const bySkill = Object.entries(skillCounts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  const byEducation = Object.entries(educationCounts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  const byEmploymentStatus = Object.entries(employmentCounts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);

  const recentRegistrations = allApplicants
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(formatApplicant);

  res.json({
    totalRegistrations,
    maleCount,
    femaleCount,
    otherGenderCount,
    submittedCount,
    draftCount,
    byState,
    bySkill,
    byEducation,
    byEmploymentStatus,
    recentRegistrations,
  });
});

router.get("/applicants", async (req, res): Promise<void> => {
  const parsed = ListApplicantsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, state, skill, gender, status, page = 1, limit = 20 } = parsed.data;

  let allApplicants = await db.select().from(applicantsTable).orderBy(desc(applicantsTable.createdAt));

  if (search) {
    const s = search.toLowerCase();
    allApplicants = allApplicants.filter(a =>
      a.fullName.toLowerCase().includes(s) ||
      a.email.toLowerCase().includes(s) ||
      a.registrationNumber.toLowerCase().includes(s) ||
      a.phoneNumber.includes(s)
    );
  }
  if (state) allApplicants = allApplicants.filter(a => a.state === state);
  if (gender) allApplicants = allApplicants.filter(a => a.gender.toLowerCase() === gender.toLowerCase());
  if (status) allApplicants = allApplicants.filter(a => a.status === status);
  if (skill) allApplicants = allApplicants.filter(a => a.skills.includes(skill));

  const total = allApplicants.length;
  const offset = (page - 1) * limit;
  const paged = allApplicants.slice(offset, offset + limit);

  res.json({
    data: paged.map(formatApplicant),
    total,
    page,
    limit,
  });
});

router.post("/applicants/draft", async (req, res): Promise<void> => {
  const parsed = SaveDraftBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const regNumber = generateRegistrationNumber();
  const data = parsed.data;

  const [applicant] = await db.insert(applicantsTable).values({
    registrationNumber: regNumber,
    fullName: data.fullName ?? "",
    gender: data.gender ?? "",
    dateOfBirth: data.dateOfBirth ?? "",
    phoneNumber: data.phoneNumber ?? "",
    email: data.email ?? "",
    residentialAddress: data.residentialAddress ?? "",
    state: data.state ?? "",
    lga: data.lga ?? "",
    stateOfOrigin: data.stateOfOrigin ?? "",
    lgaOfOrigin: data.lgaOfOrigin ?? "",
    nin: data.nin ?? "",
    bankName: data.bankName ?? "",
    bankAccountNumber: data.bankAccountNumber ?? "",
    passportPhotoUrl: data.passportPhotoUrl ?? null,
    highestEducation: data.highestEducation ?? "",
    schoolAttended: data.schoolAttended ?? "",
    graduationYear: data.graduationYear ?? "",
    skills: data.skills ?? [],
    otherSkill: data.otherSkill ?? null,
    hasPreviousExperience: data.hasPreviousExperience ?? false,
    previousSkillDescription: data.previousSkillDescription ?? null,
    trainingExpectation: data.trainingExpectation ?? "",
    employmentStatus: data.employmentStatus ?? "",
    hasExistingBusiness: data.hasExistingBusiness ?? false,
    businessDescription: data.businessDescription ?? null,
    declarationName: data.declarationName ?? "",
    digitalSignature: data.digitalSignature ?? null,
    declarationDate: data.declarationDate ?? "",
    agreedToTerms: data.agreedToTerms ?? false,
    status: "draft",
  }).returning();

  res.json(formatApplicant(applicant));
});

router.post("/applicants", async (req, res): Promise<void> => {
  const parsed = CreateApplicantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const regNumber = generateRegistrationNumber();

  const [applicant] = await db.insert(applicantsTable).values({
    registrationNumber: regNumber,
    fullName: data.fullName,
    gender: data.gender,
    dateOfBirth: data.dateOfBirth,
    phoneNumber: data.phoneNumber,
    email: data.email,
    residentialAddress: data.residentialAddress,
    state: data.state,
    lga: data.lga,
    stateOfOrigin: data.stateOfOrigin,
    lgaOfOrigin: data.lgaOfOrigin,
    nin: data.nin,
    bankName: data.bankName,
    bankAccountNumber: data.bankAccountNumber,
    passportPhotoUrl: data.passportPhotoUrl ?? null,
    highestEducation: data.highestEducation,
    schoolAttended: data.schoolAttended,
    graduationYear: data.graduationYear,
    skills: data.skills,
    otherSkill: data.otherSkill ?? null,
    hasPreviousExperience: data.hasPreviousExperience,
    previousSkillDescription: data.previousSkillDescription ?? null,
    trainingExpectation: data.trainingExpectation,
    employmentStatus: data.employmentStatus,
    hasExistingBusiness: data.hasExistingBusiness,
    businessDescription: data.businessDescription ?? null,
    declarationName: data.declarationName,
    digitalSignature: data.digitalSignature ?? null,
    declarationDate: data.declarationDate,
    agreedToTerms: data.agreedToTerms,
    status: "submitted",
  }).returning();

  res.status(201).json(formatApplicant(applicant));
});

router.get("/applicants/:id", async (req, res): Promise<void> => {
  const params = GetApplicantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [applicant] = await db.select().from(applicantsTable).where(eq(applicantsTable.id, params.data.id));
  if (!applicant) {
    res.status(404).json({ error: "Applicant not found" });
    return;
  }

  res.json(formatApplicant(applicant));
});

router.patch("/applicants/:id", async (req, res): Promise<void> => {
  const params = UpdateApplicantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateApplicantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [applicant] = await db.update(applicantsTable)
    .set(parsed.data)
    .where(eq(applicantsTable.id, params.data.id))
    .returning();

  if (!applicant) {
    res.status(404).json({ error: "Applicant not found" });
    return;
  }

  res.json(formatApplicant(applicant));
});

router.delete("/applicants/:id", async (req, res): Promise<void> => {
  const params = DeleteApplicantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [applicant] = await db.delete(applicantsTable)
    .where(eq(applicantsTable.id, params.data.id))
    .returning();

  if (!applicant) {
    res.status(404).json({ error: "Applicant not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
