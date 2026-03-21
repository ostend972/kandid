# Module "Postuler" — Design Spec

**Date:** 2026-03-21
**Status:** Approved
**Author:** Alan + Claude

## Overview

Complete application system for Kandid. Replaces the external "Postuler sur JobUp" link with an internal wizard that generates a Swiss CV (2 pages), cover letter (VOUS-MOI-NOUS method), references page, and assembles a full application dossier — all AI-powered and tailored to each specific job posting.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| PDF generation | `@react-pdf/renderer` (client-side render + upload) | Pure JS, React components for structured layouts. PDF generated client-side via `pdf()` then uploaded to Storage. Avoids server-side `renderToBuffer` bugs with Next.js 15+. |
| PDF merging | `pdf-lib` (pure JS) | Lightweight, no binary deps, sufficient for concatenating PDFs |
| Workflow UX | Multi-step wizard in Dialog/Modal | Guides the user, no new nav entry needed |
| Document storage | Permanent in Supabase Storage | Users revisit past applications |
| Document uploads | Individual with label + category | Required for ordered dossier assembly |
| Cover letter editing | Textarea with full edit capability | User can freely modify AI-generated text |
| CV editing | Structured section-based editor + live preview | Reliable layout control, section-level granularity |
| Email | Prepare text for user to copy, not sent by Kandid | Avoids deliverability issues |
| Architecture | Monolithic (all in Next.js) | Simplicity for beta, single deployment |

> **Note on Puppeteer:** Initially chosen for pixel-perfect rendering, but incompatible with Vercel serverless (250 MB limit, read-only filesystem). `@react-pdf/renderer` provides sufficient control for structured documents (CV, cover letter, references). If higher fidelity is needed later, a remote rendering service (Browserless, Gotenberg) can be added.

> **Note on PDF generation strategy:** `@react-pdf/renderer`'s `renderToBuffer()` has active bugs with Next.js 15+ App Router (React error #31, PDFDocument constructor issues). To avoid these, PDFs are generated **client-side** using the `pdf()` function (returns a Blob), then uploaded to Storage via a simple API route. The `<PDFViewer>` component provides live preview client-side. This hybrid approach is more reliable than server-side rendering.

## Technical Requirements

- Add `serverComponentsExternalPackages: ['@react-pdf/renderer']` to `next.config.js`
- `<PDFViewer>` must be loaded via `dynamic(() => import(...), { ssr: false })` in Next.js
- Debounce PDFViewer re-renders (300-500ms delay after last edit) to avoid performance issues
- Styling uses `StyleSheet.create()` (Yoga/Flexbox engine, similar to React Native — NOT standard CSS)
- Register custom fonts with `Font.register()` (Helvetica is built-in)
- Configure CORS on Supabase Storage buckets (`profile-files`, `application-files`) to allow image loading in browser-side PDFViewer. Alternative: convert photos to base64 before passing to `<Image>` component.
- For photos in PDFViewer: use base64 data URLs to avoid CORS issues (photo converted client-side before injection into template)

## Security

- All Supabase Storage operations use the service role key (server-side only, never exposed to client)
- Every API route must verify that the authenticated `userId` matches the resource owner
- Generated PDF URLs use signed URLs with 1-hour expiration (consistent with existing `getCVSignedUrl`)
- Document uploads validated server-side: MIME type check, PDF magic bytes verification, 10 MB size limit
- Photo uploads validated: MIME type (image/jpeg, image/png), 5 MB size limit

## Supabase Storage Buckets

- `cv-files` — existing bucket, for uploaded CVs (unchanged)
- `profile-files` — **new bucket**, for CV photos and profile documents (diplomas, certificates, permits, recommendations)
- `application-files` — **new bucket**, for generated PDFs (CV, cover letter, references page, assembled dossier)

Path conventions:
- Photos: `profile-files/{userId}/photo.{ext}`
- Documents: `profile-files/{userId}/documents/{timestamp}-{filename}.pdf`
- Generated CV: `application-files/{userId}/{applicationId}/cv.pdf`
- Generated letter: `application-files/{userId}/{applicationId}/lettre.pdf`
- Generated references: `application-files/{userId}/{applicationId}/references.pdf`
- Assembled dossier: `application-files/{userId}/{applicationId}/dossier.pdf`

## Limits

- Max 20 documents per user
- Max 10 references per user
- Max 50 draft applications per user
- Document file size: 10 MB max
- Photo file size: 5 MB max
- AI generation rate limit: 10 generations per day per user (across generate-cv, generate-letter, generate-email combined). Enforced server-side, returns 429 with clear message.

## Error Handling (UI)

All AI generation and PDF export operations follow a consistent error pattern:
- **Loading**: spinner + disabled button during processing
- **Success**: toast notification (sonner) + auto-advance to next step
- **Failure**: toast error with clear message in French (e.g., "La generation a echoue. Veuillez reessayer.") + "Reessayer" button
- **Retry**: max 2 automatic retries with exponential backoff on API routes (GPT-4o timeouts). After that, surface error to user.
- **Network errors**: "Connexion perdue. Verifiez votre connexion et reessayez."
- **Rate limit hit**: "Limite quotidienne atteinte (10 generations/jour). Reessayez demain."

## Mobile Responsiveness

- Wizard Dialog uses full-screen sheet on mobile (no side padding)
- CV editor: split view (form + preview) on desktop, stacked layout on mobile (form above, preview below as collapsible section)
- All wizard steps use single-column layout on screens < 768px

## Database Schema Changes

### New table: `candidate_documents`

Stores uploaded profile documents (diplomas, certificates, permits, recommendation letters).

```
id             UUID PK default gen_random_uuid()
userId         text FK → users.id ON DELETE CASCADE
category       text NOT NULL — 'diploma' | 'certificate' | 'permit' | 'recommendation'
label          text NOT NULL — user-defined label (e.g., "BTS Logistique", "CACES R489")
fileUrl        text NOT NULL — Supabase Storage path
fileName       text NOT NULL — original file name
fileSize       integer NOT NULL — bytes
sortOrder      integer NOT NULL DEFAULT 0
createdAt      timestamp NOT NULL DEFAULT now()
updatedAt      timestamp NOT NULL DEFAULT now()
```

Index: `(userId, category)` for filtered queries.

### New table: `candidate_references`

Professional reference contacts.

```
id             UUID PK default gen_random_uuid()
userId         text FK → users.id ON DELETE CASCADE
fullName       text NOT NULL
jobTitle       text NOT NULL — reference person's position
company        text NOT NULL
phone          text
email          text
relationship   text — e.g., "Ancien responsable direct"
sortOrder      integer NOT NULL DEFAULT 0
createdAt      timestamp NOT NULL DEFAULT now()
updatedAt      timestamp NOT NULL DEFAULT now()
```

Index: `(userId)`.

### New table: `applications`

Each generated application (CV + letter + dossier for a specific job).

```
id                      UUID PK default gen_random_uuid()
userId                  text FK → users.id ON DELETE CASCADE
jobId                   UUID FK → jobs.id ON DELETE SET NULL
cvAnalysisId            UUID FK → cv_analyses.id ON DELETE SET NULL
jobTitle                text — snapshot of job title at application time
jobCompany              text — snapshot of company name
jobDescription          text — snapshot of job description (for regeneration)
generatedCvUrl          text — Storage path to generated CV PDF
generatedCvData         JSONB — edited CV data by sections
coverLetterUrl          text — Storage path to generated cover letter PDF
coverLetterText         text — full text content of the letter
coverLetterInstructions text — user instructions for regeneration
emailSubject            text — prepared email subject line
emailBody               text — prepared email body text
referencesPageUrl       text — Storage path to references PDF
dossierUrl              text — Storage path to assembled dossier PDF
dossierMode             text — 'single_pdf' | 'separate_files'
status                  text NOT NULL DEFAULT 'draft' — 'draft' | 'completed'
createdAt               timestamp NOT NULL DEFAULT now()
updatedAt               timestamp NOT NULL DEFAULT now()
```

Index: `(userId, jobId)` unique — one application per job per user.

> **Note:** `jobTitle`, `jobCompany`, and `jobDescription` are snapshots taken at application creation time. This ensures the application remains self-contained even if the job is later deleted or expired (`ON DELETE SET NULL`).

### Modified table: `users`

Add column:

```
photoUrl       text — Supabase Storage path to CV photo
```

### Drizzle Relations

Update existing relations (`usersRelations`, `jobsRelations`, `cvAnalysesRelations`) and add new relation definitions for `candidateDocuments`, `candidateReferences`, and `applications`.

### Account Deletion

Update `deleteAccountAction` in `settings/actions.ts` to also:
- Delete Storage files for photos, documents, and application PDFs
- Explicitly delete from `candidate_documents`, `candidate_references`, and `applications`

## Sub-system 1: Enriched Candidate Profile (Settings)

Located in the existing Settings page (`/dashboard/settings`). Three new sections added below existing preferences.

### 1.1 CV Photo

- Upload image input (JPG/PNG, max 5 MB, validated server-side)
- Square preview with client-side crop using `react-image-crop` (instant feedback, reduced bandwidth)
- Stored in Supabase Storage: `profile-files/{userId}/photo.{ext}`
- Saved to `users.photoUrl`
- Reused in generated CV and Kandid profile header

### 1.2 Documents

- "Ajouter un document" button opens a Dialog
- Dialog fields: category select (Diplome / Certificat de travail / Permis / Lettre de recommandation), free-text label, PDF file input
- Stored in Storage: `profile-files/{userId}/documents/{timestamp}-{filename}.pdf`
- Server-side validation: MIME type, PDF magic bytes, 10 MB limit
- Displayed as a list: icon per category, label, file size, delete button
- Drag & drop to reorder (sets `sortOrder`)
- Max 20 documents per user

### 1.3 References

- "Ajouter une reference" button opens a Dialog
- Form fields: fullName, jobTitle, company, phone, email, relationship
- Displayed as a list with edit/delete buttons
- Reorderable (drag & drop)
- Max 10 references per user

### API Routes

File uploads use Route Handlers (multipart/form-data). CRUD operations on references use Server Actions (consistent with existing Settings pattern).

- `POST /api/profile/photo` — upload photo, returns Storage path
- `DELETE /api/profile/photo` — delete photo
- `GET /api/profile/documents` — list user's documents
- `POST /api/profile/documents` — upload document with category + label
- `PATCH /api/profile/documents/[id]` — update label, category, or sortOrder
- `DELETE /api/profile/documents/[id]` — delete document
- `PATCH /api/profile/documents/reorder` — bulk update sortOrder
- References CRUD via Server Actions in `settings/actions.ts`:
  - `createReferenceAction`, `updateReferenceAction`, `deleteReferenceAction`, `reorderReferencesAction`

## Sub-system 2: Swiss CV Generation (2 pages)

### 2.1 React-PDF Template

- Inspired by `imuhammadessa/Responsive-resume` design
- Built with `@react-pdf/renderer` React components
- Two-column layout: left sidebar (photo, contact info, skills, languages) + right main content (experiences, education)
- Exactly 2 A4 pages (Swiss standard)
- Photo at top of sidebar
- Name in UPPERCASE, nationality, date of birth, civil status
- Clean, modern, professional aesthetic

### 2.2 AI Prompt (GPT-4o)

Input:
- `cvAnalyses.profile` (extracted structured data)
- `jobs.description` + `jobs.title` + `jobs.company` (target job)
- User's photo URL (for template injection)
- User's additional instructions (optional)

The AI:
- Reorganizes and reformulates experiences using **XYZ/CAR** methods targeted to the job
- Highlights relevant skills matching job requirements
- Applies Swiss terminology (CDI → contrat fixe, etc.)
- Adds FR→CH diploma equivalences
- Returns structured JSON:

```json
{
  "identity": {
    "firstName": "", "lastName": "", "title": "",
    "address": "", "phone": "", "email": "",
    "nationality": "", "dateOfBirth": "", "civilStatus": "",
    "photoUrl": ""
  },
  "experiences": [
    { "position": "", "company": "", "startDate": "", "endDate": "", "description": "" }
  ],
  "education": [
    { "degree": "", "institution": "", "startDate": "", "endDate": "", "equivalence": "" }
  ],
  "skills": [""],
  "languages": [
    { "language": "", "level": "" }
  ],
  "interests": [""]
}
```

### 2.3 Section-Based Editor

After AI generation, the user sees a structured form:
- **Identity**: name, title, address, phone, email, nationality, DOB, civil status fields
- **Experiences**: list of blocks (position, company, dates, description) — add/remove/reorder
- **Education**: list of blocks (degree, institution, dates)
- **Skills**: editable tag list
- **Languages**: language + CEFR level pairs
- **Interests**: free text

Split view: form on the left, live PDF preview on the right using `@react-pdf/renderer`'s `<PDFViewer>` component (renders the actual React-PDF template in an iframe — 100% fidelity with the exported PDF, no HTML approximation).
Each modification updates `applications.generatedCvData` (JSONB).

On mobile (< 768px): stacked layout, preview collapsed by default with "Voir l'apercu" toggle.

### 2.4 PDF Export

- Client-side: `pdf(<CvDocument data={generatedCvData} />)` generates a Blob
- Blob uploaded to API route `POST /api/applications/[id]/upload-cv` (simple file upload, no PDF rendering server-side)
- Stored in Storage: `application-files/{userId}/{applicationId}/cv.pdf`
- Path saved to `applications.generatedCvUrl`

## Sub-system 3: Cover Letter (VOUS-MOI-NOUS)

### 3.1 AI Prompt (GPT-4o)

Input:
- `cvAnalyses.profile` (candidate data)
- `jobs.description` + `jobs.title` + `jobs.company` (target job)
- User's additional instructions (optional)

Structure enforced — **VOUS-MOI-NOUS**:
- **VOUS**: What I admire about your company / your needs identified in the posting
- **MOI**: My relevant skills and achievements (CAR method)
- **NOUS**: What we will build together, my value proposition

Tone adaptation based on company type:
- Banking/insurance/administration → formal
- Startup/tech/agency → direct, dynamic
- Industry/construction → concrete, field-oriented

Returns JSON:
```json
{
  "subject": "Candidature — [Poste] — [Prenom Nom]",
  "greeting": "Madame, Monsieur,",
  "body": {
    "vous": "paragraph text",
    "moi": "paragraph text",
    "nous": "paragraph text"
  },
  "closing": "formal closing",
  "signature": "Prenom Nom"
}
```

### 3.2 Editor

- Full textarea with the complete letter text (assembled from JSON paragraphs)
- User can freely modify content
- "Instructions supplementaires" field (e.g., "insiste sur mon experience en logistique")
- "Regenerer" button re-runs the prompt with instructions
- Saved to `applications.coverLetterText`
- Loading state: spinner + disabled during regeneration

### 3.3 PDF Export

- Simple `@react-pdf/renderer` template: candidate header, date, company address, letter body, signature
- A4 format, 1 page max
- Generated client-side via `pdf()` → Blob → uploaded to API route
- Stored: `application-files/{userId}/{applicationId}/lettre.pdf`
- Path saved to `applications.coverLetterUrl`

## Sub-system 4: Email Preparation

AI generates a short professional email:
- **Subject**: e.g., "Candidature — Platrier qualifie — Jean Dupont"
- **Body**: 3-4 lines max, inverted pyramid (crucial info first), mentions position and company, refers to attached dossier

Stored in `applications.emailSubject` + `applications.emailBody`.

Displayed in the wizard with "Copier le sujet" + "Copier le texte" buttons. The user pastes into their own email client.

## Sub-system 5: References Page

Auto-generated from `candidate_references`:
- Title: "References professionnelles"
- Candidate name in header
- List of references: full name, position, company, phone, email, relationship
- Same visual style as the CV template
- Generated client-side via `pdf()` → Blob → uploaded to API route
- Stored: `application-files/{userId}/{applicationId}/references.pdf`
- Path saved to `applications.referencesPageUrl`

Only generated if the user has at least 1 reference. Otherwise the step is skipped.

## Sub-system 6: Dossier Assembly

### Mode A — Single PDF (strict order)

1. CV (2 pages)
2. Cover letter (1 page)
3. References page (if exists)
4. Recommendation letters / work certificates (`candidate_documents` category `recommendation` + `certificate`)
5. Diplomas (category `diploma`)
6. Permits — CACES, etc. (category `permit`)

Documents within each category follow `sortOrder` from Settings. Assembly uses `pdf-lib` (pure JS PDF manipulation — merge pages from multiple PDFs).

Final PDF stored: `application-files/{userId}/{applicationId}/dossier.pdf` → `applications.dossierUrl`

### Mode B — Separate Files

Each piece downloadable individually, packaged as ZIP:
- `CV_[Nom]_[Poste].pdf`
- `Lettre_[Nom]_[Entreprise].pdf`
- `References_[Nom].pdf`
- Individual documents with their original label names

ZIP generated server-side with `archiver`, streamed as download (not stored permanently). Set `maxDuration` on the download route for large dossiers.

## Sub-system 7: "Postuler" Wizard Button

### Entry Point

Replaces "Postuler sur JobUp" in `job-detail.tsx`.

**Condition**: Button only appears if `users.activeCvAnalysisId` is set. Otherwise shows: "Analysez d'abord votre CV" with link to CV analysis page.

If the user has an active CV, the button opens a full-screen Dialog with the wizard.

### Wizard Steps

**Step 1 — Verify Profile**
- Summary of available data: photo (yes/no), documents count by category, references count
- Link to Settings if anything is missing
- "Continuer" button (nothing is mandatory except the CV analysis)

**Step 2 — Swiss CV**
- AI generates CV data → section editor + live preview (split view)
- User edits sections, validates
- "Valider le CV" button → exports PDF
- Loading spinner during AI generation

**Step 3 — Cover Letter**
- AI generates letter → textarea editor
- User edits, optionally regenerates with instructions
- "Valider la lettre" button → exports PDF
- Loading spinner during AI generation

**Step 4 — Assemble Dossier**
- Choose mode: single PDF or separate files
- Preview of document order (checklist with checkboxes to include/exclude optional pieces)
- "Generer le dossier" button → assembly
- Loading spinner during assembly

**Step 5 — Ready to Apply**
- Email text prepared (copy buttons for subject + body)
- Download dossier button (PDF or ZIP)
- Link to original job posting (sourceUrl)
- "Marquer comme postule" button → sets `status: 'completed'`

Navigation: user can go back to any previous step. Each step auto-saves to `applications` table in `status: 'draft'`.

## API Routes Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/profile/photo` | POST | Upload CV photo |
| `/api/profile/photo` | DELETE | Delete CV photo |
| `/api/profile/documents` | GET | List documents |
| `/api/profile/documents` | POST | Upload document |
| `/api/profile/documents/[id]` | PATCH | Update label/category/sortOrder |
| `/api/profile/documents/[id]` | DELETE | Delete document |
| `/api/profile/documents/reorder` | PATCH | Bulk update sortOrder |
| `/api/applications` | GET | List user's applications (paginated, 20/page) |
| `/api/applications` | POST | Create new application (draft) |
| `/api/applications/[id]` | GET | Get application details |
| `/api/applications/[id]` | PATCH | Update application data |
| `/api/applications/[id]/generate-cv` | POST | Generate CV data via AI (returns JSON, no PDF) |
| `/api/applications/[id]/generate-letter` | POST | Generate cover letter text via AI (returns JSON) |
| `/api/applications/[id]/generate-email` | POST | Generate email text via AI (returns JSON) |
| `/api/applications/[id]/upload-pdf` | POST | Upload client-generated PDF blob (CV, letter, or references) to Storage |
| `/api/applications/[id]/assemble-dossier` | POST | Assemble final dossier (merge PDFs from Storage via pdf-lib) |
| `/api/applications/[id]/download` | GET | Download dossier (PDF or ZIP) |

References CRUD handled via Server Actions in `settings/actions.ts`.

## File Structure (new files)

```
lib/
  db/
    schema.ts                          (modified — add 3 tables + users.photoUrl + relations)
    kandid-queries.ts                  (modified — add queries for new tables)
  ai/
    prompts.ts                         (modified — add CV generation + letter + email prompts)
    generate-cv.ts                     (new — CV generation logic)
    generate-letter.ts                 (new — cover letter generation)
    generate-email.ts                  (new — email text generation)
  pdf/
    cv-template.tsx                    (new — @react-pdf/renderer CV template)
    letter-template.tsx                (new — @react-pdf/renderer letter template)
    references-template.tsx            (new — @react-pdf/renderer references template)
    render-pdf.ts                      (new — shared PDF rendering utility)
    assemble-dossier.ts                (new — pdf-lib merge logic)
  storage/
    cv-upload.ts                       (modified — add photo + document upload fns)

components/
  settings/
    photo-upload.tsx                   (new)
    documents-section.tsx              (new)
    references-section.tsx             (new)
  application/
    apply-wizard.tsx                   (new — main wizard Dialog)
    wizard-step-profile.tsx            (new)
    wizard-step-cv.tsx                 (new)
    cv-section-editor.tsx              (new — section-based CV editor)
    cv-preview.tsx                     (new — PDFViewer live preview, dynamic import ssr:false)
    wizard-step-letter.tsx             (new)
    letter-editor.tsx                  (new)
    wizard-step-assemble.tsx           (new)
    wizard-step-ready.tsx              (new)

app/
  (dashboard)/
    dashboard/
      settings/
        actions.ts                     (modified — add reference CRUD actions)
        page.tsx                       (modified — add photo, documents, references sections)
  api/
    profile/
      photo/route.ts                   (new)
      documents/route.ts               (new)
      documents/[id]/route.ts          (new)
      documents/reorder/route.ts       (new)
    applications/
      route.ts                         (new)
      [id]/route.ts                    (new)
      [id]/generate-cv/route.ts        (new — AI generates CV JSON data)
      [id]/generate-letter/route.ts    (new — AI generates letter JSON)
      [id]/generate-email/route.ts     (new — AI generates email text)
      [id]/upload-pdf/route.ts         (new — receives client-generated PDF blob, stores in Storage)
      [id]/assemble-dossier/route.ts   (new — merges PDFs from Storage via pdf-lib)
      [id]/download/route.ts           (new)

drizzle/
  XXXX_add_postuler_tables.sql         (new migration)
```

## Dependencies to Add

- `@react-pdf/renderer` — React components to PDF (pure JS, serverless-compatible)
- `pdf-lib` — pure JS PDF manipulation (merge, concatenate)
- `archiver` — ZIP generation for separate files mode
- `react-image-crop` — client-side image cropping for CV photo
