# Module "Postuler" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete application system replacing "Postuler sur JobUp" with an AI-powered wizard that generates Swiss CV, cover letter, references page, and assembled dossier — all tailored per job posting.

**Architecture:** Monolithic Next.js 16 App Router. PDFs generated client-side via `@react-pdf/renderer` `pdf()` function, uploaded as blobs to Supabase Storage. AI content generated server-side via GPT-4o API routes. Dossier assembly server-side via `pdf-lib`. Wizard in full-screen Dialog.

**Tech Stack:** Next.js 16, React 19, Clerk 7, Supabase Storage, Drizzle ORM, GPT-4o, @react-pdf/renderer, pdf-lib, archiver, react-image-crop, shadcn/ui, sonner

**Spec:** `docs/superpowers/specs/2026-03-21-postuler-module-design.md`

---

## Phase 1: Foundation (DB + Dependencies + Config)

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install new packages**

```bash
npm install @react-pdf/renderer pdf-lib archiver react-image-crop
npm install -D @types/archiver
```

- [ ] **Step 2: Verify install succeeded**

```bash
npm ls @react-pdf/renderer pdf-lib archiver react-image-crop
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add dependencies for Postuler module (@react-pdf/renderer, pdf-lib, archiver, react-image-crop)"
```

---

### Task 2: Update next.config.ts

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add serverComponentsExternalPackages**

In `next.config.ts`, add `serverComponentsExternalPackages` to the experimental block:

```typescript
const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    clientSegmentCache: true,
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
};
```

- [ ] **Step 2: Verify dev server starts**

```bash
npm run dev
```

Confirm no errors in terminal.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "chore: add @react-pdf/renderer to serverComponentsExternalPackages"
```

---

### Task 3: Add database tables + migration

**Files:**
- Modify: `lib/db/schema.ts`
- Modify: `lib/db/kandid-queries.ts` (add new query functions in later tasks)

- [ ] **Step 1: Add new tables to schema.ts**

After the existing `savedJobs` table definition (~line 160), add:

```typescript
// =============================================================================
// Candidate Documents (profile enrichment)
// =============================================================================

export const candidateDocuments = pgTable(
  'candidate_documents',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    category: text('category').notNull(), // 'diploma' | 'certificate' | 'permit' | 'recommendation'
    label: text('label').notNull(),
    fileUrl: text('file_url').notNull(),
    fileName: text('file_name').notNull(),
    fileSize: integer('file_size').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('candidate_documents_user_category_idx').on(table.userId, table.category),
  ]
);

// =============================================================================
// Candidate References
// =============================================================================

export const candidateReferences = pgTable(
  'candidate_references',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
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
    index('candidate_references_user_idx').on(table.userId),
  ]
);

// =============================================================================
// Applications (candidatures)
// =============================================================================

export const applications = pgTable(
  'applications',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'set null' }),
    cvAnalysisId: uuid('cv_analysis_id').references(() => cvAnalyses.id, {
      onDelete: 'set null',
    }),
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
    dossierMode: text('dossier_mode'), // 'single_pdf' | 'separate_files'
    status: text('status').notNull().default('draft'), // 'draft' | 'completed'
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('applications_user_job_idx').on(table.userId, table.jobId),
  ]
);
```

- [ ] **Step 1b: Add AI generations log table (for rate limiting)**

After the `applications` table, add:

```typescript
// =============================================================================
// AI Generations Log (rate limiting tracker)
// =============================================================================

export const aiGenerationsLog = pgTable('ai_generations_log', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  applicationId: uuid('application_id')
    .references(() => applications.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'cv' | 'letter' | 'email'
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

This table tracks each actual AI generation call for rate limiting (10/day/user combined across cv, letter, email). It is NOT the applications table — updating a draft doesn't count as a generation.

- [ ] **Step 2: Add `photoUrl` column to users table**

In the `users` table definition, after the `avatarUrl` column, add:

```typescript
photoUrl: text('photo_url'),
```

- [ ] **Step 3: Add Drizzle relations for new tables**

After the existing relations block, add:

```typescript
export const candidateDocumentsRelations = relations(candidateDocuments, ({ one }) => ({
  user: one(users, { fields: [candidateDocuments.userId], references: [users.id] }),
}));

export const candidateReferencesRelations = relations(candidateReferences, ({ one }) => ({
  user: one(users, { fields: [candidateReferences.userId], references: [users.id] }),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, { fields: [applications.userId], references: [users.id] }),
  job: one(jobs, { fields: [applications.jobId], references: [jobs.id] }),
  cvAnalysis: one(cvAnalyses, { fields: [applications.cvAnalysisId], references: [cvAnalyses.id] }),
}));
```

Also update `usersRelations` to add the new reverse relations:

```typescript
candidateDocuments: many(candidateDocuments),
candidateReferences: many(candidateReferences),
applications: many(applications),
```

- [ ] **Step 4: Add type exports**

At the bottom of schema.ts, add:

```typescript
export type CandidateDocument = typeof candidateDocuments.$inferSelect;
export type NewCandidateDocument = typeof candidateDocuments.$inferInsert;
export type CandidateReference = typeof candidateReferences.$inferSelect;
export type NewCandidateReference = typeof candidateReferences.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
```

- [ ] **Step 5: Add missing imports**

Make sure `index`, `uniqueIndex`, `integer`, `jsonb`, `uuid`, `timestamp`, `text` are imported from `drizzle-orm/pg-core`. Also `relations` from `drizzle-orm`. Check existing imports and add any missing ones.

- [ ] **Step 6: Generate and run migration**

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

Verify the migration SQL creates the 3 new tables and adds `photo_url` to users.

- [ ] **Step 7: Commit**

```bash
git add lib/db/schema.ts drizzle/
git commit -m "feat: add candidate_documents, candidate_references, applications tables + users.photoUrl"
```

---

### Task 4: Create Supabase Storage buckets

**Files:**
- Modify: `lib/storage/cv-upload.ts` (add new upload functions)

- [ ] **Step 1: Create buckets via Supabase API**

Run this in the browser console on Supabase dashboard, or via API:

```bash
# Create profile-files bucket
curl -X POST "${SUPABASE_URL}/storage/v1/bucket" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"id":"profile-files","name":"profile-files","public":false,"allowed_mime_types":["application/pdf","image/jpeg","image/png"],"file_size_limit":10485760}'

# Create application-files bucket
curl -X POST "${SUPABASE_URL}/storage/v1/bucket" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"id":"application-files","name":"application-files","public":false,"allowed_mime_types":["application/pdf"],"file_size_limit":52428800}'
```

- [ ] **Step 2: Add new upload functions to cv-upload.ts**

Add these functions to `lib/storage/cv-upload.ts`:

```typescript
// =============================================================================
// Profile Files (photo, documents)
// =============================================================================

export async function uploadProfilePhoto(
  file: Buffer,
  userId: string,
  mimeType: 'image/jpeg' | 'image/png'
): Promise<string> {
  const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png';
  const path = `${userId}/photo.${ext}`;
  const supabase = getSupabaseAdmin();

  // Delete existing photo first (overwrite)
  await supabase.storage.from('profile-files').remove([path]);

  const { error } = await supabase.storage
    .from('profile-files')
    .upload(path, file, { contentType: mimeType, upsert: true });

  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return path;
}

export async function deleteProfilePhoto(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  // Try both extensions
  await supabase.storage.from('profile-files').remove([
    `${userId}/photo.jpg`,
    `${userId}/photo.png`,
  ]);
}

export async function uploadProfileDocument(
  file: Buffer,
  fileName: string,
  userId: string
): Promise<string> {
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/documents/${timestamp}-${safeName}`;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from('profile-files')
    .upload(path, file, { contentType: 'application/pdf' });

  if (error) throw new Error(`Document upload failed: ${error.message}`);
  return path;
}

export async function deleteProfileDocument(path: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from('profile-files').remove([path]);
  if (error) throw new Error(`Document delete failed: ${error.message}`);
}

export async function getProfileSignedUrl(path: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from('profile-files')
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

// =============================================================================
// Application Files (generated PDFs)
// =============================================================================

export async function uploadApplicationPdf(
  file: Buffer,
  userId: string,
  applicationId: string,
  fileName: string // 'cv.pdf' | 'lettre.pdf' | 'references.pdf' | 'dossier.pdf'
): Promise<string> {
  const path = `${userId}/${applicationId}/${fileName}`;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from('application-files')
    .upload(path, file, { contentType: 'application/pdf', upsert: true });

  if (error) throw new Error(`Application PDF upload failed: ${error.message}`);
  return path;
}

export async function getApplicationSignedUrl(path: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from('application-files')
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

export async function getApplicationFileBuffer(path: string): Promise<Buffer> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from('application-files')
    .download(path);
  if (error) throw new Error(`Download failed: ${error.message}`);
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function deleteApplicationFiles(userId: string, applicationId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const prefix = `${userId}/${applicationId}/`;
  const { data: files } = await supabase.storage
    .from('application-files')
    .list(prefix.slice(0, -1));
  if (files && files.length > 0) {
    await supabase.storage
      .from('application-files')
      .remove(files.map((f) => `${prefix}${f.name}`));
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/storage/cv-upload.ts
git commit -m "feat: add Storage upload functions for profile-files and application-files buckets"
```

---

### Task 5: Add database queries for new tables

**Files:**
- Modify: `lib/db/kandid-queries.ts`

- [ ] **Step 1: Add imports for new tables**

At the top of `kandid-queries.ts`, update imports from `./schema` to include:

```typescript
import {
  // ... existing imports ...
  candidateDocuments,
  candidateReferences,
  applications,
  type NewCandidateDocument,
  type NewCandidateReference,
} from './schema';
```

- [ ] **Step 2: Add candidate document queries**

```typescript
// =============================================================================
// Candidate Document Queries
// =============================================================================

export async function getCandidateDocuments(userId: string) {
  return db
    .select()
    .from(candidateDocuments)
    .where(eq(candidateDocuments.userId, userId))
    .orderBy(candidateDocuments.sortOrder, candidateDocuments.createdAt);
}

export async function getCandidateDocumentsByCategory(userId: string, category: string) {
  return db
    .select()
    .from(candidateDocuments)
    .where(
      and(
        eq(candidateDocuments.userId, userId),
        eq(candidateDocuments.category, category)
      )
    )
    .orderBy(candidateDocuments.sortOrder);
}

export async function createCandidateDocument(data: {
  userId: string;
  category: string;
  label: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
}) {
  // Get max sortOrder for this user
  const existing = await getCandidateDocuments(data.userId);
  const maxSort = existing.reduce((max, d) => Math.max(max, d.sortOrder), -1);

  const [doc] = await db
    .insert(candidateDocuments)
    .values({ ...data, sortOrder: maxSort + 1 })
    .returning();
  return doc;
}

export async function updateCandidateDocument(
  id: string,
  userId: string,
  data: { label?: string; category?: string; sortOrder?: number }
) {
  const [doc] = await db
    .update(candidateDocuments)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(candidateDocuments.id, id), eq(candidateDocuments.userId, userId)))
    .returning();
  return doc ?? null;
}

export async function deleteCandidateDocument(id: string, userId: string) {
  const [doc] = await db
    .delete(candidateDocuments)
    .where(and(eq(candidateDocuments.id, id), eq(candidateDocuments.userId, userId)))
    .returning();
  return doc ?? null;
}

export async function reorderCandidateDocuments(
  userId: string,
  orderedIds: string[]
) {
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(candidateDocuments)
      .set({ sortOrder: i, updatedAt: new Date() })
      .where(
        and(
          eq(candidateDocuments.id, orderedIds[i]),
          eq(candidateDocuments.userId, userId)
        )
      );
  }
}

export async function countCandidateDocuments(userId: string): Promise<number> {
  const [result] = await db
    .select({ total: count() })
    .from(candidateDocuments)
    .where(eq(candidateDocuments.userId, userId));
  return result?.total ?? 0;
}
```

- [ ] **Step 3: Add candidate reference queries**

```typescript
// =============================================================================
// Candidate Reference Queries
// =============================================================================

export async function getCandidateReferences(userId: string) {
  return db
    .select()
    .from(candidateReferences)
    .where(eq(candidateReferences.userId, userId))
    .orderBy(candidateReferences.sortOrder);
}

export async function createCandidateReference(data: {
  userId: string;
  fullName: string;
  jobTitle: string;
  company: string;
  phone?: string;
  email?: string;
  relationship?: string;
}) {
  const existing = await getCandidateReferences(data.userId);
  const maxSort = existing.reduce((max, r) => Math.max(max, r.sortOrder), -1);

  const [ref] = await db
    .insert(candidateReferences)
    .values({ ...data, sortOrder: maxSort + 1 })
    .returning();
  return ref;
}

export async function updateCandidateReference(
  id: string,
  userId: string,
  data: Partial<{
    fullName: string;
    jobTitle: string;
    company: string;
    phone: string;
    email: string;
    relationship: string;
    sortOrder: number;
  }>
) {
  const [ref] = await db
    .update(candidateReferences)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(candidateReferences.id, id), eq(candidateReferences.userId, userId)))
    .returning();
  return ref ?? null;
}

export async function deleteCandidateReference(id: string, userId: string) {
  const [ref] = await db
    .delete(candidateReferences)
    .where(and(eq(candidateReferences.id, id), eq(candidateReferences.userId, userId)))
    .returning();
  return ref ?? null;
}

export async function reorderCandidateReferences(
  userId: string,
  orderedIds: string[]
) {
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(candidateReferences)
      .set({ sortOrder: i, updatedAt: new Date() })
      .where(
        and(
          eq(candidateReferences.id, orderedIds[i]),
          eq(candidateReferences.userId, userId)
        )
      );
  }
}

export async function countCandidateReferences(userId: string): Promise<number> {
  const [result] = await db
    .select({ total: count() })
    .from(candidateReferences)
    .where(eq(candidateReferences.userId, userId));
  return result?.total ?? 0;
}
```

- [ ] **Step 4: Add application queries**

```typescript
// =============================================================================
// Application Queries
// =============================================================================

export async function createApplication(data: {
  userId: string;
  jobId: string;
  cvAnalysisId: string;
  jobTitle: string;
  jobCompany: string;
  jobDescription: string;
}) {
  const [app] = await db
    .insert(applications)
    .values(data)
    .onConflictDoUpdate({
      target: [applications.userId, applications.jobId],
      set: {
        cvAnalysisId: data.cvAnalysisId,
        updatedAt: new Date(),
      },
    })
    .returning();
  return app;
}

export async function getApplicationById(id: string, userId: string) {
  const [app] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .limit(1);
  return app ?? null;
}

export async function getApplicationsByUserId(userId: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const [countResult] = await db
    .select({ total: count() })
    .from(applications)
    .where(eq(applications.userId, userId));

  const results = await db
    .select()
    .from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.updatedAt))
    .limit(limit)
    .offset(offset);

  return {
    applications: results,
    total: countResult?.total ?? 0,
    page,
    limit,
    totalPages: Math.ceil((countResult?.total ?? 0) / limit),
  };
}

export async function updateApplication(
  id: string,
  userId: string,
  data: Partial<{
    generatedCvUrl: string;
    generatedCvData: Record<string, unknown>;
    coverLetterUrl: string;
    coverLetterText: string;
    coverLetterInstructions: string;
    emailSubject: string;
    emailBody: string;
    referencesPageUrl: string;
    dossierUrl: string;
    dossierMode: string;
    status: string;
  }>
) {
  const [app] = await db
    .update(applications)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .returning();
  return app ?? null;
}

export async function deleteApplication(id: string, userId: string) {
  const [app] = await db
    .delete(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .returning();
  return app ?? null;
}

export async function countTodayGenerations(userId: string): Promise<number> {
  // Count actual AI generation calls today using the ai_generations_log table
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [result] = await db
    .select({ total: count() })
    .from(aiGenerationsLog)
    .where(
      and(
        eq(aiGenerationsLog.userId, userId),
        sql`${aiGenerationsLog.createdAt} >= ${today}`
      )
    );
  return result?.total ?? 0;
}

export async function logAiGeneration(userId: string, type: string, applicationId: string) {
  await db.insert(aiGenerationsLog).values({ userId, type, applicationId });
}

export async function countApplicationsByUser(userId: string): Promise<number> {
  const [result] = await db
    .select({ total: count() })
    .from(applications)
    .where(eq(applications.userId, userId));
  return result?.total ?? 0;
}

export async function updateUserPhoto(userId: string, photoUrl: string | null) {
  const [user] = await db
    .update(users)
    .set({ photoUrl, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return user;
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/db/kandid-queries.ts
git commit -m "feat: add database queries for candidate_documents, candidate_references, applications"
```

---

## Phase 2: Profile Enrichment (Settings)

### Task 6: Photo upload API route + component

**Files:**
- Create: `app/api/profile/photo/route.ts`
- Create: `components/settings/photo-upload.tsx`

- [ ] **Step 1: Create photo upload API route**

Create `app/api/profile/photo/route.ts`:

```typescript
import { currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { uploadProfilePhoto, deleteProfilePhoto } from '@/lib/storage/cv-upload';
import { updateUserPhoto } from '@/lib/db/kandid-queries';

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });

  // Validate type
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    return NextResponse.json({ error: 'Format JPG ou PNG requis' }, { status: 400 });
  }

  // Validate size (5 MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Taille maximale: 5 MB' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const path = await uploadProfilePhoto(
    buffer,
    user.id,
    file.type as 'image/jpeg' | 'image/png'
  );

  await updateUserPhoto(user.id, path);

  return NextResponse.json({ path });
}

export async function DELETE() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  await deleteProfilePhoto(user.id);
  await updateUserPhoto(user.id, null);

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create photo upload component**

Create `components/settings/photo-upload.tsx`:

```typescript
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PhotoUploadProps {
  currentPhotoUrl: string | null;
}

export function PhotoUpload({ currentPhotoUrl }: PhotoUploadProps) {
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Format JPG ou PNG requis');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Taille maximale: 5 MB');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/profile/photo', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur upload');
      }

      // Show preview immediately
      setPhotoUrl(URL.createObjectURL(file));
      toast.success('Photo mise a jour');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur upload photo');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await fetch('/api/profile/photo', { method: 'DELETE' });
      setPhotoUrl(null);
      toast.success('Photo supprimee');
    } catch {
      toast.error('Erreur suppression photo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
        {photoUrl ? (
          <img src={photoUrl} alt="Photo CV" className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-8 w-8 text-gray-400" />
        )}
      </div>
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          {photoUrl ? 'Changer la photo' : 'Ajouter une photo'}
        </Button>
        {photoUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={loading}
            className="text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Supprimer
          </Button>
        )}
        <p className="text-xs text-gray-500">JPG ou PNG, max 5 MB</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/profile/photo/ components/settings/photo-upload.tsx
git commit -m "feat: add CV photo upload (API route + component)"
```

---

### Task 7: Documents API routes + component

**Files:**
- Create: `app/api/profile/documents/route.ts`
- Create: `app/api/profile/documents/[id]/route.ts`
- Create: `app/api/profile/documents/reorder/route.ts`
- Create: `components/settings/documents-section.tsx`

- [ ] **Step 1: Create documents list + upload API route**

Create `app/api/profile/documents/route.ts`:

```typescript
import { currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { uploadProfileDocument } from '@/lib/storage/cv-upload';
import {
  getCandidateDocuments,
  createCandidateDocument,
  countCandidateDocuments,
} from '@/lib/db/kandid-queries';

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  const documents = await getCandidateDocuments(user.id);
  return NextResponse.json({ documents });
}

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  // Check limit
  const docCount = await countCandidateDocuments(user.id);
  if (docCount >= 20) {
    return NextResponse.json({ error: 'Maximum 20 documents atteint' }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const category = formData.get('category') as string | null;
  const label = formData.get('label') as string | null;

  if (!file || !category || !label) {
    return NextResponse.json({ error: 'Fichier, categorie et label requis' }, { status: 400 });
  }

  const validCategories = ['diploma', 'certificate', 'permit', 'recommendation'];
  if (!validCategories.includes(category)) {
    return NextResponse.json({ error: 'Categorie invalide' }, { status: 400 });
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Format PDF requis' }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Taille maximale: 10 MB' }, { status: 400 });
  }

  // Validate PDF magic bytes
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.toString('utf-8', 0, 5) !== '%PDF-') {
    return NextResponse.json({ error: 'Fichier PDF invalide' }, { status: 400 });
  }

  const fileUrl = await uploadProfileDocument(buffer, file.name, user.id);

  const doc = await createCandidateDocument({
    userId: user.id,
    category,
    label,
    fileUrl,
    fileName: file.name,
    fileSize: file.size,
  });

  return NextResponse.json({ document: doc }, { status: 201 });
}
```

- [ ] **Step 2: Create document [id] route (PATCH + DELETE)**

Create `app/api/profile/documents/[id]/route.ts`:

```typescript
import { currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { updateCandidateDocument, deleteCandidateDocument } from '@/lib/db/kandid-queries';
import { deleteProfileDocument } from '@/lib/storage/cv-upload';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { label, category, sortOrder } = body;

  const doc = await updateCandidateDocument(id, user.id, { label, category, sortOrder });
  if (!doc) return NextResponse.json({ error: 'Document non trouve' }, { status: 404 });

  return NextResponse.json({ document: doc });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  const { id } = await params;
  const doc = await deleteCandidateDocument(id, user.id);
  if (!doc) return NextResponse.json({ error: 'Document non trouve' }, { status: 404 });

  // Delete file from Storage
  await deleteProfileDocument(doc.fileUrl);

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create reorder route**

Create `app/api/profile/documents/reorder/route.ts`:

```typescript
import { currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { reorderCandidateDocuments } from '@/lib/db/kandid-queries';

export async function PATCH(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  const { orderedIds } = await request.json();
  if (!Array.isArray(orderedIds)) {
    return NextResponse.json({ error: 'orderedIds requis' }, { status: 400 });
  }

  await reorderCandidateDocuments(user.id, orderedIds);
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Create documents section component**

Create `components/settings/documents-section.tsx`:

```typescript
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Plus, Trash2, GraduationCap, FileCheck, Shield, FileText, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  diploma: { label: 'Diplome', icon: GraduationCap },
  certificate: { label: 'Certificat de travail', icon: FileCheck },
  permit: { label: 'Permis', icon: Shield },
  recommendation: { label: 'Lettre de recommandation', icon: FileText },
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function DocumentsSection() {
  const { data, isLoading } = useSWR('/api/profile/documents', fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('');
  const [label, setLabel] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const documents = data?.documents ?? [];

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file || !category || !label.trim()) {
      toast.error('Tous les champs sont requis');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('label', label.trim());

      const res = await fetch('/api/profile/documents', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast.success('Document ajoute');
      setDialogOpen(false);
      setCategory('');
      setLabel('');
      if (fileRef.current) fileRef.current.value = '';
      mutate('/api/profile/documents');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur upload');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/profile/documents/${id}`, { method: 'DELETE' });
      toast.success('Document supprime');
      mutate('/api/profile/documents');
    } catch {
      toast.error('Erreur suppression');
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Documents justificatifs</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Categorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Label</Label>
                <Input
                  placeholder="Ex: BTS Logistique, CACES R489..."
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
              <div>
                <Label>Fichier PDF</Label>
                <Input ref={fileRef} type="file" accept="application/pdf" />
              </div>
              <Button onClick={handleUpload} disabled={uploading} className="w-full">
                {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Ajouter le document
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-gray-500">Chargement...</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun document ajoute. Ajoutez vos diplomes, certificats et permis.</p>
        ) : (
          <ul className="space-y-2">
            {documents.map((doc: any) => {
              const cat = CATEGORY_LABELS[doc.category];
              const Icon = cat?.icon ?? FileText;
              return (
                <li key={doc.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">{doc.label}</p>
                      <p className="text-xs text-gray-500">{cat?.label} — {formatSize(doc.fileSize)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-gray-400 mt-2">{documents.length}/20 documents</p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/profile/documents/ components/settings/documents-section.tsx
git commit -m "feat: add documents upload, list, delete (API routes + component)"
```

---

### Task 8: References server actions + component

**Files:**
- Modify: `app/(dashboard)/dashboard/settings/actions.ts`
- Create: `components/settings/references-section.tsx`

- [ ] **Step 1: Add reference CRUD server actions**

In `app/(dashboard)/dashboard/settings/actions.ts`, add these server actions after the existing ones:

```typescript
export async function createReferenceAction(data: {
  fullName: string;
  jobTitle: string;
  company: string;
  phone?: string;
  email?: string;
  relationship?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error('Non autorise');

  const refCount = await countCandidateReferences(userId);
  if (refCount >= 10) throw new Error('Maximum 10 references atteint');

  await createCandidateReference({ ...data, userId });
  revalidatePath('/dashboard/settings');
}

export async function updateReferenceAction(
  id: string,
  data: {
    fullName?: string;
    jobTitle?: string;
    company?: string;
    phone?: string;
    email?: string;
    relationship?: string;
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Non autorise');

  await updateCandidateReference(id, userId, data);
  revalidatePath('/dashboard/settings');
}

export async function deleteReferenceAction(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Non autorise');

  await deleteCandidateReference(id, userId);
  revalidatePath('/dashboard/settings');
}
```

Add the required imports at the top of actions.ts:

```typescript
import {
  createCandidateReference,
  updateCandidateReference,
  deleteCandidateReference,
  countCandidateReferences,
} from '@/lib/db/kandid-queries';
```

- [ ] **Step 2: Create references section component**

Create `components/settings/references-section.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Pencil, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createReferenceAction,
  updateReferenceAction,
  deleteReferenceAction,
} from '@/app/(dashboard)/dashboard/settings/actions';
import type { CandidateReference } from '@/lib/db/schema';

interface ReferencesSectionProps {
  initialReferences: CandidateReference[];
}

export function ReferencesSection({ initialReferences }: ReferencesSectionProps) {
  const [references, setReferences] = useState(initialReferences);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRef, setEditingRef] = useState<CandidateReference | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    jobTitle: '',
    company: '',
    phone: '',
    email: '',
    relationship: '',
  });

  function resetForm() {
    setForm({ fullName: '', jobTitle: '', company: '', phone: '', email: '', relationship: '' });
    setEditingRef(null);
  }

  function openEdit(ref: CandidateReference) {
    setForm({
      fullName: ref.fullName,
      jobTitle: ref.jobTitle,
      company: ref.company,
      phone: ref.phone ?? '',
      email: ref.email ?? '',
      relationship: ref.relationship ?? '',
    });
    setEditingRef(ref);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!form.fullName.trim() || !form.jobTitle.trim() || !form.company.trim()) {
      toast.error('Nom, poste et entreprise sont requis');
      return;
    }

    setLoading(true);
    try {
      if (editingRef) {
        await updateReferenceAction(editingRef.id, form);
        setReferences((prev) =>
          prev.map((r) => (r.id === editingRef.id ? { ...r, ...form } : r))
        );
        toast.success('Reference mise a jour');
      } else {
        await createReferenceAction(form);
        toast.success('Reference ajoutee');
        // Refresh page to get new data
        window.location.reload();
      }
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteReferenceAction(id);
      setReferences((prev) => prev.filter((r) => r.id !== id));
      toast.success('Reference supprimee');
    } catch {
      toast.error('Erreur suppression');
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">References professionnelles</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRef ? 'Modifier la reference' : 'Ajouter une reference'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <Label>Nom complet *</Label>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div>
                <Label>Poste *</Label>
                <Input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder="Ex: Directeur commercial" />
              </div>
              <div>
                <Label>Entreprise *</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Telephone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" />
                </div>
              </div>
              <div>
                <Label>Relation</Label>
                <Input value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} placeholder="Ex: Ancien responsable direct" />
              </div>
              <Button onClick={handleSubmit} disabled={loading} className="w-full">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingRef ? 'Mettre a jour' : 'Ajouter'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {references.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune reference ajoutee. Ajoutez vos anciens employeurs ou collegues.</p>
        ) : (
          <ul className="space-y-2">
            {references.map((ref) => (
              <li key={ref.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{ref.fullName}</p>
                    <p className="text-xs text-gray-500">{ref.jobTitle} — {ref.company}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(ref)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(ref.id)} className="text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-gray-400 mt-2">{references.length}/10 references</p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(dashboard)/dashboard/settings/actions.ts components/settings/references-section.tsx
git commit -m "feat: add references CRUD (server actions + component)"
```

---

### Task 9: Integrate new sections into Settings page

**Files:**
- Modify: `app/(dashboard)/dashboard/settings/page.tsx`

- [ ] **Step 1: Update Settings page**

Add imports for the new components and fetch data for them. The server component fetches references from DB and passes them to the client component. Documents use SWR (client-side fetch).

Add these imports at the top:

```typescript
import { PhotoUpload } from '@/components/settings/photo-upload';
import { DocumentsSection } from '@/components/settings/documents-section';
import { ReferencesSection } from '@/components/settings/references-section';
import { getCandidateReferences } from '@/lib/db/kandid-queries';
import { getProfileSignedUrl } from '@/lib/storage/cv-upload';
```

In the server component body, after fetching the user, add:

```typescript
const references = await getCandidateReferences(userId);
const photoSignedUrl = user?.photoUrl
  ? await getProfileSignedUrl(user.photoUrl)
  : null;
```

Then add 3 new Card sections after the existing "Profil" card and before "Preferences":

```tsx
{/* Photo CV */}
<Card>
  <CardHeader>
    <CardTitle className="text-lg">Photo CV</CardTitle>
    <p className="text-sm text-gray-500">
      Votre photo professionnelle pour le CV suisse
    </p>
  </CardHeader>
  <CardContent>
    <PhotoUpload currentPhotoUrl={photoSignedUrl} />
  </CardContent>
</Card>

{/* Documents */}
<DocumentsSection />

{/* References */}
<ReferencesSection initialReferences={references} />
```

- [ ] **Step 2: Update deleteAccountAction**

In `actions.ts`, update `deleteAccountAction` to also clean up new tables. Before the existing deletions, add:

```typescript
// Delete profile files (photos, documents)
const docs = await getCandidateDocuments(userId);
for (const doc of docs) {
  await deleteProfileDocument(doc.fileUrl);
}
await deleteProfilePhoto(userId);

// Delete application files
const { applications: apps } = await getApplicationsByUserId(userId, 1, 100);
for (const app of apps) {
  await deleteApplicationFiles(userId, app.id);
}

// Delete from new tables (CASCADE handles this, but be explicit)
await db.delete(candidateDocuments).where(eq(candidateDocuments.userId, userId));
await db.delete(candidateReferences).where(eq(candidateReferences.userId, userId));
await db.delete(applications).where(eq(applications.userId, userId));
```

Add the necessary imports.

- [ ] **Step 3: Verify on Chrome**

```bash
npm run dev
```

Open `http://localhost:3000/dashboard/settings` and verify:
- Photo upload section appears
- Documents section appears with "Ajouter" button
- References section appears with "Ajouter" button
- Upload a test photo, add a test document (PDF), add a test reference
- Delete each one

- [ ] **Step 4: Commit**

```bash
git add app/(dashboard)/dashboard/settings/
git commit -m "feat: integrate photo, documents, references sections into Settings page"
```

---

## Phase 3: AI Generation (Prompts + API Routes)

### Task 10: Add AI prompts for CV generation, cover letter, and email

**Files:**
- Modify: `lib/ai/prompts.ts`
- Create: `lib/ai/generate-cv.ts`
- Create: `lib/ai/generate-letter.ts`
- Create: `lib/ai/generate-email.ts`

- [ ] **Step 1: Add CV generation prompt to prompts.ts**

Add at the end of `lib/ai/prompts.ts`:

```typescript
export function buildCvGenerationPrompt() {
  return `Tu es un expert en redaction de CV suisses. Tu recois le profil extrait d'un CV existant et une offre d'emploi cible. Tu dois reorganiser et reformuler le contenu du CV pour maximiser l'adequation avec le poste.

REGLES STRICTES :
- Utilise la methode XYZ (Google) : "Accompli [X] mesure par [Y] en faisant [Z]" pour chaque experience
- Utilise la methode CAR : Contexte, Action, Resultat pour structurer les descriptions
- Applique la terminologie suisse : CDI = contrat fixe, CDD = contrat a duree determinee, BTS = diplome federal
- Ajoute les equivalences de diplomes francais vers suisses quand applicable
- Le prenom et nom doivent etre en MAJUSCULES
- Inclure : nationalite, date de naissance, etat civil
- Niveaux de langue en CECR (A1-C2)
- Maximum 4-5 experiences les plus pertinentes pour le poste
- Maximum 2-3 formations
- Competences ciblees sur les exigences de l'annonce

Tu DOIS retourner un JSON valide avec cette structure exacte :
{
  "identity": {
    "firstName": "string",
    "lastName": "string",
    "title": "string (titre professionnel adapte au poste)",
    "address": "string",
    "phone": "string",
    "email": "string",
    "nationality": "string",
    "dateOfBirth": "string",
    "civilStatus": "string"
  },
  "experiences": [
    {
      "position": "string",
      "company": "string",
      "startDate": "string (MM/YYYY)",
      "endDate": "string (MM/YYYY ou Present)",
      "description": "string (methode XYZ/CAR, 2-3 bullets separes par \\n)"
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "startDate": "string",
      "endDate": "string",
      "equivalence": "string ou null (equivalence suisse si applicable)"
    }
  ],
  "skills": ["string (competences techniques et soft skills pertinentes)"],
  "languages": [
    { "language": "string", "level": "string (niveau CECR)" }
  ],
  "interests": ["string (centres d'interet)"]
}

IMPORTANT : Ne retourne QUE le JSON, sans texte autour.`;
}

export function buildCoverLetterPrompt() {
  return `Tu es un expert en redaction de lettres de motivation pour le marche suisse. Tu utilises la methode VOUS-MOI-NOUS.

STRUCTURE OBLIGATOIRE :
1. VOUS : Ce que j'admire chez votre entreprise / les besoins que j'ai identifies dans l'annonce (1 paragraphe)
2. MOI : Mes competences et realisations pertinentes en methode CAR (1-2 paragraphes)
3. NOUS : Ce que nous allons construire ensemble, ma valeur ajoutee (1 paragraphe)

ADAPTATION DU TON :
- Banque, assurance, administration → formel, vouvoiement soutenu, phrases structurees
- Startup, tech, agence → direct, dynamique, concret
- Industrie, BTP, logistique → concret, oriente terrain, pragmatique

REGLES :
- La lettre doit tenir sur 1 page A4 maximum
- Pas de formules generiques ("je me permets de...")
- Mentionner le nom de l'entreprise et le poste specifique
- Chaque paragraphe doit etre substantiel mais concis
- Terminer par une formule de politesse suisse appropriee

Tu DOIS retourner un JSON valide :
{
  "greeting": "string (ex: Madame, Monsieur,)",
  "body": {
    "vous": "string (paragraphe VOUS)",
    "moi": "string (paragraphe(s) MOI)",
    "nous": "string (paragraphe NOUS)"
  },
  "closing": "string (formule de politesse)",
  "signature": "string (Prenom Nom)"
}

IMPORTANT : Ne retourne QUE le JSON, sans texte autour.`;
}

export function buildEmailPrompt() {
  return `Tu generes un email de candidature court et professionnel pour le marche suisse.

REGLES :
- Sujet : "Candidature — [Poste exact] — [Prenom Nom]"
- Corps : 3-4 lignes maximum
- Methode pyramide inversee : information cruciale d'abord
- Mentionner le poste et l'entreprise
- Indiquer que le dossier complet est en piece jointe
- Formule de politesse courte

Tu DOIS retourner un JSON valide :
{
  "subject": "string",
  "body": "string"
}

IMPORTANT : Ne retourne QUE le JSON, sans texte autour.`;
}
```

- [ ] **Step 2: Create generate-cv.ts**

Create `lib/ai/generate-cv.ts`:

```typescript
import OpenAI from 'openai';
import { buildCvGenerationPrompt } from './prompts';

const openai = new OpenAI();

export interface GeneratedCvData {
  identity: {
    firstName: string;
    lastName: string;
    title: string;
    address: string;
    phone: string;
    email: string;
    nationality: string;
    dateOfBirth: string;
    civilStatus: string;
  };
  experiences: Array<{
    position: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    startDate: string;
    endDate: string;
    equivalence: string | null;
  }>;
  skills: string[];
  languages: Array<{ language: string; level: string }>;
  interests: string[];
}

export async function generateCvData(
  profile: Record<string, unknown>,
  jobTitle: string,
  jobCompany: string,
  jobDescription: string,
  instructions?: string
): Promise<GeneratedCvData> {
  const userMessage = `
PROFIL DU CANDIDAT (extrait de son CV actuel) :
${JSON.stringify(profile, null, 2)}

OFFRE D'EMPLOI CIBLE :
Poste : ${jobTitle}
Entreprise : ${jobCompany}
Description : ${jobDescription}

${instructions ? `INSTRUCTIONS SUPPLEMENTAIRES DE L'UTILISATEUR :\n${instructions}` : ''}

Genere le CV adapte a cette offre.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildCvGenerationPrompt() },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 3000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');

  return JSON.parse(content) as GeneratedCvData;
}
```

- [ ] **Step 3: Create generate-letter.ts**

Create `lib/ai/generate-letter.ts`:

```typescript
import OpenAI from 'openai';
import { buildCoverLetterPrompt } from './prompts';

const openai = new OpenAI();

export interface GeneratedLetterData {
  subject: string;
  greeting: string;
  body: { vous: string; moi: string; nous: string };
  closing: string;
  signature: string;
}

export async function generateLetterData(
  profile: Record<string, unknown>,
  jobTitle: string,
  jobCompany: string,
  jobDescription: string,
  instructions?: string
): Promise<GeneratedLetterData> {
  const userMessage = `
PROFIL DU CANDIDAT :
${JSON.stringify(profile, null, 2)}

OFFRE D'EMPLOI :
Poste : ${jobTitle}
Entreprise : ${jobCompany}
Description : ${jobDescription}

${instructions ? `INSTRUCTIONS SUPPLEMENTAIRES :\n${instructions}` : ''}

Genere la lettre de motivation.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildCoverLetterPrompt() },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');

  return JSON.parse(content) as GeneratedLetterData;
}
```

- [ ] **Step 4: Create generate-email.ts**

Create `lib/ai/generate-email.ts`:

```typescript
import OpenAI from 'openai';
import { buildEmailPrompt } from './prompts';

const openai = new OpenAI();

export interface GeneratedEmailData {
  subject: string;
  body: string;
}

export async function generateEmailData(
  candidateName: string,
  jobTitle: string,
  jobCompany: string
): Promise<GeneratedEmailData> {
  const userMessage = `
Candidat : ${candidateName}
Poste : ${jobTitle}
Entreprise : ${jobCompany}

Genere l'email de candidature.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildEmailPrompt() },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.5,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');

  return JSON.parse(content) as GeneratedEmailData;
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/ai/prompts.ts lib/ai/generate-cv.ts lib/ai/generate-letter.ts lib/ai/generate-email.ts
git commit -m "feat: add AI prompts and generation functions for CV, cover letter, email"
```

---

### Task 11: Create application API routes

**Files:**
- Create: `app/api/applications/route.ts`
- Create: `app/api/applications/[id]/route.ts`
- Create: `app/api/applications/[id]/generate-cv/route.ts`
- Create: `app/api/applications/[id]/generate-letter/route.ts`
- Create: `app/api/applications/[id]/generate-email/route.ts`
- Create: `app/api/applications/[id]/upload-pdf/route.ts`

This is a large task. Create all 6 API route files. Each route validates auth, checks ownership, and delegates to the appropriate function.

- [ ] **Step 1: Create applications CRUD routes**

Create `app/api/applications/route.ts` (GET list + POST create) and `app/api/applications/[id]/route.ts` (GET single + PATCH update).

The POST route creates an application draft by fetching the job data from DB and snapshotting title/company/description. **Must check** `countApplicationsByUser(userId) < 50` before creating — return 400 if limit reached.

- [ ] **Step 1b: Create AI retry wrapper**

Create `lib/ai/with-retry.ts`:

```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}
```

Wrap all OpenAI calls in `generate-cv.ts`, `generate-letter.ts`, `generate-email.ts` with `withRetry(() => openai.chat.completions.create(...))`.

- [ ] **Step 2: Create AI generation routes**

Create the 3 generate routes. Each:
1. Gets the application by ID (verifies ownership)
2. Checks combined rate limit via `countTodayGenerations(userId)` — returns 429 if >= 10
3. Gets the CV analysis profile
4. Calls the appropriate AI function (wrapped in `withRetry`)
5. Logs the generation via `logAiGeneration(userId, type, applicationId)`
6. Updates the application row with the result
7. Returns the generated data

**ALL THREE** generate routes (cv, letter, email) must check the same combined rate limit.

- [ ] **Step 3: Create upload-pdf route**

Create `app/api/applications/[id]/upload-pdf/route.ts` that:
1. Accepts multipart/form-data with `file` (PDF blob) and `type` ('cv' | 'letter' | 'references')
2. Validates the file
3. Uploads to `application-files` bucket
4. Updates the appropriate URL column on the application

- [ ] **Step 4: Commit**

```bash
git add app/api/applications/
git commit -m "feat: add application CRUD + AI generation + PDF upload API routes"
```

---

## Phase 4: PDF Templates (React-PDF)

### Task 12: Create CV template with @react-pdf/renderer

**Files:**
- Create: `lib/pdf/cv-template.tsx`
- Create: `lib/pdf/letter-template.tsx`
- Create: `lib/pdf/references-template.tsx`

- [ ] **Step 1: Create CV template**

Create `lib/pdf/cv-template.tsx` — a React-PDF `<Document>` component with 2 `<Page size="A4">` elements. Two-column layout using Flexbox (`flexDirection: 'row'`). Left sidebar (30% width, dark background) with photo, contact, skills, languages. Right main content (70%) with experiences, education, interests. Uses `StyleSheet.create()` for all styling. Name in UPPERCASE. Professional Swiss CV aesthetic inspired by imuhammadessa/Responsive-resume.

- [ ] **Step 2: Create cover letter template**

Create `lib/pdf/letter-template.tsx` — simpler single-column A4 template. Candidate header (name, address, phone, email), date, company info, greeting, body paragraphs (VOUS-MOI-NOUS), closing, signature.

- [ ] **Step 3: Create references template**

Create `lib/pdf/references-template.tsx` — matching visual style to CV template. Title "References professionnelles", candidate name, list of references with all contact info.

- [ ] **Step 4: Commit**

```bash
git add lib/pdf/
git commit -m "feat: add @react-pdf/renderer templates for CV, cover letter, references"
```

---

## Phase 5: Dossier Assembly

### Task 13: PDF merge + ZIP generation + download route

**Files:**
- Create: `lib/pdf/assemble-dossier.ts`
- Create: `app/api/applications/[id]/assemble-dossier/route.ts`
- Create: `app/api/applications/[id]/download/route.ts`

- [ ] **Step 1: Create assemble-dossier.ts**

Uses `pdf-lib` to merge PDFs from buffers. Downloads each PDF from Storage, copies pages in strict order: CV → letter → references → documents by category (recommendation+certificate → diploma → permit).

- [ ] **Step 2: Create assemble-dossier API route**

POST route that calls the assemble function and stores the result in Storage.

- [ ] **Step 3: Create download route**

GET route that serves the assembled PDF or generates a ZIP (using `archiver`) for separate files mode. Uses `?mode=pdf` or `?mode=zip` query param. **Must set** `export const maxDuration = 60;` at top of file for large dossiers on Vercel.

- [ ] **Step 4: Commit**

```bash
git add lib/pdf/assemble-dossier.ts app/api/applications/[id]/assemble-dossier/ app/api/applications/[id]/download/
git commit -m "feat: add dossier assembly (pdf-lib merge) and download (PDF/ZIP) routes"
```

---

## Phase 6: Wizard UI

### Task 14: Create the wizard shell + Step 1 (Profile)

**Files:**
- Create: `components/application/apply-wizard.tsx`
- Create: `components/application/wizard-step-profile.tsx`

- [ ] **Step 1: Create apply-wizard.tsx**

Full-screen Dialog with step navigation (1-5). Manages current step state, application data, and step transitions. Each step is a lazy-loaded component. Shows step indicator at top. Back/forward navigation. Auto-saves draft on step change.

- [ ] **Step 2: Create wizard-step-profile.tsx**

Shows summary: photo (yes/no), documents count by category, references count. Link to Settings for missing items. "Continuer" button.

- [ ] **Step 3: Commit**

```bash
git add components/application/apply-wizard.tsx components/application/wizard-step-profile.tsx
git commit -m "feat: add wizard shell + Step 1 (profile verification)"
```

---

### Task 15: Create Step 2 (CV Editor + Preview)

**Files:**
- Create: `components/application/wizard-step-cv.tsx`
- Create: `components/application/cv-section-editor.tsx`
- Create: `components/application/cv-preview.tsx`

- [ ] **Step 1: Create cv-section-editor.tsx**

Form with sections: Identity fields, repeatable Experience blocks (add/remove/reorder), Education blocks, Skills tags, Language pairs, Interests text. Each field updates the `generatedCvData` state.

- [ ] **Step 2: Create cv-preview.tsx**

Dynamic import of `PDFViewer` with `ssr: false`. Renders the CV template with current data. Debounced updates (300ms).

- [ ] **Step 3: Create wizard-step-cv.tsx**

Split view container (form left, preview right on desktop; stacked on mobile). "Generer le CV" button calls AI endpoint. "Valider le CV" button generates PDF client-side via `pdf()`, uploads blob, advances to next step.

- [ ] **Step 4: Commit**

```bash
git add components/application/wizard-step-cv.tsx components/application/cv-section-editor.tsx components/application/cv-preview.tsx
git commit -m "feat: add Step 2 (CV generation, section editor, PDF preview)"
```

---

### Task 16: Create Step 3 (Cover Letter)

**Files:**
- Create: `components/application/wizard-step-letter.tsx`
- Create: `components/application/letter-editor.tsx`

- [ ] **Step 1: Create letter-editor.tsx**

Textarea with the full letter text. "Instructions supplementaires" input field. "Regenerer" button.

- [ ] **Step 2: Create wizard-step-letter.tsx**

"Generer la lettre" button → AI call → editor appears. "Valider la lettre" → generate PDF client-side → upload → advance.

- [ ] **Step 3: Commit**

```bash
git add components/application/wizard-step-letter.tsx components/application/letter-editor.tsx
git commit -m "feat: add Step 3 (cover letter generation + editor)"
```

---

### Task 17: Create Step 4 (Assemble) + Step 5 (Ready)

**Files:**
- Create: `components/application/wizard-step-assemble.tsx`
- Create: `components/application/wizard-step-ready.tsx`

- [ ] **Step 1: Create wizard-step-assemble.tsx**

Radio choice: single PDF or separate files. Document order preview with checkboxes to include/exclude optional pieces. "Generer le dossier" button calls assemble API route.

- [ ] **Step 2: Create wizard-step-ready.tsx**

Email subject + body with "Copier" buttons (using `navigator.clipboard.writeText`). Download dossier button. Link to original job posting. "Marquer comme postule" button.

- [ ] **Step 3: Commit**

```bash
git add components/application/wizard-step-assemble.tsx components/application/wizard-step-ready.tsx
git commit -m "feat: add Step 4 (dossier assembly) + Step 5 (ready to apply)"
```

---

## Phase 7: Integration

### Task 18: Replace "Postuler sur JobUp" button

**Files:**
- Modify: `components/jobs/job-detail.tsx`

- [ ] **Step 1: Add ApplyWizard to job-detail.tsx**

Import `ApplyWizard` and replace the "Postuler sur JobUp" button. If `hasCvAnalysis` and `cvAnalysisId` are set, show the "Postuler" button that opens the wizard. Otherwise show "Analysez d'abord votre CV" with link to `/dashboard/cv-analysis`.

Keep the "Postuler sur JobUp" button as a secondary link ("Voir l'annonce originale") for users who want to apply directly.

The button opens `<ApplyWizard jobId={job.id} cvAnalysisId={cvAnalysisId} />` in a Dialog.

- [ ] **Step 2: Verify on Chrome**

Open `http://localhost:3000/dashboard/jobs`, select a job, verify:
- "Postuler" button appears (if CV analyzed)
- Clicking opens the wizard Dialog
- Step 1 shows profile summary
- Step 2 generates CV via AI, shows editor + preview
- Step 3 generates cover letter
- Step 4 assembles dossier
- Step 5 shows email + download

- [ ] **Step 3: Commit**

```bash
git add components/jobs/job-detail.tsx
git commit -m "feat: replace Postuler sur JobUp with internal wizard button"
```

---

### Task 19: Final verification + cleanup

- [ ] **Step 1: Full flow test on Chrome**

Test the complete flow:
1. Go to Settings → upload photo, add a document, add a reference
2. Go to Jobs → select a job → click "Postuler"
3. Step 1: verify profile shows photo, document, reference
4. Step 2: generate CV → edit a field → verify preview updates → validate
5. Step 3: generate letter → edit text → validate
6. Step 4: choose single PDF → generate dossier
7. Step 5: copy email → download dossier → mark as applied

- [ ] **Step 2: Fix any issues found during testing**

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Postuler module - CV generation, cover letter, dossier assembly wizard"
```
