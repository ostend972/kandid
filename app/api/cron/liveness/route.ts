import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 600;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }

  const providedSecret = authHeader?.replace("Bearer ", "");
  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scraperDir = path.resolve(process.cwd(), "kandid-scraper");

  return new Promise<NextResponse>((resolve) => {
    const stdout: string[] = [];
    const stderr: string[] = [];

    const child = spawn("npx", ["tsx", "batch-liveness.ts"], {
      cwd: scraperDir,
      shell: true,
      env: { ...process.env },
    });

    child.stdout.on("data", (chunk: Buffer) => {
      stdout.push(chunk.toString());
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr.push(chunk.toString());
    });

    child.on("close", (code) => {
      const output = stdout.join("");

      const countMatch = output.match(
        /active=(\d+)\s+expired=(\d+)\s+uncertain=(\d+)\s+errors=(\d+)\s+duration=([\d.]+)s/,
      );

      const summary = countMatch
        ? {
            active: parseInt(countMatch[1]),
            expired: parseInt(countMatch[2]),
            uncertain: parseInt(countMatch[3]),
            errors: parseInt(countMatch[4]),
            duration: `${countMatch[5]}s`,
          }
        : { raw: output.slice(-500) };

      resolve(
        NextResponse.json(
          {
            success: code === 0,
            exitCode: code,
            summary,
            stderr: stderr.join("").slice(-500) || undefined,
          },
          { status: code === 0 ? 200 : 500 },
        ),
      );
    });

    child.on("error", (err) => {
      console.error("[cron/liveness] Process spawn error:", err);
      resolve(
        NextResponse.json(
          { error: "Failed to spawn batch process" },
          { status: 500 },
        ),
      );
    });
  });
}
