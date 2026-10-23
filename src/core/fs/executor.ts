import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { FileOperation, OperationPlan, RollbackSession } from "@/types";
import { ensurePathWithinWorkspace, validateWorkspaceRoot } from "../security/path-guard";
import { recordSession } from "../ledger/history-store";

/**
 * Generates an alternative non-destructive filename if destination already exists.
 * e.g., "rapport.docx" -> "rapport (1).docx"
 */
async function findNonCollidingPath(targetPath: string): Promise<string> {
  try {
    await fs.access(targetPath);
  } catch {
    // Doesn't exist, safe to use
    return targetPath;
  }

  const dir = path.dirname(targetPath);
  const ext = path.extname(targetPath);
  const basename = path.basename(targetPath, ext);

  let counter = 1;
  while (counter < 1000) {
    const candidateName = `${basename} (${counter})${ext}`;
    const candidatePath = path.join(dir, candidateName);
    try {
      await fs.access(candidatePath);
      counter++;
    } catch {
      return candidatePath;
    }
  }
  return path.join(dir, `${basename}_${Date.now()}${ext}`);
}

/**
 * Checks plan operations for conflicts, non-existent sources, and duplicate targets.
 */
export async function calculateConflicts(
  operations: FileOperation[],
  workspaceRoot: string
): Promise<FileOperation[]> {
  const canonicalRoot = await validateWorkspaceRoot(workspaceRoot);
  const evaluatedOps: FileOperation[] = [];
  const claimedDestinations = new Set<string>();

  for (const op of operations) {
    const checkedOp: FileOperation = { ...op };

    try {
      const canonicalSource = await ensurePathWithinWorkspace(op.source, canonicalRoot);
      const canonicalDest = await ensurePathWithinWorkspace(op.destination, canonicalRoot);

      checkedOp.source = canonicalSource;
      checkedOp.destination = canonicalDest;

      // Check source existence (for MOVE/RENAME)
      if (op.type === "MOVE" || op.type === "RENAME") {
        try {
          await fs.access(canonicalSource);
        } catch {
          checkedOp.status = "CONFLICT";
          checkedOp.conflictReason = "Le fichier source n'existe pas ou est inaccessible.";
          checkedOp.selected = false;
          evaluatedOps.push(checkedOp);
          continue;
        }
      }

      // Check destination collision
      const normDest = canonicalDest.toLowerCase();
      let existsOnDisk = false;
      try {
        await fs.access(canonicalDest);
        existsOnDisk = true;
      } catch {
        existsOnDisk = false;
      }

      if (existsOnDisk || claimedDestinations.has(normDest)) {
        const safeAlternative = await findNonCollidingPath(canonicalDest);
        checkedOp.status = "CONFLICT";
        checkedOp.conflictReason = `Collision : un élément existe déjà au nom '${path.basename(canonicalDest)}'. L'exécution utilisera '${path.basename(safeAlternative)}' pour préserver vos données.`;
      } else {
        checkedOp.status = "VALIDATED";
        claimedDestinations.add(normDest);
      }
    } catch (err: unknown) {
      const error = err as Error;
      checkedOp.status = "CONFLICT";
      checkedOp.conflictReason = `Sécurité : ${error.message}`;
      checkedOp.selected = false;
    }

    evaluatedOps.push(checkedOp);
  }

  return evaluatedOps;
}

export interface ExecutionResult {
  sessionId: string;
  totalPlanned: number;
  successCount: number;
  failedCount: number;
  executedOperations: {
    source: string;
    destination: string;
    success: boolean;
    error?: string;
  }[];
}

/**
 * Executes confirmed operations safely.
 * Never overwrites or deletes files without explicit backup.
 */
export async function executePlan(
  plan: OperationPlan,
  workspaceRoot: string
): Promise<ExecutionResult> {
  const canonicalRoot = await validateWorkspaceRoot(workspaceRoot);
  const sessionId = crypto.randomUUID();

  const executedForSession: RollbackSession["operations"] = [];
  const resultOperations: ExecutionResult["executedOperations"] = [];
  let successCount = 0;
  let failedCount = 0;

  for (const op of plan.operations) {
    if (!op.selected) {
      continue;
    }

    try {
      const canonicalSource = await ensurePathWithinWorkspace(op.source, canonicalRoot);
      const targetDest = await ensurePathWithinWorkspace(op.destination, canonicalRoot);

      if (op.type === "CREATE_DIR") {
        await fs.mkdir(targetDest, { recursive: true });
        successCount++;
        resultOperations.push({
          source: canonicalSource,
          destination: targetDest,
          success: true,
        });
        executedForSession.push({
          originalSource: canonicalSource,
          executedDestination: targetDest,
          type: "CREATE_DIR",
          success: true,
        });
      } else if (op.type === "MOVE" || op.type === "RENAME") {
        // Ensure destination parent directory exists
        const destDir = path.dirname(targetDest);
        await fs.mkdir(destDir, { recursive: true });

        // Double check destination existence and get safe non-colliding path
        const safeDestination = await findNonCollidingPath(targetDest);

        // Perform move/rename
        await fs.rename(canonicalSource, safeDestination);

        successCount++;
        resultOperations.push({
          source: canonicalSource,
          destination: safeDestination,
          success: true,
        });
        executedForSession.push({
          originalSource: canonicalSource,
          executedDestination: safeDestination,
          type: op.type,
          success: true,
        });
      }
    } catch (err: unknown) {
      const error = err as Error;
      failedCount++;
      resultOperations.push({
        source: op.source,
        destination: op.destination,
        success: false,
        error: error.message,
      });
      executedForSession.push({
        originalSource: op.source,
        executedDestination: op.destination,
        type: op.type,
        success: false,
      });
    }
  }

  // Record session to ledger for rollback
  if (successCount > 0) {
    const session: RollbackSession = {
      id: sessionId,
      timestamp: new Date().toISOString(),
      workspaceRoot: canonicalRoot,
      title: plan.title || `Organisation du ${new Date().toLocaleDateString("fr-FR")}`,
      operations: executedForSession,
    };
    await recordSession(session);
  }

  return {
    sessionId,
    totalPlanned: plan.operations.filter((o) => o.selected).length,
    successCount,
    failedCount,
    executedOperations: resultOperations,
  };
}
