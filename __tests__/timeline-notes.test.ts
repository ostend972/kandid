import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('timeline & notes features (R018)', () => {
  it('updateApplicationNotes function exists in kandid-queries', () => {
    const filePath = path.resolve(
      __dirname,
      '../lib/db/kandid-queries.ts'
    );
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('export async function updateApplicationNotes');
  });

  it('getApplicationTransitions function exists in kandid-queries', () => {
    const filePath = path.resolve(
      __dirname,
      '../lib/db/kandid-queries.ts'
    );
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('export async function getApplicationTransitions');
  });

  it('PATCH allowedFields includes notes', () => {
    const routePath = path.resolve(
      __dirname,
      '../app/api/applications/[id]/route.ts'
    );
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('"notes"');
  });

  it('timeline component file exists', () => {
    const filePath = path.resolve(
      __dirname,
      '../components/applications/timeline.tsx'
    );
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('notes-editor component file exists', () => {
    const filePath = path.resolve(
      __dirname,
      '../components/applications/notes-editor.tsx'
    );
    expect(fs.existsSync(filePath)).toBe(true);
  });
});
