"use client";

import React from "react";
import { FileCategory, WorkspaceInfo } from "@/types";
import { CATEGORY_LABELS } from "@/core/fs/categories";
import { getCategoryBadgeStyle } from "@/lib/utils";

interface CategoryDistributionProps {
  workspace: WorkspaceInfo | null;
  selectedCategory: FileCategory | "ALL";
  onSelectCategory: (cat: FileCategory | "ALL") => void;
}

export function CategoryDistribution({
  workspace,
  selectedCategory,
  onSelectCategory,
}: CategoryDistributionProps) {
  if (!workspace || workspace.totalFiles === 0) {
    return null;
  }

  const categories = Object.entries(workspace.categoriesCount).filter(
    ([, count]) => count > 0
  ) as [FileCategory, number][];

  return (
    <div className="glass-card p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200">
          Distribution par type de fichier
        </h3>
        <span className="text-xs text-slate-400">
          Cliquez sur un type pour filtrer
        </span>
      </div>

      {/* Distribution Multi-Bar */}
      <div className="h-3 w-full rounded-full bg-slate-900 overflow-hidden flex mb-4 border border-slate-800">
        {categories.map(([category, count]) => {
          const percentage = (count / workspace.totalFiles) * 100;
          const style = getCategoryBadgeStyle(category);
          return (
            <div
              key={category}
              style={{ width: `${percentage}%` }}
              title={`${CATEGORY_LABELS[category]}: ${count} fichier(s) (${percentage.toFixed(1)}%)`}
              className={`h-full transition-all duration-300 ${
                category === "DOCUMENTS"
                  ? "bg-blue-500"
                  : category === "EXCEL"
                  ? "bg-emerald-500"
                  : category === "PDF"
                  ? "bg-rose-500"
                  : category === "DEVELOPPEMENT"
                  ? "bg-amber-500"
                  : category === "IMAGES"
                  ? "bg-purple-500"
                  : category === "ARCHIVES"
                  ? "bg-yellow-500"
                  : category === "RACCOURCIS"
                  ? "bg-cyan-500"
                  : "bg-zinc-500"
              }`}
            />
          );
        })}
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectCategory("ALL")}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
            selectedCategory === "ALL"
              ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20 font-medium"
              : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850"
          }`}
        >
          Tous ({workspace.totalFiles})
        </button>

        {categories.map(([category, count]) => {
          const style = getCategoryBadgeStyle(category);
          const isSelected = selectedCategory === category;

          return (
            <button
              key={category}
              onClick={() => onSelectCategory(isSelected ? "ALL" : category)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                isSelected
                  ? `${style.bg} ${style.text} ${style.border} font-medium ring-1 ring-offset-1 ring-offset-slate-950 ring-current`
                  : `bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850`
              }`}
            >
              <span>{CATEGORY_LABELS[category]}</span>
              <span className="opacity-70 font-mono">({count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
