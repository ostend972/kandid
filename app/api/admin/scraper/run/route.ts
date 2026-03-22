import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { spawn } from 'child_process';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max for scraper

export async function GET() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const scraperDir = path.resolve(process.cwd(), '..', 'kandid-scraper');

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (type: string, data: string) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`)
          );
        } catch {
          // controller already closed
        }
      };

      sendEvent('log', `Demarrage du scraper depuis ${scraperDir}...`);

      const child = spawn('npx', ['tsx', 'cron.ts'], {
        cwd: scraperDir,
        shell: true,
        env: { ...process.env },
      });

      child.stdout.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          sendEvent('log', line);
        }
      });

      child.stderr.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          sendEvent('error', line);
        }
      });

      child.on('close', (code) => {
        sendEvent('done', `Scraper termine avec le code ${code}`);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });

      child.on('error', (err) => {
        sendEvent('error', `Erreur: ${err.message}`);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
