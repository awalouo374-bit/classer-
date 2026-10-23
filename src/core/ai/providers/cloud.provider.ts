import { AIWorkspaceContext, IAIProvider } from "../interfaces";
import { OperationPlan, OperationPlanSchema } from "@/types";
import { RuleEngineProvider } from "./rule-engine.provider";

export interface CloudProviderOptions {
  provider: "openai" | "groq" | "openrouter";
  apiKey?: string;
  model?: string;
}

export class CloudProvider implements IAIProvider {
  name = "Cloud LLM Provider";
  private apiKey: string;
  private endpoint: string;
  private model: string;
  private fallbackEngine: RuleEngineProvider;

  constructor(options?: CloudProviderOptions) {
    this.fallbackEngine = new RuleEngineProvider();

    const providerType = options?.provider || "groq";
    if (providerType === "groq") {
      this.apiKey = options?.apiKey || process.env.GROQ_API_KEY || "";
      this.endpoint = "https://api.groq.com/openai/v1/chat/completions";
      this.model = options?.model || "llama-3.3-70b-versatile";
    } else if (providerType === "openrouter") {
      this.apiKey = options?.apiKey || process.env.OPENROUTER_API_KEY || "";
      this.endpoint = "https://openrouter.ai/api/v1/chat/completions";
      this.model = options?.model || "meta-llama/llama-3.3-70b-instruct";
    } else {
      // Default OpenAI
      this.apiKey = options?.apiKey || process.env.OPENAI_API_KEY || "";
      this.endpoint = "https://api.openai.com/v1/chat/completions";
      this.model = options?.model || "gpt-4o-mini";
    }
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  async generateChatReply(context: AIWorkspaceContext, userPrompt: string): Promise<string> {
    const isAvail = await this.isAvailable();
    if (!isAvail) {
      return this.fallbackEngine.generateChatReply(context, userPrompt);
    }

    try {
      const systemInstruction = `Tu es DeskMind AI, un assistant d'organisation de bureau Windows hautement intelligent, bienveillant, précis et analytique.
Tu réponds toujours en français.
Prends le temps d'analyser la question de l'utilisateur et réponds précisément dans le sens de sa question.
Ne donne jamais de réponse répétitive ou préformatée.
Voici le contexte actuel de l'espace de travail :
- Emplacement : ${context.workspaceRoot}
- Nombre total de fichiers : ${context.files.length}
- Échantillon des fichiers présents :
${JSON.stringify(
  context.files.slice(0, 40).map((f) => ({ name: f.name, size: f.size, category: f.category, modified: f.modifiedAt })),
  null,
  2
)}

Si l'utilisateur pose une question de conseil, de statistiques ou d'analyse, réponds-lui avec perspicacité.
S'il demande une organisation, explique la démarche avec précision.`;

      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        return this.fallbackEngine.generateChatReply(context, userPrompt);
      }

      const json = await res.json();
      return json.choices?.[0]?.message?.content || this.fallbackEngine.generateChatReply(context, userPrompt);
    } catch {
      return this.fallbackEngine.generateChatReply(context, userPrompt);
    }
  }

  async generatePlan(context: AIWorkspaceContext, userPrompt: string): Promise<OperationPlan | null> {
    const isAvail = await this.isAvailable();
    if (!isAvail) {
      return this.fallbackEngine.generatePlan(context, userPrompt);
    }

    const p = userPrompt.toLowerCase();
    const isAction =
      p.includes("trie") ||
      p.includes("range") ||
      p.includes("organise") ||
      p.includes("classe") ||
      p.includes("regroupe") ||
      p.includes("déplace") ||
      p.includes("mets") ||
      p.includes("dossier");

    if (!isAction) {
      return null;
    }

    try {
      const systemInstruction = `Tu es le moteur de planification de DeskMind AI.
L'utilisateur te demande d'organiser ses fichiers.
IMPORTANT : Si l'utilisateur demande une arborescence ou des sous-dossiers imbriqués (par exemple "par année, par type de fichier et par nom"), tu dois créer des dossiers imbriqués selon sa demande exacte (exemple : 2026/Excel/Master Customer/nom_fichier.xlsx).
Ne déplace QUE les fichiers concernés par sa demande.
Tu dois répondre UNIQUEMENT par un objet JSON valide conforme à cette structure :
{
  "id": "uuid",
  "title": "Titre court du plan",
  "description": "Courte description",
  "createdAt": "${new Date().toISOString()}",
  "operations": [
    {
      "id": "uuid",
      "type": "MOVE" | "CREATE_DIR",
      "source": "chemin absolu du fichier source",
      "destination": "chemin absolu du fichier destination dans le workspace",
      "reason": "justification logique",
      "status": "PENDING",
      "selected": true
    }
  ]
}
Tu ne dois déplacer que des fichiers parmi la liste fournie et rester STRICTEMENT dans : ${context.workspaceRoot}.
Fichiers :
${JSON.stringify(
  context.files.slice(0, 80).map((f) => ({ name: f.name, path: f.path, category: f.category })),
  null,
  2
)}`;

      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
        }),
      });

      if (!res.ok) {
        return this.fallbackEngine.generatePlan(context, userPrompt);
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) return this.fallbackEngine.generatePlan(context, userPrompt);

      const parsed = JSON.parse(content);
      return OperationPlanSchema.parse(parsed);
    } catch {
      return this.fallbackEngine.generatePlan(context, userPrompt);
    }
  }
}
