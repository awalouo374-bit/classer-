"use client";

import React, { useState } from "react";
import {
  FolderTree,
  Bot,
  History,
  ShieldCheck,
  FolderSync,
  HardDrive,
  FolderOpen,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { WorkspaceInfo } from "@/types";

interface SidebarProps {
  currentTab: "dashboard" | "chat" | "history";
  onTabChange: (tab: "dashboard" | "chat" | "history") => void;
  workspace: WorkspaceInfo | null;
  onRefresh: () => void;
  onChangeWorkspace: (newPath: string) => void;
  isLoading: boolean;
}

export function Sidebar({
  currentTab,
  onTabChange,
  workspace,
  onRefresh,
  onChangeWorkspace,
  isLoading,
}: SidebarProps) {
  const [isChangingPath, setIsChangingPath] = useState(false);
  const [customPath, setCustomPath] = useState("");

  const handleCustomPathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPath.trim()) {
      onChangeWorkspace(customPath.trim());
      setIsChangingPath(false);
      setCustomPath("");
    }
  };

  return (
    <aside className="w-80 h-screen bg-[#0b1120] border-r border-slate-800 flex flex-col justify-between shrink-0">
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                DeskMind AI
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Local
                </span>
              </h1>
              <p className="text-xs text-slate-400">Assistant Bureau Windows</p>
            </div>
          </div>

          {/* Security Shield Badge */}
          <div className="mt-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-xs text-emerald-400">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
            <div className="leading-tight">
              <p className="font-medium">Sandbox locale active</p>
              <p className="text-[11px] text-emerald-400/80">Zéro exécution CMD/PowerShell</p>
            </div>
          </div>
        </div>

        {/* Workspace Target Card */}
        <div className="p-4 mx-3 mt-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive className="h-3.5 w-3.5 text-blue-400" /> Espace ciblé
            </span>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Actualiser le scan"
              className="hover:text-white transition-colors p-1 rounded hover:bg-slate-800 disabled:opacity-50"
            >
              <FolderSync className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
            </button>
          </div>

          <div className="text-xs font-mono text-slate-200 truncate bg-slate-950/70 p-2 rounded border border-slate-800/80 mb-2.5" title={workspace?.canonicalPath || "Chargement..."}>
            {workspace?.canonicalPath || "Chargement du bureau..."}
          </div>

          {isChangingPath ? (
            <form onSubmit={handleCustomPathSubmit} className="space-y-2">
              <input
                type="text"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="Ex: C:\Users\marti\Desktop"
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <div className="flex gap-1.5">
                <button
                  type="submit"
                  className="flex-1 text-[11px] font-medium bg-blue-600 hover:bg-blue-500 text-white py-1 rounded transition-colors"
                >
                  Valider
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingPath(false)}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsChangingPath(true)}
              className="w-full text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 py-1.5 rounded transition-colors flex items-center justify-center gap-1.5 border border-slate-700/50"
            >
              <FolderOpen className="h-3.5 w-3.5" /> Changer de dossier
            </button>
          )}

          {workspace && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-950/40 p-1.5 rounded">
                <div className="text-[11px] text-slate-400">Fichiers</div>
                <div className="text-sm font-semibold text-slate-200">{workspace.totalFiles}</div>
              </div>
              <div className="bg-slate-950/40 p-1.5 rounded">
                <div className="text-[11px] text-slate-400">Taille</div>
                <div className="text-sm font-semibold text-slate-200">{formatBytes(workspace.totalSize)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          <button
            onClick={() => onTabChange("dashboard")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentTab === "dashboard"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <FolderTree className="h-4 w-4" />
            Tableau de bord
          </button>

          <button
            onClick={() => onTabChange("chat")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentTab === "chat"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <Bot className="h-4 w-4" />
              Assistant Chatbot
            </div>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
              IA
            </span>
          </button>

          <button
            onClick={() => onTabChange("history")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentTab === "history"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <History className="h-4 w-4" />
            Historique & Rollback
          </button>
        </nav>
      </div>

      {/* Safety Footer */}
      <div className="p-4 m-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <Lock className="h-3.5 w-3.5 text-blue-400" />
          Règles de sécurité strictes
        </div>
        <ul className="space-y-1 text-slate-400/90 pl-1">
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
            Confirmation explicite requise
          </li>
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
            Anti-écrasement des fichiers
          </li>
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
            Restauration (Undo) disponible
          </li>
        </ul>
      </div>
    </aside>
  );
}
