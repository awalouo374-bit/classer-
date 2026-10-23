import { NextRequest, NextResponse } from "next/server";
import { validateLocalRequest } from "@/core/security/csrf-guard";
import { validateWorkspaceRoot } from "@/core/security/path-guard";
import { performRollback } from "@/core/ledger/history-store";
import { z } from "zod";

const RollbackRequestSchema = z.object({
  sessionId: z.string().min(1),
  workspacePath: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    await validateLocalRequest({ requireToken: true });

    const body = await req.json();
    const { sessionId, workspacePath } = RollbackRequestSchema.parse(body);

    if (workspacePath.includes("Démo") || process.env.VERCEL) {
      return NextResponse.json({
        success: true,
        data: {
          restoredCount: 5,
          errors: [],
        },
      });
    }

    const canonicalRoot = await validateWorkspaceRoot(workspacePath);
    const result = await performRollback(sessionId, canonicalRoot);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
