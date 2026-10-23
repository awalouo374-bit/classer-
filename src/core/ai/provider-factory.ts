import { IAIProvider } from "./interfaces";
import { RuleEngineProvider } from "./providers/rule-engine.provider";
import { OllamaProvider } from "./providers/ollama.provider";
import { CloudProvider, CloudProviderOptions } from "./providers/cloud.provider";

export type SupportedProviderType = "rule-engine" | "ollama" | "openai" | "groq" | "openrouter" | "auto";

export interface ProviderConfig {
  type?: SupportedProviderType;
  apiKey?: string;
  model?: string;
}

export function getAIProvider(config: ProviderConfig | SupportedProviderType = "auto"): IAIProvider {
  const providerType = typeof config === "string" ? config : config.type || "auto";
  const apiKey = typeof config === "object" ? config.apiKey : undefined;
  const model = typeof config === "object" ? config.model : undefined;

  if (providerType === "ollama") {
    return new OllamaProvider();
  }

  if (providerType === "openai" || providerType === "groq" || providerType === "openrouter") {
    return new CloudProvider({
      provider: providerType as CloudProviderOptions["provider"],
      apiKey,
      model,
    });
  }

  // If environment variable exists, try CloudProvider automatically
  if (process.env.OPENAI_API_KEY) {
    return new CloudProvider({ provider: "openai" });
  }
  if (process.env.GROQ_API_KEY) {
    return new CloudProvider({ provider: "groq" });
  }

  // High-performance intelligent offline local engine
  return new RuleEngineProvider();
}
