import { NextRequest, NextResponse } from "next/server";
import { validateLocalRequest } from "@/core/security/csrf-guard";
import { validateWorkspaceRoot } from "@/core/security/path-guard";
import { scanWorkspace } from "@/core/fs/scanner";
import { getAIProvider, SupportedProviderType } from "@/core/ai/provider-factory";
import { calculateConflicts } from "@/core/fs/executor";
import { generateDemoWorkspace } from "@/core/fs/demo-data";
import { z } from "zod";

const ChatRequestSchema = z.object({
  prompt: z.string().min(1),
  workspacePath: z.string().min(1),
  provider: z.enum(["rule-engine", "ollama", "openai", "groq", "openrouter", "auto"]).default("auto"),
  apiKey: z.string().optional(),
  model: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await validateLocalRequest();
    const body = await req.json();
    const { prompt, workspacePath, provider, apiKey, model } = ChatRequestSchema.parse(body);

    let canonicalRoot = workspacePath;
    let scanData;

    if (workspacePath.includes("Démo") || process.env.VERCEL) {
      scanData = generateDemoWorkspace();
      canonicalRoot = scanData.workspace.canonicalPath;
    } else {
      canonicalRoot = await validateWorkspaceRoot(workspacePath);
      scanData = await scanWorkspace(canonicalRoot);
    }

    const ai = getAIProvider({
      type: provider as SupportedProviderType,
      apiKey,
      model,
    });

    const context = {
      workspaceRoot: canonicalRoot,
      files: scanData.files,
      commonSubdirectories: scanData.commonSubdirectories,
    };

    const reply = await ai.generateChatReply(context, prompt);
    const rawPlan = await ai.generatePlan(context, prompt);

    let planWithConflicts = null;

    if (rawPlan && rawPlan.operations && rawPlan.operations.length > 0) {
      // Run conflict evaluation on the proposed plan
      const evaluatedOperations = await calculateConflicts(rawPlan.operations, canonicalRoot);

      planWithConflicts = {
        ...rawPlan,
        operations: evaluatedOperations,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        reply,
        plan: planWithConflicts,
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
