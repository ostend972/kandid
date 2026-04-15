import { z } from 'zod';

export const linkedinStructuredProfileSchema = z.object({
  headline: z.string().min(1),
  summary: z.string().min(1),
  experience: z.array(
    z.object({
      position: z.string().min(1),
      company: z.string().min(1),
      location: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      description: z.string().optional(),
    })
  ),
  education: z.array(
    z.object({
      degree: z.string().min(1),
      institution: z.string().min(1),
      location: z.string().optional(),
      year: z.string().optional(),
    })
  ),
  skills: z.array(z.string()),
  certifications: z.array(z.string()),
  languages: z.array(
    z.object({
      lang: z.string().min(1),
      level: z.string().min(1),
    })
  ),
});

export const linkedinAuditResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  weaknesses: z.array(
    z.object({
      category: z.string().min(1),
      description: z.string().min(1),
      impact: z.string().min(1),
    })
  ),
  recommendations: z.array(
    z.object({
      category: z.string().min(1),
      action: z.string().min(1),
      priority: z.string().min(1),
      example: z.string().min(1),
    })
  ),
});

export const linkedinOptimizeResultSchema = z.object({
  headline: z.string().min(1),
  summary: z.string().min(1),
});

const contentTypes = [
  'expertise',
  'actualite',
  'success_story',
  'recommandation',
] as const;

export const linkedinPostSchema = z.object({
  weekNumber: z.number().int().min(1).max(4),
  dayOfWeek: z.string().min(1),
  contentType: z.enum(contentTypes),
  title: z.string().min(1),
  draftContent: z.string().min(1),
});

export const linkedinCalendarResultSchema = z
  .array(linkedinPostSchema)
  .min(8)
  .max(20);

export type LinkedinStructuredProfile = z.infer<typeof linkedinStructuredProfileSchema>;
export type LinkedinAuditResult = z.infer<typeof linkedinAuditResultSchema>;
export type LinkedinOptimizeResult = z.infer<typeof linkedinOptimizeResultSchema>;
export type LinkedinPostData = z.infer<typeof linkedinPostSchema>;
export type LinkedinCalendarResult = z.infer<typeof linkedinCalendarResultSchema>;
