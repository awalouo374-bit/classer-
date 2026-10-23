"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  ArrowRight,
  HardDrive,
  SlidersHorizontal,
  Lightbulb,
  Layers,
  Calendar,
  AlertCircle,
  Key,
} from "lucide-react";
import { ChatMessage, OperationPlan } from "@/types";

interface ChatContainerProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, options?: { provider?: string; apiKey?: string }) => void;
  isLoading: boolean;
  onOpenStaging: (plan: OperationPlan) => void;
  totalFiles: number;
}

export function ChatContainer({
  messages,
  onSendMessage,
  isLoading,
  onOpenStaging,
  totalFiles,
}: ChatContainerProps) {
  const [inputText, setInputText] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("auto");
  const [apiKey, setApiKey] = useState<string>("");
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim(), {
      provider: selectedProvider,
      apiKey: apiKey.trim() || undefined,
    });
    setInputText("");
  };

  const promptSuggestions = [
    {
      title: "Diagnostic & Conseils",
      prompt: "Que me conseilles-tu pour organiser mon bureau efficacement ?",
      icon: <Lightbulb className="h-3.5 w-3.5 text-amber-400" />,
    },
    {
      title: "Plus gros fichiers",
      prompt: "Quels sont mes fichiers les plus volumineux ?",
      icon: <HardDrive className="h-3.5 w-3.5 text-rose-400" />,
    },
    {
      title: "Doublons & Temporaires",
      prompt: "Y a-t-il des fichiers temporaires ou des doublons ?",
      icon: <AlertCircle className="h-3.5 w-3.5 text-yellow-400" />,
    },
    {
      title: "Trier par année",
      prompt: "Trie mes fichiers par année de modification",
      icon: <Calendar className="h-3.5 w-3.5 text-blue-400" />,
    },
    {
      title: "Organisation complète",
      prompt: "Organise tous mes fichiers par catégorie",
      icon: <Layers className="h-3.5 w-3.5 text-emerald-400" />,
    },
  ];

  // Helper to render basic markdown formatting cleanly
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split("\n");
    return lines.map((line, idx) => {
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      // Headers ###
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-bold text-sm text-white mt-2 mb-1">
            {line.replace("### ", "")}
          </h4>
        );
      }

      // Bullet points
      if (line.startsWith("- ") || line.startsWith("* ")) {
        const content = line.substring(2);
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-2 my-0.5">
            <span className="text-blue-400 font-bold shrink-0">•</span>
            <span>{parseInlineStyles(content)}</span>
          </div>
        );
      }

      // Numbered lists (1. , 2. ...)
      const numMatch = line.match(/^(\d+)\.\s(.*)$/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 ml-2 my-0.5">
            <span className="text-blue-400 font-mono font-semibold shrink-0">{numMatch[1]}.</span>
            <span>{parseInlineStyles(numMatch[2])}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="my-0.5">
          {parseInlineStyles(line)}
        </p>
      );
    });
  };

  const parseInlineStyles = (text: string) => {
    // Basic inline parser for bold **text** and inline `code`
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="font-mono bg-slate-950/80 px-1 py-0.5 rounded text-blue-300 text-[11px] border border-slate-800">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] glass-card rounded-2xl overflow-hidden">
      {/* Chat Sub-Header with Provider Selector */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-blue-400" />
          <span className="font-semibold text-slate-200">Assistant IA DeskMind</span>
          <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">
            {selectedProvider === "openai"
              ? "OpenAI (GPT-4o)"
              : selectedProvider === "groq"
              ? "Groq (Llama 3.3)"
              : selectedProvider === "ollama"
              ? "Ollama Local"
              : "Moteur Local Raisonné"}
          </span>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors border ${
            showSettings
              ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
              : "bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-white"
          }`}
          title="Configurer le modèle IA"
        >
          <SlidersHorizontal className="h-3 w-3" />
          <span className="text-[11px]">Modèle IA</span>
        </button>
      </div>

      {/* Model Settings Drawer */}
      {showSettings && (
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-xs space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-slate-400 font-medium">Fournisseur d&apos;IA :</label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="auto">Moteur Local Intelligent (Analytique hors-ligne)</option>
                <option value="groq">Groq (Llama 3.3 70B - Ultra-rapide)</option>
                <option value="openai">OpenAI (ChatGPT / GPT-4o-mini)</option>
                <option value="ollama">Ollama (Modèle local sur 127.0.0.1:11434)</option>
                <option value="openrouter">OpenRouter (Multi-modèles)</option>
              </select>
            </div>

            {(selectedProvider === "openai" || selectedProvider === "groq" || selectedProvider === "openrouter") && (
              <div className="flex-1 space-y-1">
                <label className="text-slate-400 font-medium flex items-center gap-1">
                  <Key className="h-3 w-3 text-amber-400" /> Clé API {selectedProvider.toUpperCase()} :
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Le <strong>Moteur Local</strong> analyse la structure de vos fichiers réels et répond avec pertinence et variété sans nécessiter de connexion internet.
          </p>
        </div>
      )}

      {/* Chat Messages Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender !== "user" && (
              <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
                <Bot className="h-4 w-4 text-white" />
              </div>
            )}

            <div
              className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/20"
                  : "bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none shadow-md"
              }`}
            >
              <div>{renderFormattedText(msg.text)}</div>

              {/* Embedded Plan Card ONLY if suggestedPlan has operations */}
              {msg.suggestedPlan && msg.suggestedPlan.operations && msg.suggestedPlan.operations.length > 0 && (
                <div className="mt-4 p-3.5 rounded-xl bg-slate-950/90 border border-blue-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      {msg.suggestedPlan.title}
                    </span>
                    <span className="text-[11px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                      {msg.suggestedPlan.operations.length} actions
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    {msg.suggestedPlan.description}
                  </p>

                  <button
                    onClick={() => onOpenStaging(msg.suggestedPlan!)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 transition-all hover:scale-[1.01]"
                  >
                    <span>Examiner et Valider ce plan</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div
                className={`mt-2 text-[10px] ${
                  msg.sender === "user" ? "text-blue-200" : "text-slate-500"
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            {msg.sender === "user" && (
              <div className="h-8 w-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                <User className="h-4 w-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3.5 items-center">
            <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-400 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
              <span>DeskMind AI réfléchit et analyse votre question...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Carousel */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-800/80">
        <div className="text-[11px] text-slate-400 mb-2 font-medium flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-blue-400" /> Questions et actions recommandées :
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {promptSuggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(item.prompt, { provider: selectedProvider, apiKey: apiKey.trim() || undefined })}
              disabled={isLoading || totalFiles === 0}
              className="text-left p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all text-xs disabled:opacity-50 group"
            >
              <div className="flex items-center gap-1.5 font-medium text-slate-200 group-hover:text-blue-400 transition-colors">
                {item.icon}
                <span className="truncate">{item.title}</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {item.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Posez une question sur vos fichiers ou demandez un tri spécifique..."
          disabled={isLoading}
          className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Envoyer</span>
        </button>
      </form>
    </div>
  );
}
