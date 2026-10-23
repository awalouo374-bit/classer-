import { NextRequest, NextResponse } from "next/server";
import { validateLocalRequest } from "@/core/security/csrf-guard";
import { validateWorkspaceRoot } from "@/core/security/path-guard";
import { executePlan } from "@/core/fs/executor";
import { OperationPlanSchema } from "@/core/schemas/operation.schema";
import { z } from "zod";

const ExecuteRequestSchema = z.object({
  plan: OperationPlanSchema,
  workspacePath: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    // Require session token to prevent unauthorized triggers
    await validateLocalRequest({ requireToken: true });

    const body = await req.json();
    const { plan, workspacePath } = ExecuteRequestSchema.parse(body);

    if (workspacePath.includes("Démo") || process.env.VERCEL) {
      const selectedOps = plan.operations.filter((o) => o.selected);
      return NextResponse.json({
        success: true,
        data: {
          sessionId: `demo-${Date.now()}`,
          totalPlanned: selectedOps.length,
          successCount: selectedOps.length,
          failedCount: 0,
          executedOperations: selectedOps.map((o) => ({
            source: o.source,
            destination: o.destination,
            success: true,
          })),
        },
      });
    }

    const canonicalRoot = await validateWorkspaceRoot(workspacePath);
    const result = await executePlan(plan, canonicalRoot);

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
