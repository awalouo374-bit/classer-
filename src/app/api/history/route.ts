import { NextRequest, NextResponse } from "next/server";
import { validateLocalRequest } from "@/core/security/csrf-guard";
import { validateWorkspaceRoot } from "@/core/security/path-guard";
import { getHistory } from "@/core/ledger/history-store";

export async function GET(req: NextRequest) {
  try {
    await validateLocalRequest();

    const searchParams = req.nextUrl.searchParams;
    const workspacePath = searchParams.get("path");

    if (!workspacePath) {
      return NextResponse.json(
        { success: false, error: "Chemin du workspace manquant" },
        { status: 400 }
      );
    }

    if (workspacePath.includes("Démo") || process.env.VERCEL) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const canonicalRoot = await validateWorkspaceRoot(workspacePath);
    const history = await getHistory(canonicalRoot);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
