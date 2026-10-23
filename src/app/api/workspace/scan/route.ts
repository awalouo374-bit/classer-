import { NextRequest, NextResponse } from "next/server";
import { scanWorkspace } from "@/core/fs/scanner";
import { validateLocalRequest, getActiveSessionToken } from "@/core/security/csrf-guard";
import { getDefaultDesktopPath, validateWorkspaceRoot } from "@/core/security/path-guard";
import { generateDemoWorkspace } from "@/core/fs/demo-data";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function findAvailableDesktopPath(): Promise<string> {
  const home = os.homedir();
  const candidates = [
    path.join(home, "OneDrive", "Bureau"),
    path.join(home, "OneDrive", "Desktop"),
    path.join(home, "Bureau"),
    path.join(home, "Desktop"),
  ];

  for (const candidate of candidates) {
    try {
      const stats = await fs.stat(candidate);
      if (stats.isDirectory()) {
        return candidate;
      }
    } catch {
      continue;
    }
  }

  return getDefaultDesktopPath();
}

export async function GET(req: NextRequest) {
  try {
    await validateLocalRequest();

    const searchParams = req.nextUrl.searchParams;
    let targetPath = searchParams.get("path");

    // If on Vercel or cloud or requested demo path
    if (process.env.VERCEL || targetPath?.includes("Démo")) {
      const demo = generateDemoWorkspace();
      return NextResponse.json({
        success: true,
        data: {
          ...demo,
          sessionToken: getActiveSessionToken(),
        },
      });
    }

    if (!targetPath) {
      try {
        targetPath = await findAvailableDesktopPath();
      } catch {
        const demo = generateDemoWorkspace();
        return NextResponse.json({
          success: true,
          data: {
            ...demo,
            sessionToken: getActiveSessionToken(),
          },
        });
      }
    }

    try {
      const validated = await validateWorkspaceRoot(targetPath);
      const result = await scanWorkspace(validated);

      return NextResponse.json({
        success: true,
        data: {
          ...result,
          sessionToken: getActiveSessionToken(),
        },
      });
    } catch {
      // Fallback for demo when path does not exist on host (e.g. Vercel)
      const demo = generateDemoWorkspace();
      return NextResponse.json({
        success: true,
        data: {
          ...demo,
          sessionToken: getActiveSessionToken(),
        },
      });
    }
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
