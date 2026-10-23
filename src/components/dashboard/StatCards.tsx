"use client";

import React from "react";
import { Files, HardDrive, Layers, ShieldCheck } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { WorkspaceInfo } from "@/types";

interface StatCardsProps {
  workspace: WorkspaceInfo | null;
}

export function StatCards({ workspace }: StatCardsProps) {
  const activeCategoriesCount = workspace
    ? Object.values(workspace.categoriesCount).filter((count) => count > 0).length
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Files Card */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Fichiers détectés
          </span>
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Files className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-white tracking-tight">
            {workspace ? workspace.totalFiles : "—"}
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            À la racine de l&apos;espace ciblé
          </p>
        </div>
      </div>

      {/* Disk Space Card */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Espace occupé
          </span>
          <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <HardDrive className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-white tracking-tight">
            {workspace ? formatBytes(workspace.totalSize) : "—"}
          </div>
          <p className="text-xs text-slate-400 mt-1">Données prêtes à être organisées</p>
        </div>
      </div>

      {/* Categories Card */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Types identifiés
          </span>
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Layers className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-white tracking-tight">
            {activeCategoriesCount} catégories
          </div>
          <p className="text-xs text-slate-400 mt-1">PDF, Excel, Docs, Médias, Code...</p>
        </div>
      </div>

      {/* Security Integrity Card */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Garantie d&apos;intégrité
          </span>
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            100% Sûr
          </div>
          <p className="text-xs text-slate-400 mt-1">Anti-écrasement & Rollback actif</p>
        </div>
      </div>
    </div>
  );
}
