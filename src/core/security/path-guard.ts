import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

// Disallowed Windows protected and system directories
const FORBIDDEN_WINDOWS_PATHS = [
  /^[a-zA-Z]:\\?$/i, // Root drives like C:\ or D:\
  /^[a-zA-Z]:\\Windows(\\.*)?$/i,
  /^[a-zA-Z]:\\Program Files(\\.*)?$/i,
  /^[a-zA-Z]:\\Program Files \(x86\)(\\.*)?$/i,
  /^[a-zA-Z]:\\ProgramData(\\.*)?$/i,
  /^[a-zA-Z]:\\System Volume Information(\\.*)?$/i,
  /^[a-zA-Z]:\\\$Recycle\.Bin(\\.*)?$/i,
  /^[a-zA-Z]:\\Recovery(\\.*)?$/i,
];

// Reserved Windows filenames (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
const RESERVED_DEVICE_NAMES = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$/i;

export class PathSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PathSecurityError";
  }
}

/**
 * Normalizes a path for consistent Windows comparisons.
 * Converts slashes to lowercase drive letter and standardized backslashes.
 */
export function normalizeWindowsPath(rawPath: string): string {
  const resolved = path.resolve(rawPath);
  // Match drive letter and normalize to lowercase e.g., c:\
  return resolved.replace(/^([a-zA-Z]):/, (_, letter) => `${letter.toLowerCase()}:`);
}

/**
 * Validates whether a proposed workspace root is acceptable.
 * Must exist, be a directory, and not be a forbidden system directory.
 */
export async function validateWorkspaceRoot(workspacePath: string): Promise<string> {
  if (!workspacePath || typeof workspacePath !== "string") {
    throw new PathSecurityError("Le chemin du dossier de travail est invalide ou manquant.");
  }

  // Check for null bytes
  if (workspacePath.includes("\0")) {
    throw new PathSecurityError("Caractère nul détecté dans le chemin.");
  }

  const normalized = normalizeWindowsPath(workspacePath);

  // Check forbidden system directories
  for (const pattern of FORBIDDEN_WINDOWS_PATHS) {
    if (pattern.test(normalized)) {
      throw new PathSecurityError(
        `Accès refusé : Le dossier '${normalized}' est un dossier système protégé de Windows.`
      );
    }
  }

  // Verify existence and that it's a directory
  try {
    const stats = await fs.stat(normalized);
    if (!stats.isDirectory()) {
      throw new PathSecurityError(`Le chemin spécifié n'est pas un répertoire : ${normalized}`);
    }
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === "ENOENT") {
      throw new PathSecurityError(`Le dossier spécifié n'existe pas : ${normalized}`);
    }
    throw new PathSecurityError(`Impossible d'accéder au dossier : ${error.message}`);
  }

  // Resolve symlinks/junctions to canonical physical path
  try {
    const canonical = await fs.realpath(normalized);
    const normalizedCanonical = normalizeWindowsPath(canonical);

    for (const pattern of FORBIDDEN_WINDOWS_PATHS) {
      if (pattern.test(normalizedCanonical)) {
        throw new PathSecurityError(
          `Accès refusé : Le lien ou la jonction pointe vers un dossier système Windows (${normalizedCanonical}).`
        );
      }
    }

    return normalizedCanonical;
  } catch {
    return normalized;
  }
}

/**
 * Validates that an operation's target or source path is strictly within the allowed workspace root.
 * Prevents traversal (..) and symlink breakout.
 */
export async function ensurePathWithinWorkspace(
  filePath: string,
  allowedWorkspaceRoot: string
): Promise<string> {
  if (!filePath || typeof filePath !== "string") {
    throw new PathSecurityError("Chemin invalide.");
  }

  if (filePath.includes("\0")) {
    throw new PathSecurityError("Caractère nul détecté dans le chemin de fichier.");
  }

  const normalizedRoot = normalizeWindowsPath(allowedWorkspaceRoot);
  const normalizedTarget = normalizeWindowsPath(
    path.isAbsolute(filePath) ? filePath : path.join(allowedWorkspaceRoot, filePath)
  );

  // Check reserved DOS names
  const basename = path.basename(normalizedTarget);
  if (RESERVED_DEVICE_NAMES.test(basename)) {
    throw new PathSecurityError(`Le nom de fichier '${basename}' est un nom de périphérique réservé par Windows.`);
  }

  // Boundary check: normalizedTarget must strictly start with normalizedRoot
  const isInside =
    normalizedTarget === normalizedRoot ||
    normalizedTarget.startsWith(normalizedRoot + path.sep);

  if (!isInside) {
    throw new PathSecurityError(
      `Violation de périmètre : Le chemin '${normalizedTarget}' est en dehors du dossier autorisé '${normalizedRoot}'.`
    );
  }

  // Verify real physical path if the target exists
  try {
    const realTarget = await fs.realpath(normalizedTarget);
    const normalizedRealTarget = normalizeWindowsPath(realTarget);

    const isRealInside =
      normalizedRealTarget === normalizedRoot ||
      normalizedRealTarget.startsWith(normalizedRoot + path.sep);

    if (!isRealInside) {
      throw new PathSecurityError(
        `Violation de périmètre : Le lien symbolique pointe hors de l'espace de travail autorisé.`
      );
    }
    return normalizedRealTarget;
  } catch {
    // If target doesn't exist yet (e.g. creating a new directory or destination of a move)
    return normalizedTarget;
  }
}

/**
 * Returns default safe workspace path (Windows Desktop or current user home)
 */
export function getDefaultDesktopPath(): string {
  const home = os.homedir();
  const desktop = path.join(home, "Desktop");
  // Check OneDrive Desktop if exists
  const onedriveDesktop = path.join(home, "OneDrive", "Bureau");
  const onedriveEnglishDesktop = path.join(home, "OneDrive", "Desktop");
  const frenchDesktop = path.join(home, "Bureau");

  return desktop;
}
