import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateApplicant, useSaveDraft } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, CheckCircle, Save, Loader2 } from "lucide-react";
import logoPath from "@assets/IMG-20260622-WA0001_1782115480105.jpg";
import { uploadPassportPhoto } from "@/lib/supabase";

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara"
];

const EDUCATION_OPTIONS = ["Primary","Secondary","Diploma","Degree","Other"];
const SKILLS_OPTIONS = [
  "Tailoring/Fashion Design","Hairdressing/Barbing","Catering & Baking",
  "Agriculture/Farming","Welding/Fabrication","Electrical Installation",
  "Plumbing","ICT/Computer Skills","Carpentry","Soap/Cosmetics Production","Other"
];
const EMPLOYMENT_OPTIONS = ["Employed","Self-employed","Unemployed","Student"];

const steps = [
  "Personal Information",
  "Educational Background",
  "Vocational Skills",
  "Experience",
  "Training Expectation",
  "Beneficiary Information",
  "Declaration",
];

type FormData = {
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  residentialAddress: string;
  state: string;
  lga: string;
  stateOfOrigin: string;
  lgaOfOrigin: string;
  nin: string;
  bankName: string;
  bankAccountNumber: string;
  passportPhotoUrl: string;
  highestEducation: string;
  schoolAttended: string;
  graduationYear: string;
  skills: string[];
  otherSkill: string;
  hasPreviousExperience: boolean;
  previousSkillDescription: string;
  trainingExpectation: string;
  employmentStatus: string;
  hasExistingBusiness: boolean;
  businessDescription: string;
  declarationName: string;
  digitalSignature: string;
  declarationDate: string;
  agreedToTerms: boolean;
};

const defaultValues: FormData = {
  fullName: "", gender: "", dateOfBirth: "", phoneNumber: "", email: "",
  residentialAddress: "", state: "", lga: "", stateOfOrigin: "", lgaOfOrigin: "",
  nin: "", bankName: "", bankAccountNumber: "", passportPhotoUrl: "",
  highestEducation: "", schoolAttended: "", graduationYear: "",
  skills: [], otherSkill: "", hasPreviousExperience: false,
  previousSkillDescription: "", trainingExpectation: "",
  employmentStatus: "", hasExistingBusiness: false, businessDescription: "",
  declarationName: "", digitalSignature: "",
  declarationDate: new Date().toISOString().split("T")[0], agreedToTerms: false,
};

export default function Register() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(defaultValues);
  const [photoUploading, setPhotoUploading] = useState(false);
  const { toast } = useToast();
  const createApplicant = useCreateApplicant();
  const saveDraft = useSaveDraft();

  const updateField = (field: keyof FormData, value: FormData[keyof FormData]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSaveDraft = () => {
    saveDraft.mutate({ data: formData as never }, {
      onSuccess: () => toast({ title: "Draft saved successfully" }),
      onError: () => toast({ title: "Failed to save draft", variant: "destructive" }),
    });
  };

  const handleSubmit = () => {
    if (!formData.agreedToTerms) {
      toast({ title: "Please agree to terms and conditions", variant: "destructive" });
      return;
    }
    createApplicant.mutate({ data: formData as never }, {
      onSuccess: (applicant) => {
        setLocation(`/success?reg=${applicant.registrationNumber}&name=${encodeURIComponent(applicant.fullName)}`);
      },
      onError: () => toast({ title: "Submission failed. Please try again.", variant: "destructive" }),
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" data-testid="input-fullName" value={formData.fullName} onChange={e => updateField("fullName", e.target.value)} placeholder="Enter your full name" />
              </div>
              <div>
                <Label>Gender *</Label>
                <div className="flex gap-4 mt-2">
                  {["Male","Female","Other"].map(g => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={() => updateField("gender", g)} className="accent-primary" />
                      <span className="text-sm">{g}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input id="dateOfBirth" type="date" data-testid="input-dateOfBirth" value={formData.dateOfBirth} onChange={e => updateField("dateOfBirth", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input id="phoneNumber" data-testid="input-phoneNumber" value={formData.phoneNumber} onChange={e => updateField("phoneNumber", e.target.value)} placeholder="080XXXXXXXX" />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" type="email" data-testid="input-email" value={formData.email} onChange={e => updateField("email", e.target.value)} placeholder="email@example.com" />
              </div>
              <div>
                <Label htmlFor="nin">National Identification Number (NIN) *</Label>
                <Input id="nin" data-testid="input-nin" value={formData.nin} onChange={e => updateField("nin", e.target.value.replace(/\D/g, ""))} placeholder="11-digit NIN" maxLength={11} />
              </div>
            </div>
            <div>
              <Label htmlFor="residentialAddress">Residential Address *</Label>
              <Textarea id="residentialAddress" data-testid="input-residentialAddress" value={formData.residentialAddress} onChange={e => updateField("residentialAddress", e.target.value)} placeholder="Enter your full residential address" rows={2} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>State of Residence *</Label>
                <select className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring" value={formData.state} onChange={e => updateField("state", e.target.value)} data-testid="select-state">
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="lga">Local Government Area (LGA) *</Label>
                <Input id="lga" data-testid="input-lga" value={formData.lga} onChange={e => updateField("lga", e.target.value)} placeholder="Enter your LGA" />
              </div>
              <div>
                <Label>State of Origin *</Label>
                <select className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring" value={formData.stateOfOrigin} onChange={e => updateField("stateOfOrigin", e.target.value)} data-testid="select-stateOfOrigin">
                  <option value="">Select state of origin</option>
                  {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="lgaOfOrigin">LGA of Origin *</Label>
                <Input id="lgaOfOrigin" data-testid="input-lgaOfOrigin" value={formData.lgaOfOrigin} onChange={e => updateField("lgaOfOrigin", e.target.value)} placeholder="Enter LGA of origin" />
              </div>
              <div>
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input id="bankName" data-testid="input-bankName" value={formData.bankName} onChange={e => updateField("bankName", e.target.value)} placeholder="e.g. First Bank, GTBank" />
              </div>
              <div>
                <Label htmlFor="bankAccountNumber">Bank Account Number *</Label>
                <Input id="bankAccountNumber" data-testid="input-bankAccountNumber" value={formData.bankAccountNumber} onChange={e => updateField("bankAccountNumber", e.target.value.replace(/\D/g, ""))} placeholder="10-digit account number" maxLength={10} />
              </div>
            </div>
            <div>
              <Label>Passport Photograph *</Label>
              <div className="mt-1">
                {formData.passportPhotoUrl ? (
                  <div className="flex items-start gap-4">
                    <img
                      src={formData.passportPhotoUrl}
                      alt="Passport"
                      className="w-28 h-28 object-cover rounded-lg border-2 border-primary/30 shadow-sm"
                    />
                    <div className="flex flex-col gap-2 pt-1">
                      <p className="text-sm text-secondary font-medium">Photo uploaded ✓</p>
                      <label
                        htmlFor="passportPhotoUpload"
                        className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-muted/50 hover:bg-muted text-sm text-muted-foreground transition-colors"
                      >
                        Change photo
                      </label>
                      <button
                        type="button"
                        onClick={() => updateField("passportPhotoUrl", "")}
                        className="text-xs text-destructive hover:underline text-left"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : photoUploading ? (
                  <div className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-primary/40 rounded-xl bg-primary/5">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                    <p className="text-sm font-medium text-primary">Uploading to Supabase Storage…</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Please wait</p>
                  </div>
                ) : (
                  <label
                    htmlFor="passportPhotoUpload"
                    className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border rounded-xl cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <svg className="w-10 h-10 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-4m0 0V8m0 4h4m-4 0H8M20 21H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v14a2 2 0 01-2 2z" />
                      </svg>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">Tap to upload passport photo</p>
                        <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WEBP · Max 5MB — stored in Supabase</p>
                      </div>
                    </div>
                  </label>
                )}
                <input
                  id="passportPhotoUpload"
                  data-testid="input-passportPhotoUpload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  disabled={photoUploading}
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      toast({ title: "Photo must be smaller than 5MB", variant: "destructive" });
                      return;
                    }
                    e.target.value = "";
                    setPhotoUploading(true);
                    try {
                      const url = await uploadPassportPhoto(file);
                      updateField("passportPhotoUrl", url);
                      toast({ title: "Photo uploaded successfully" });
                    } catch (err) {
                      toast({ title: "Photo upload failed", description: (err as Error).message, variant: "destructive" });
                    } finally {
                      setPhotoUploading(false);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label>Highest Level of Education *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {EDUCATION_OPTIONS.map(opt => (
                  <label key={opt} className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer transition-colors ${formData.highestEducation === opt ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                    <input type="radio" name="highestEducation" value={opt} checked={formData.highestEducation === opt} onChange={() => updateField("highestEducation", opt)} className="accent-primary" />
                    <span className="text-sm font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="schoolAttended">School/Institution Attended *</Label>
              <Input id="schoolAttended" data-testid="input-schoolAttended" value={formData.schoolAttended} onChange={e => updateField("schoolAttended", e.target.value)} placeholder="Name of school or institution" />
            </div>
            <div>
              <Label htmlFor="graduationYear">Graduation Year *</Label>
              <Input id="graduationYear" data-testid="input-graduationYear" value={formData.graduationYear} onChange={e => updateField("graduationYear", e.target.value)} placeholder="e.g. 2020" maxLength={4} />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Select Vocational Skills Interest *</Label>
              <p className="text-sm text-muted-foreground mb-3">You may select multiple skills</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SKILLS_OPTIONS.map(skill => (
                  <label key={skill} className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors ${formData.skills.includes(skill) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`} data-testid={`skill-${skill.replace(/\//g, "-")}`}>
                    <Checkbox checked={formData.skills.includes(skill)} onCheckedChange={() => toggleSkill(skill)} />
                    <span className="text-sm font-medium">{skill}</span>
                  </label>
                ))}
              </div>
            </div>
            {formData.skills.includes("Other") && (
              <div>
                <Label htmlFor="otherSkill">Please specify other skill *</Label>
                <Input id="otherSkill" data-testid="input-otherSkill" value={formData.otherSkill} onChange={e => updateField("otherSkill", e.target.value)} placeholder="Describe your other skill" />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold">Do you have any previous skill/training experience? *</Label>
              <div className="flex gap-6 mt-3">
                {[["Yes", true], ["No", false]].map(([label, val]) => (
                  <label key={String(label)} className={`flex items-center gap-3 p-4 border rounded-md cursor-pointer transition-colors flex-1 ${formData.hasPreviousExperience === val ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                    <input type="radio" name="hasPreviousExperience" checked={formData.hasPreviousExperience === val} onChange={() => updateField("hasPreviousExperience", val as boolean)} className="accent-primary" />
                    <span className="font-medium">{String(label)}</span>
                  </label>
                ))}
              </div>
            </div>
            {formData.hasPreviousExperience && (
              <div>
                <Label htmlFor="previousSkillDescription">State the Skill *</Label>
                <Textarea id="previousSkillDescription" data-testid="input-previousSkillDescription" value={formData.previousSkillDescription} onChange={e => updateField("previousSkillDescription", e.target.value)} placeholder="Describe your previous skill or training experience" rows={4} />
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="trainingExpectation" className="text-base font-semibold">What do you hope to gain from this training? *</Label>
              <p className="text-sm text-muted-foreground mb-2">Please be specific about your goals and expectations</p>
              <Textarea id="trainingExpectation" data-testid="input-trainingExpectation" value={formData.trainingExpectation} onChange={e => updateField("trainingExpectation", e.target.value)} placeholder="Describe your training expectations and goals..." rows={8} className="resize-none" />
              <p className="text-xs text-muted-foreground mt-1">{formData.trainingExpectation.length} characters</p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold">Employment Status *</Label>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {EMPLOYMENT_OPTIONS.map(opt => (
                  <label key={opt} className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors ${formData.employmentStatus === opt ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                    <input type="radio" name="employmentStatus" value={opt} checked={formData.employmentStatus === opt} onChange={() => updateField("employmentStatus", opt)} className="accent-primary" />
                    <span className="text-sm font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-base font-semibold">Do you currently have a business? *</Label>
              <div className="flex gap-6 mt-3">
                {[["Yes", true], ["No", false]].map(([label, val]) => (
                  <label key={String(label)} className={`flex items-center gap-3 p-4 border rounded-md cursor-pointer transition-colors flex-1 ${formData.hasExistingBusiness === val ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                    <input type="radio" name="hasExistingBusiness" checked={formData.hasExistingBusiness === val} onChange={() => updateField("hasExistingBusiness", val as boolean)} className="accent-primary" />
                    <span className="font-medium">{String(label)}</span>
                  </label>
                ))}
              </div>
            </div>
            {formData.hasExistingBusiness && (
              <div>
                <Label htmlFor="businessDescription">Describe your business *</Label>
                <Textarea id="businessDescription" data-testid="input-businessDescription" value={formData.businessDescription} onChange={e => updateField("businessDescription", e.target.value)} placeholder="Describe your current business..." rows={4} />
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm font-medium text-foreground leading-relaxed">
                "I certify that the information provided in this form is true and correct. I understand that providing false information may result in disqualification from the National Empowerment Scheme programme."
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="declarationName">Full Name *</Label>
                <Input id="declarationName" data-testid="input-declarationName" value={formData.declarationName} onChange={e => updateField("declarationName", e.target.value)} placeholder="Enter your full name as declaration" />
              </div>
              <div>
                <Label htmlFor="declarationDate">Date *</Label>
                <Input id="declarationDate" type="date" data-testid="input-declarationDate" value={formData.declarationDate} onChange={e => updateField("declarationDate", e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="digitalSignature">Digital Signature</Label>
              <Input id="digitalSignature" data-testid="input-digitalSignature" value={formData.digitalSignature} onChange={e => updateField("digitalSignature", e.target.value)} placeholder="Type your full name as digital signature" />
            </div>
            <label className="flex items-start gap-3 cursor-pointer p-4 border border-border rounded-md bg-background hover:bg-muted/30 transition-colors">
              <Checkbox checked={formData.agreedToTerms} onCheckedChange={val => updateField("agreedToTerms", val as boolean)} data-testid="checkbox-agreedToTerms" className="mt-0.5" />
              <span className="text-sm leading-relaxed">
                I agree to the <strong>terms and conditions</strong> of the National Empowerment Scheme and confirm that all information provided is accurate and complete.
              </span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <a href="/" className="flex items-center gap-4 group">
            <img src={logoPath} alt="NES Logo" className="h-14 w-14 rounded-full border-2 border-white/40 object-cover flex-shrink-0 transition-transform group-hover:scale-105" />
            <div>
              <h1 className="font-bold text-lg leading-tight group-hover:underline">NATIONAL EMPOWERMENT SCHEME</h1>
              <p className="text-primary-foreground/80 text-xs">Training and Vocational Skills Registration Portal</p>
            </div>
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-foreground">Applicant Registration Form</h2>
            <span className="text-sm text-muted-foreground font-medium">Step {currentStep + 1} of {steps.length}</span>
          </div>
          <div className="relative">
            <div className="flex gap-1">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${idx < currentStep ? "bg-secondary" : idx === currentStep ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
          </div>
          <div className="flex overflow-x-auto gap-1 mt-3 pb-1">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs whitespace-nowrap flex-shrink-0 transition-colors ${
                  idx === currentStep ? "bg-primary text-primary-foreground font-semibold" :
                  idx < currentStep ? "bg-secondary/20 text-secondary font-medium" :
                  "text-muted-foreground"
                }`}
              >
                {idx < currentStep && <CheckCircle className="w-3 h-3" />}
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl shadow-sm p-6 md:p-8">
          <h3 className="text-xl font-bold text-foreground mb-6 pb-3 border-b border-border">
            Step {currentStep + 1}: {steps[currentStep]}
          </h3>
          {renderStep()}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 0} data-testid="button-back" className="w-full sm:w-auto">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={handleSaveDraft} disabled={saveDraft.isPending} data-testid="button-saveDraft" className="flex-1 sm:flex-none">
              <Save className="w-4 h-4 mr-1" />
              {saveDraft.isPending ? "Saving..." : "Save Draft"}
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} data-testid="button-next" className="flex-1 sm:flex-none">
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={createApplicant.isPending} data-testid="button-submit" className="flex-1 sm:flex-none bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                {createApplicant.isPending ? "Submitting..." : "Submit Registration"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
