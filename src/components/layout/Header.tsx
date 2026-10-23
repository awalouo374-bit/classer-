"use client";

import React from "react";
import { Folder, RefreshCw, Sparkles, Shield, Cpu } from "lucide-react";
import { WorkspaceInfo } from "@/types";

interface HeaderProps {
  workspace: WorkspaceInfo | null;
  onRefresh: () => void;
  isLoading: boolean;
  onOpenChat: () => void;
}

export function Header({
  workspace,
  onRefresh,
  isLoading,
  onOpenChat,
}: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-800 bg-[#0b1120]/80 backdrop-blur-md px-6 flex items-center justify-between z-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Folder className="h-4 w-4 text-blue-400" />
          <span>Poste Local</span>
          <span className="text-slate-600">/</span>
          <span className="font-mono text-slate-200 text-xs bg-slate-900 px-2 py-1 rounded border border-slate-800 max-w-md truncate">
            {workspace?.canonicalPath || "Initialisation..."}
          </span>
        </div>
      </div>

      {/* Header Actions & Indicators */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <Cpu className="h-3.5 w-3.5 text-blue-400" />
          <span>Moteur IA Local</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-400">
          <Shield className="h-3.5 w-3.5 text-emerald-400" />
          <span>127.0.0.1 (Strict)</span>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
          Actualiser
        </button>

        <button
          onClick={onOpenChat}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
        >
          <Sparkles className="h-3.5 w-3.5 text-blue-200" />
          Demander à l&apos;IA
        </button>
      </div>
    </header>
  );
}
