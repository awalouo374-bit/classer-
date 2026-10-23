import { NextRequest, NextResponse } from "next/server";
import { validateLocalRequest } from "@/core/security/csrf-guard";
import { validateWorkspaceRoot } from "@/core/security/path-guard";
import { z } from "zod";

const SetRootSchema = z.object({
  path: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    await validateLocalRequest();
    const body = await req.json();
    const { path: rawPath } = SetRootSchema.parse(body);

    if (rawPath.includes("Démo") || process.env.VERCEL) {
      return NextResponse.json({
        success: true,
        data: {
          canonicalPath: rawPath,
        },
      });
    }

    const canonical = await validateWorkspaceRoot(rawPath);

    return NextResponse.json({
      success: true,
      data: {
        canonicalPath: canonical,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
