import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  uuid,
  jsonb,
  boolean,
  doublePrecision,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// =============================================================================
// Enums
// =============================================================================

export const applicationStatusEnum = pgEnum('application_status', [
  'draft',
  'applied',
  'screening',
  'interview',
  'offer',
  'accepted',
  'rejected',
  'withdrawn',
]);

// =============================================================================
// Kandid Application Tables
// =============================================================================

/**
 * Users — synced from Clerk via webhook.
 * Primary key is the Clerk user ID (text).
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull().unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  plan: text('plan').default('free'), // free | pro | premium
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  activeCvAnalysisId: uuid('active_cv_analysis_id'), // FK added via relations
  photoUrl: text('photo_url'),
  preferredCantons: text('preferred_cantons')
    .array()
    .default(sql`'{}'::text[]`),
  preferredActivityRate: integer('preferred_activity_rate'),
  weeklyDigestEnabled: boolean('weekly_digest_enabled').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * CV Analyses — stores uploaded CV analysis results.
 */
export const cvAnalyses = pgTable('cv_analyses', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(), // Supabase Storage path
  imageUrl: text('image_url'), // PDF first page as image URL
  overallScore: integer('overall_score').notNull(), // 0-100
  profile: jsonb('profile').notNull(), // Extracted structured profile
  feedback: jsonb('feedback').notNull(), // Detailed feedback per category
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Jobs — populated by the scraper.
 */
export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    externalId: text('external_id').notNull().unique(), // JobUp UUID
    deduplicationHash: text('deduplication_hash').notNull().unique(), // SHA-256(title+company+canton)
    source: text('source').notNull().default('jobup'),
    sourceUrl: text('source_url').notNull(),
    title: text('title').notNull(),
    company: text('company').notNull(),
    canton: text('canton').notNull(),
    description: text('description').notNull(),
    salary: text('salary'),
    contractType: text('contract_type'), // CDI | CDD
    activityRate: text('activity_rate'),
    language: text('language'),
    skills: text('skills')
      .array()
      .default(sql`'{}'::text[]`),
    languageSkills: jsonb('language_skills').default(sql`'[]'::jsonb`),
    categories: jsonb('categories').default(sql`'[]'::jsonb`),
    email: text('email'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    benefitIds: jsonb('benefit_ids').default(sql`'[]'::jsonb`),
    employmentPositionIds: jsonb('employment_position_ids').default(sql`'[]'::jsonb`),
    industryId: integer('industry_id'),
    status: text('status').default('active'), // active | expired | reposted
    publishedAt: timestamp('published_at'),
    expiresAt: timestamp('expires_at'),
    lastSeenAt: timestamp('last_seen_at').defaultNow(),
    lastCheckedAt: timestamp('last_checked_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    legitimacyTier: text('legitimacy_tier'), // 'high' | 'caution' | 'suspicious'
    legitimacyScore: integer('legitimacy_score'), // 0-100
    legitimacySignals: jsonb('legitimacy_signals'), // Array<{ signal, finding, weight }>
  },
  (table) => [
    index('idx_jobs_status').on(table.status),
    index('idx_jobs_canton').on(table.canton),
    index('idx_jobs_contract_type').on(table.contractType),
    index('idx_jobs_published_at').on(table.publishedAt),
    // GIN index for skills array
    index('idx_jobs_skills').using('gin', table.skills),
    index('idx_jobs_legitimacy_tier').on(table.legitimacyTier),
  ]
);

/**
 * Job Matches — cached AI match results between a CV analysis and a job.
 */
export const jobMatches = pgTable(
  'job_matches',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cvAnalysisId: uuid('cv_analysis_id')
      .notNull()
      .references(() => cvAnalyses.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    overallScore: integer('overall_score').notNull(), // 0-100
    verdict: text('verdict').notNull(), // excellent | partial | low
    requirements: jsonb('requirements').notNull(), // per-requirement breakdown
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_job_matches_cv_job').on(table.cvAnalysisId, table.jobId),
  ]
);

/**
 * Saved Jobs — user bookmarks.
 */
export const savedJobs = pgTable(
  'saved_jobs',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_saved_jobs_user_job').on(table.userId, table.jobId),
  ]
);

/**
 * Candidate Documents — stores uploaded profile documents (diplomas, certificates, etc.).
 */
export const candidateDocuments = pgTable(
  'candidate_documents',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    category: text('category').notNull(), // diploma | certificate | permit | recommendation
    label: text('label').notNull(),
    fileUrl: text('file_url').notNull(),
    fileName: text('file_name').notNull(),
    fileSize: integer('file_size').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_candidate_documents_user_category').on(table.userId, table.category),
  ]
);

/**
 * Candidate References — professional reference contacts.
 */
export const candidateReferences = pgTable(
  'candidate_references',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fullName: text('full_name').notNull(),
    jobTitle: text('job_title').notNull(),
    company: text('company').notNull(),
    phone: text('phone'),
    email: text('email'),
    relationship: text('relationship'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_candidate_references_user').on(table.userId),
  ]
);

/**
 * Applications — each generated candidature (CV + letter + dossier).
 */
export const applications = pgTable(
  'applications',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id')
      .references(() => jobs.id, { onDelete: 'set null' }),
    cvAnalysisId: uuid('cv_analysis_id')
      .references(() => cvAnalyses.id, { onDelete: 'set null' }),
    jobTitle: text('job_title'),
    jobCompany: text('job_company'),
    jobDescription: text('job_description'),
    generatedCvUrl: text('generated_cv_url'),
    generatedCvData: jsonb('generated_cv_data'),
    coverLetterUrl: text('cover_letter_url'),
    coverLetterText: text('cover_letter_text'),
    coverLetterInstructions: text('cover_letter_instructions'),
    emailSubject: text('email_subject'),
    emailBody: text('email_body'),
    referencesPageUrl: text('references_page_url'),
    dossierUrl: text('dossier_url'),
    dossierMode: text('dossier_mode'),
    status: applicationStatusEnum('status').notNull().default('draft'),
    lastStatusChangedAt: timestamp('last_status_changed_at'),
    nextFollowUpAt: timestamp('next_follow_up_at'),
    followUpCount: integer('follow_up_count').notNull().default(0),
    lastReminderSentAt: timestamp('last_reminder_sent_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_applications_user_job').on(table.userId, table.jobId),
  ]
);

/**
 * Application Transitions — timestamped state change history.
 */
export const applicationTransitions = pgTable(
  'application_transitions',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    fromStatus: text('from_status').notNull(),
    toStatus: text('to_status').notNull(),
    triggeredBy: text('triggered_by').notNull(), // 'user' | 'system'
    note: text('note'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_application_transitions_app').on(table.applicationId),
  ]
);

/**
 * AI Generations Log — rate limiting tracker for AI-generated content.
 */
export const aiGenerationsLog = pgTable('ai_generations_log', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  applicationId: uuid('application_id')
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // cv | letter | email
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  totalTokens: integer('total_tokens'),
  costUsd: text('cost_usd'), // store as string to avoid float precision issues, e.g. "0.00234"
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =============================================================================
// Relations
// =============================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  activeCvAnalysis: one(cvAnalyses, {
    fields: [users.activeCvAnalysisId],
    references: [cvAnalyses.id],
    relationName: 'activeCvAnalysis',
  }),
  cvAnalyses: many(cvAnalyses, { relationName: 'userCvAnalyses' }),
  jobMatches: many(jobMatches),
  savedJobs: many(savedJobs),
  candidateDocuments: many(candidateDocuments),
  candidateReferences: many(candidateReferences),
  applications: many(applications),
}));

export const cvAnalysesRelations = relations(cvAnalyses, ({ one, many }) => ({
  user: one(users, {
    fields: [cvAnalyses.userId],
    references: [users.id],
    relationName: 'userCvAnalyses',
  }),
  jobMatches: many(jobMatches),
  applications: many(applications),
}));

export const jobsRelations = relations(jobs, ({ many }) => ({
  jobMatches: many(jobMatches),
  savedJobs: many(savedJobs),
  applications: many(applications),
}));

export const jobMatchesRelations = relations(jobMatches, ({ one }) => ({
  user: one(users, {
    fields: [jobMatches.userId],
    references: [users.id],
  }),
  cvAnalysis: one(cvAnalyses, {
    fields: [jobMatches.cvAnalysisId],
    references: [cvAnalyses.id],
  }),
  job: one(jobs, {
    fields: [jobMatches.jobId],
    references: [jobs.id],
  }),
}));

export const savedJobsRelations = relations(savedJobs, ({ one }) => ({
  user: one(users, {
    fields: [savedJobs.userId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [savedJobs.jobId],
    references: [jobs.id],
  }),
}));

export const candidateDocumentsRelations = relations(candidateDocuments, ({ one }) => ({
  user: one(users, {
    fields: [candidateDocuments.userId],
    references: [users.id],
  }),
}));

export const candidateReferencesRelations = relations(candidateReferences, ({ one }) => ({
  user: one(users, {
    fields: [candidateReferences.userId],
    references: [users.id],
  }),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  cvAnalysis: one(cvAnalyses, {
    fields: [applications.cvAnalysisId],
    references: [cvAnalyses.id],
  }),
  aiGenerationsLog: many(aiGenerationsLog),
  transitions: many(applicationTransitions),
}));

export const applicationTransitionsRelations = relations(applicationTransitions, ({ one }) => ({
  application: one(applications, {
    fields: [applicationTransitions.applicationId],
    references: [applications.id],
  }),
}));

export const aiGenerationsLogRelations = relations(aiGenerationsLog, ({ one }) => ({
  user: one(users, {
    fields: [aiGenerationsLog.userId],
    references: [users.id],
  }),
  application: one(applications, {
    fields: [aiGenerationsLog.applicationId],
    references: [applications.id],
  }),
}));

// =============================================================================
// Legacy Boilerplate Tables (from next-saas-starter)
// Kept for reference — will be cleaned up or migrated later.
// =============================================================================

export const legacyUsers = pgTable('legacy_users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const legacyTeams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const legacyTeamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  teamId: integer('team_id')
    .notNull()
    .references(() => legacyTeams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const legacyActivityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => legacyTeams.id),
  userId: integer('user_id'),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const legacyInvitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => legacyTeams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by').notNull(),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const legacyTeamsRelations = relations(legacyTeams, ({ many }) => ({
  teamMembers: many(legacyTeamMembers),
  activityLogs: many(legacyActivityLogs),
  invitations: many(legacyInvitations),
}));

export const legacyTeamMembersRelations = relations(
  legacyTeamMembers,
  ({ one }) => ({
    team: one(legacyTeams, {
      fields: [legacyTeamMembers.teamId],
      references: [legacyTeams.id],
    }),
  })
);

export const legacyActivityLogsRelations = relations(
  legacyActivityLogs,
  ({ one }) => ({
    team: one(legacyTeams, {
      fields: [legacyActivityLogs.teamId],
      references: [legacyTeams.id],
    }),
  })
);

export const legacyInvitationsRelations = relations(
  legacyInvitations,
  ({ one }) => ({
    team: one(legacyTeams, {
      fields: [legacyInvitations.teamId],
      references: [legacyTeams.id],
    }),
  })
);

// =============================================================================
// Type Exports
// =============================================================================

// Kandid types
export type KandidUser = typeof users.$inferSelect;
export type NewKandidUser = typeof users.$inferInsert;
export type CvAnalysis = typeof cvAnalyses.$inferSelect;
export type NewCvAnalysis = typeof cvAnalyses.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type JobMatch = typeof jobMatches.$inferSelect;
export type NewJobMatch = typeof jobMatches.$inferInsert;
export type SavedJob = typeof savedJobs.$inferSelect;
export type NewSavedJob = typeof savedJobs.$inferInsert;
export type CandidateDocument = typeof candidateDocuments.$inferSelect;
export type NewCandidateDocument = typeof candidateDocuments.$inferInsert;
export type CandidateReference = typeof candidateReferences.$inferSelect;
export type NewCandidateReference = typeof candidateReferences.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type ApplicationTransition = typeof applicationTransitions.$inferSelect;
export type NewApplicationTransition = typeof applicationTransitions.$inferInsert;
export type ApplicationStatus = (typeof applicationStatusEnum.enumValues)[number];

// Legitimacy scoring types
export type LegitimacyTier = 'high' | 'caution' | 'suspicious';
export type LegitimacySignal = { signal: string; finding: string; weight: number };
export type LegitimacyResult = { tier: LegitimacyTier; score: number; signals: LegitimacySignal[] };

// Legacy types (kept for backward compatibility)
/** @deprecated Use KandidUser instead — will be removed after Clerk migration */
export type User = typeof legacyUsers.$inferSelect;
/** @deprecated Use NewKandidUser instead */
export type NewUser = typeof legacyUsers.$inferInsert;
export type Team = typeof legacyTeams.$inferSelect;
export type NewTeam = typeof legacyTeams.$inferInsert;
export type TeamMember = typeof legacyTeamMembers.$inferSelect;
export type NewTeamMember = typeof legacyTeamMembers.$inferInsert;
export type ActivityLog = typeof legacyActivityLogs.$inferSelect;
export type NewActivityLog = typeof legacyActivityLogs.$inferInsert;
export type Invitation = typeof legacyInvitations.$inferSelect;
export type NewInvitation = typeof legacyInvitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

// Keep legacy enum for backward compatibility
export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}
