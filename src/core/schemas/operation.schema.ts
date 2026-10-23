import { z } from "zod";

export const FileCategoryEnum = z.enum([
  "DOCUMENTS",
  "EXCEL",
  "PDF",
  "DEVELOPPEMENT",
  "IMAGES",
  "ARCHIVES",
  "RACCOURCIS",
  "EXECUTABLES",
  "AUTRE",
]);

export type FileCategory = z.infer<typeof FileCategoryEnum>;

export const FileItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  relativePath: z.string(),
  extension: z.string(),
  size: z.number(),
  modifiedAt: z.string(),
  createdAt: z.string(),
  isDirectory: z.boolean(),
  category: FileCategoryEnum,
  isHidden: z.boolean(),
});

export type FileItem = z.infer<typeof FileItemSchema>;

export const OperationTypeEnum = z.enum(["MOVE", "CREATE_DIR", "RENAME"]);
export type OperationType = z.infer<typeof OperationTypeEnum>;

export const OperationStatusEnum = z.enum([
  "PENDING",
  "VALIDATED",
  "CONFLICT",
  "SUCCESS",
  "FAILED",
  "SKIPPED",
]);
export type OperationStatus = z.infer<typeof OperationStatusEnum>;

export const FileOperationSchema = z.object({
  id: z.string(),
  type: OperationTypeEnum,
  source: z.string(),
  destination: z.string(),
  reason: z.string(),
  status: OperationStatusEnum.default("PENDING"),
  conflictReason: z.string().optional(),
  selected: z.boolean().default(true),
});

export type FileOperation = z.infer<typeof FileOperationSchema>;

export const OperationPlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  operations: z.array(FileOperationSchema),
  createdAt: z.string(),
});

export type OperationPlan = z.infer<typeof OperationPlanSchema>;

export const WorkspaceInfoSchema = z.object({
  rootPath: z.string(),
  canonicalPath: z.string(),
  totalFiles: z.number(),
  totalSize: z.number(),
  categoriesCount: z.record(FileCategoryEnum, z.number()),
  scannedAt: z.string(),
});

export type WorkspaceInfo = z.infer<typeof WorkspaceInfoSchema>;

export const RollbackSessionSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  workspaceRoot: z.string(),
  title: z.string(),
  operations: z.array(
    z.object({
      originalSource: z.string(),
      executedDestination: z.string(),
      type: OperationTypeEnum,
      success: z.boolean(),
    })
  ),
});

export type RollbackSession = z.infer<typeof RollbackSessionSchema>;
