import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import {
  FileCategory,
  FileCategoryEnum,
  FileItem,
  ScanResult,
  WorkspaceInfo,
} from "@/types";
import { detectFileCategory } from "./categories";
import { validateWorkspaceRoot } from "../security/path-guard";

export async function scanWorkspace(workspacePath: string): Promise<ScanResult> {
  const canonicalRoot = await validateWorkspaceRoot(workspacePath);

  const entries = await fs.readdir(canonicalRoot, { withFileTypes: true });

  const files: FileItem[] = [];
  const commonSubdirectories: string[] = [];
  let totalSize = 0;

  const categoriesCount: Record<FileCategory, number> = {
    DOCUMENTS: 0,
    EXCEL: 0,
    PDF: 0,
    DEVELOPPEMENT: 0,
    IMAGES: 0,
    ARCHIVES: 0,
    RACCOURCIS: 0,
    EXECUTABLES: 0,
    AUTRE: 0,
  };

  for (const entry of entries) {
    const fullPath = path.join(canonicalRoot, entry.name);
    const isHidden = entry.name.startsWith(".") || entry.name.startsWith("~$");

    // Skip internal DeskMind metadata folder and desktop.ini if hidden
    if (entry.name === ".deskmind" || entry.name === "desktop.ini") {
      continue;
    }

    try {
      const stats = await fs.stat(fullPath);
      const isDir = entry.isDirectory();

      if (isDir) {
        commonSubdirectories.push(entry.name);
        continue;
      }

      const category = detectFileCategory(entry.name);
      categoriesCount[category] = (categoriesCount[category] || 0) + 1;
      totalSize += stats.size;

      const ext = path.extname(entry.name).toLowerCase();

      files.push({
        id: crypto.createHash("md5").update(fullPath).digest("hex"),
        name: entry.name,
        path: fullPath,
        relativePath: entry.name,
        extension: ext,
        size: stats.size,
        modifiedAt: stats.mtime.toISOString(),
        createdAt: stats.birthtime.toISOString(),
        isDirectory: false,
        category,
        isHidden,
      });
    } catch {
      // If a file is locked or access is temporarily unavailable, skip silently
      continue;
    }
  }

  // Sort files by modified date descending
  files.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

  const workspaceInfo: WorkspaceInfo = {
    rootPath: workspacePath,
    canonicalPath: canonicalRoot,
    totalFiles: files.length,
    totalSize,
    categoriesCount,
    scannedAt: new Date().toISOString(),
  };

  return {
    workspace: workspaceInfo,
    files,
    commonSubdirectories,
  };
}
