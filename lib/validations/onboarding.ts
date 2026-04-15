import { z } from 'zod';

const cecrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

const languageEntrySchema = z.object({
  lang: z.string().min(1),
  level: z.enum(cecrLevels),
});

export const onboardingStep1Schema = z.object({
  sector: z.string().min(1),
  position: z.string().min(1),
  experienceLevel: z.enum(['junior', 'mid', 'senior', 'executive']),
  targetCantons: z.array(z.string().min(1)).min(1),
  languages: z.array(languageEntrySchema).min(1),
  salaryExpectation: z.string().min(1),
  availability: z.enum(['immediate', '1_month', '3_months', 'negotiable']),
  contractTypes: z.array(z.string().min(1)).min(1),
});

export const onboardingStep2Schema = z.object({
  careerSummary: z.string().max(500),
  strengths: z
    .array(z.string().min(1))
    .length(3),
  motivation: z.string().max(300),
  differentiator: z.string().max(300),
});

export type OnboardingStep1Data = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2Data = z.infer<typeof onboardingStep2Schema>;
