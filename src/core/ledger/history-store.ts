import fs from "node:fs/promises";
import path from "node:path";
import { RollbackSession } from "@/types";
import { ensurePathWithinWorkspace, validateWorkspaceRoot } from "../security/path-guard";

const LEDGER_DIR = ".deskmind";
const LEDGER_FILE = "ledger.json";

async function getLedgerPath(workspaceRoot: string): Promise<string> {
  const canonicalRoot = await validateWorkspaceRoot(workspaceRoot);
  const dirPath = path.join(canonicalRoot, LEDGER_DIR);
  await fs.mkdir(dirPath, { recursive: true });
  return path.join(dirPath, LEDGER_FILE);
}

export async function getHistory(workspaceRoot: string): Promise<RollbackSession[]> {
  try {
    const ledgerFile = await getLedgerPath(workspaceRoot);
    const content = await fs.readFile(ledgerFile, "utf-8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function recordSession(session: RollbackSession): Promise<void> {
  const ledgerFile = await getLedgerPath(session.workspaceRoot);
  const history = await getHistory(session.workspaceRoot);
  history.unshift(session); // Add newest first
  await fs.writeFile(ledgerFile, JSON.stringify(history, null, 2), "utf-8");
}

export async function performRollback(
  sessionId: string,
  workspaceRoot: string
): Promise<{ restoredCount: number; errors: string[] }> {
  const canonicalRoot = await validateWorkspaceRoot(workspaceRoot);
  const history = await getHistory(canonicalRoot);
  const session = history.find((s) => s.id === sessionId);

  if (!session) {
    throw new Error(`Session d'historique introuvable : ${sessionId}`);
  }

  let restoredCount = 0;
  const errors: string[] = [];

  // Reverse operations in opposite order
  const ops = [...session.operations].reverse();

  for (const op of ops) {
    if (!op.success) continue;

    try {
      const currentLoc = await ensurePathWithinWorkspace(op.executedDestination, canonicalRoot);
      const originalLoc = await ensurePathWithinWorkspace(op.originalSource, canonicalRoot);

      // Check current file existence
      try {
        await fs.access(currentLoc);
      } catch {
        errors.push(`Fichier introuvable pour restauration : ${op.executedDestination}`);
        continue;
      }

      // Ensure target parent directory exists
      await fs.mkdir(path.dirname(originalLoc), { recursive: true });

      // Move back
      await fs.rename(currentLoc, originalLoc);
      restoredCount++;
    } catch (err: unknown) {
      const error = err as Error;
      errors.push(`Erreur lors de la restauration de ${op.executedDestination} : ${error.message}`);
    }
  }

  // Update session in history marking it as rolled back
  session.title = `[ANNULÉ] ${session.title}`;
  const ledgerFile = await getLedgerPath(canonicalRoot);
  await fs.writeFile(ledgerFile, JSON.stringify(history, null, 2), "utf-8");

  return { restoredCount, errors };
}
