import {
  pgTable,
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
    status: text('status').default('active'), // active | expired | reposted
    publishedAt: timestamp('published_at'),
    expiresAt: timestamp('expires_at'),
    lastSeenAt: timestamp('last_seen_at').defaultNow(),
    lastCheckedAt: timestamp('last_checked_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_jobs_status').on(table.status),
    index('idx_jobs_canton').on(table.canton),
    index('idx_jobs_contract_type').on(table.contractType),
    index('idx_jobs_published_at').on(table.publishedAt),
    // GIN index for skills array
    index('idx_jobs_skills').using('gin', table.skills),
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
}));

export const cvAnalysesRelations = relations(cvAnalyses, ({ one, many }) => ({
  user: one(users, {
    fields: [cvAnalyses.userId],
    references: [users.id],
    relationName: 'userCvAnalyses',
  }),
  jobMatches: many(jobMatches),
}));

export const jobsRelations = relations(jobs, ({ many }) => ({
  jobMatches: many(jobMatches),
  savedJobs: many(savedJobs),
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
