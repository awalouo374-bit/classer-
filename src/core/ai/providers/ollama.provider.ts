import { AIWorkspaceContext, IAIProvider } from "../interfaces";
import { OperationPlan, OperationPlanSchema } from "@/types";
import { RuleEngineProvider } from "./rule-engine.provider";

export class OllamaProvider implements IAIProvider {
  name = "Ollama Local LLM";
  private baseUrl: string;
  private model: string;
  private fallbackEngine: RuleEngineProvider;

  constructor(baseUrl = "http://127.0.0.1:11434", model = "llama3:latest") {
    this.baseUrl = baseUrl;
    this.model = model;
    this.fallbackEngine = new RuleEngineProvider();
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(1000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async generateChatReply(context: AIWorkspaceContext, userPrompt: string): Promise<string> {
    const isAvail = await this.isAvailable();
    if (!isAvail) {
      return this.fallbackEngine.generateChatReply(context, userPrompt);
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          prompt: `Tu es DeskMind AI, assistant local d'organisation de bureau Windows. Réponds en français de façon naturelle, précise, bienveillante et pertinente à la question suivante de l'utilisateur : "${userPrompt}". 
Contexte : Il y a actuellement ${context.files.length} fichiers sur le bureau (${context.workspaceRoot}). 
Réponds directement au sens de sa question sans répéter de formule générique.`,
          stream: false,
        }),
      });

      if (!res.ok) {
        return this.fallbackEngine.generateChatReply(context, userPrompt);
      }

      const data = await res.json();
      return data.response || this.fallbackEngine.generateChatReply(context, userPrompt);
    } catch {
      return this.fallbackEngine.generateChatReply(context, userPrompt);
    }
  }

  async generatePlan(context: AIWorkspaceContext, userPrompt: string): Promise<OperationPlan | null> {
    // If the prompt is purely informational, don't generate a plan
    const promptLower = userPrompt.toLowerCase();
    const isAction =
      promptLower.includes("trie") ||
      promptLower.includes("range") ||
      promptLower.includes("organise") ||
      promptLower.includes("classe") ||
      promptLower.includes("regroupe") ||
      promptLower.includes("déplace") ||
      promptLower.includes("mets");

    if (!isAction) {
      return null;
    }

    const isAvail = await this.isAvailable();
    if (!isAvail) {
      return this.fallbackEngine.generatePlan(context, userPrompt);
    }

    try {
      const systemPrompt = `Tu es le planificateur de DeskMind AI. Réponds UNIQUEMENT avec un objet JSON valide correspondant au schéma suivant :
{
  "id": "uuid",
  "title": "Titre court",
  "description": "Description du plan",
  "createdAt": "ISO date",
  "operations": [
    {
      "id": "uuid",
      "type": "MOVE" | "CREATE_DIR",
      "source": "chemin source absolu",
      "destination": "chemin destination absolu",
      "reason": "explication courte",
      "status": "PENDING",
      "selected": true
    }
  ]
}
Tu ne dois déplacer que des fichiers parmi la liste fournie et rester STRICTEMENT dans le dossier racine : ${context.workspaceRoot}.
Fichiers disponibles :
${JSON.stringify(
  context.files.map((f) => ({ name: f.name, path: f.path, category: f.category, size: f.size })),
  null,
  2
)}`;

      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          prompt: `${systemPrompt}\n\nDemande utilisateur : ${userPrompt}\nJSON :`,
          format: "json",
          stream: false,
        }),
      });

      if (!res.ok) {
        return this.fallbackEngine.generatePlan(context, userPrompt);
      }

      const raw = await res.json();
      const parsed = JSON.parse(raw.response);
      const validated = OperationPlanSchema.parse(parsed);
      return validated;
    } catch {
      return this.fallbackEngine.generatePlan(context, userPrompt);
    }
  }
}
