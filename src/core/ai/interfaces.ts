import { FileItem, OperationPlan } from "@/types";

export interface AIWorkspaceContext {
  workspaceRoot: string;
  files: FileItem[];
  commonSubdirectories: string[];
}

export interface IAIProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  generatePlan(context: AIWorkspaceContext, userPrompt: string): Promise<OperationPlan | null>;
  generateChatReply(context: AIWorkspaceContext, userPrompt: string): Promise<string>;
}
