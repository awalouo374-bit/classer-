import path from "node:path";
import { FileCategory } from "@/core/schemas/operation.schema";

const EXTENSION_CATEGORY_MAP: Record<string, FileCategory> = {
  // PDF
  ".pdf": "PDF",

  // Excel & Tableurs
  ".xls": "EXCEL",
  ".xlsx": "EXCEL",
  ".xlsm": "EXCEL",
  ".csv": "EXCEL",
  ".tsv": "EXCEL",
  ".ods": "EXCEL",

  // Documents
  ".doc": "DOCUMENTS",
  ".docx": "DOCUMENTS",
  ".odt": "DOCUMENTS",
  ".rtf": "DOCUMENTS",
  ".txt": "DOCUMENTS",
  ".md": "DOCUMENTS",
  ".pptx": "DOCUMENTS",
  ".ppt": "DOCUMENTS",
  ".odp": "DOCUMENTS",
  ".pages": "DOCUMENTS",

  // Développement
  ".js": "DEVELOPPEMENT",
  ".ts": "DEVELOPPEMENT",
  ".tsx": "DEVELOPPEMENT",
  ".jsx": "DEVELOPPEMENT",
  ".py": "DEVELOPPEMENT",
  ".json": "DEVELOPPEMENT",
  ".html": "DEVELOPPEMENT",
  ".css": "DEVELOPPEMENT",
  ".scss": "DEVELOPPEMENT",
  ".rs": "DEVELOPPEMENT",
  ".go": "DEVELOPPEMENT",
  ".java": "DEVELOPPEMENT",
  ".cpp": "DEVELOPPEMENT",
  ".c": "DEVELOPPEMENT",
  ".h": "DEVELOPPEMENT",
  ".cs": "DEVELOPPEMENT",
  ".sql": "DEVELOPPEMENT",
  ".sh": "DEVELOPPEMENT",
  ".ps1": "DEVELOPPEMENT",
  ".bat": "DEVELOPPEMENT",
  ".cmd": "DEVELOPPEMENT",
  ".env": "DEVELOPPEMENT",
  ".yaml": "DEVELOPPEMENT",
  ".yml": "DEVELOPPEMENT",
  ".xml": "DEVELOPPEMENT",

  // Images
  ".png": "IMAGES",
  ".jpg": "IMAGES",
  ".jpeg": "IMAGES",
  ".gif": "IMAGES",
  ".webp": "IMAGES",
  ".svg": "IMAGES",
  ".bmp": "IMAGES",
  ".ico": "IMAGES",
  ".tiff": "IMAGES",
  ".psd": "IMAGES",
  ".ai": "IMAGES",

  // Archives
  ".zip": "ARCHIVES",
  ".rar": "ARCHIVES",
  ".7z": "ARCHIVES",
  ".tar": "ARCHIVES",
  ".gz": "ARCHIVES",
  ".bz2": "ARCHIVES",
  ".xz": "ARCHIVES",
  ".iso": "ARCHIVES",

  // Raccourcis
  ".lnk": "RACCOURCIS",
  ".url": "RACCOURCIS",

  // Exécutables
  ".exe": "EXECUTABLES",
  ".msi": "EXECUTABLES",
};

export const CATEGORY_LABELS: Record<FileCategory, string> = {
  DOCUMENTS: "Documents",
  EXCEL: "Tableurs & Excel",
  PDF: "Documents PDF",
  DEVELOPPEMENT: "Développement & Code",
  IMAGES: "Images & Visuels",
  ARCHIVES: "Archives & Compressés",
  RACCOURCIS: "Raccourcis",
  EXECUTABLES: "Applications & Installateurs",
  AUTRE: "Autres fichiers",
};

export const CATEGORY_RECOMMENDED_FOLDERS: Record<FileCategory, string> = {
  DOCUMENTS: "Documents",
  EXCEL: "Excel & Tableurs",
  PDF: "Fichiers PDF",
  DEVELOPPEMENT: "Projets & Code",
  IMAGES: "Images & Photos",
  ARCHIVES: "Archives & Zip",
  RACCOURCIS: "Raccourcis Bureau",
  EXECUTABLES: "Installateurs & Applis",
  AUTRE: "Divers",
};

export function detectFileCategory(filename: string): FileCategory {
  const ext = path.extname(filename).toLowerCase();
  if (!ext) {
    return "AUTRE";
  }
  return EXTENSION_CATEGORY_MAP[ext] || "AUTRE";
}
