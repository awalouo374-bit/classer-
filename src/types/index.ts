export * from "@/core/schemas/operation.schema";

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
  suggestedPlan?: import("@/core/schemas/operation.schema").OperationPlan;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  warning?: string;
}

export interface ScanResult {
  workspace: import("@/core/schemas/operation.schema").WorkspaceInfo;
  files: import("@/core/schemas/operation.schema").FileItem[];
  commonSubdirectories: string[];
}
