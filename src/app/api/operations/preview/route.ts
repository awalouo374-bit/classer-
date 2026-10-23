import { NextRequest, NextResponse } from "next/server";
import { validateLocalRequest } from "@/core/security/csrf-guard";
import { validateWorkspaceRoot } from "@/core/security/path-guard";
import { calculateConflicts } from "@/core/fs/executor";
import { FileOperationSchema } from "@/core/schemas/operation.schema";
import { z } from "zod";

const PreviewRequestSchema = z.object({
  operations: z.array(FileOperationSchema),
  workspacePath: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    await validateLocalRequest();
    const body = await req.json();
    const { operations, workspacePath } = PreviewRequestSchema.parse(body);

    const canonicalRoot = await validateWorkspaceRoot(workspacePath);
    const evaluated = await calculateConflicts(operations, canonicalRoot);

    return NextResponse.json({
      success: true,
      data: {
        operations: evaluated,
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
