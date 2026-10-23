"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  FileText,
  FileSpreadsheet,
  FileCode,
  FileImage,
  FileArchive,
  Link2,
  File,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { FileCategory, FileItem } from "@/types";
import { CATEGORY_LABELS } from "@/core/fs/categories";
import { formatBytes, formatDateFr, getCategoryBadgeStyle } from "@/lib/utils";

interface FileExplorerViewProps {
  files: FileItem[];
  selectedCategory: FileCategory | "ALL";
  onTriggerOrganizeCategory?: (category: FileCategory) => void;
}

export function FileExplorerView({
  files,
  selectedCategory,
  onTriggerOrganizeCategory,
}: FileExplorerViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesCategory =
        selectedCategory === "ALL" || file.category === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.extension.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [files, selectedCategory, searchQuery]);

  const getFileIcon = (category: FileCategory) => {
    switch (category) {
      case "PDF":
        return <FileText className="h-4 w-4 text-rose-400" />;
      case "EXCEL":
        return <FileSpreadsheet className="h-4 w-4 text-emerald-400" />;
      case "DOCUMENTS":
        return <FileText className="h-4 w-4 text-blue-400" />;
      case "DEVELOPPEMENT":
        return <FileCode className="h-4 w-4 text-amber-400" />;
      case "IMAGES":
        return <FileImage className="h-4 w-4 text-purple-400" />;
      case "ARCHIVES":
        return <FileArchive className="h-4 w-4 text-yellow-400" />;
      case "RACCOURCIS":
        return <Link2 className="h-4 w-4 text-cyan-400" />;
      default:
        return <File className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/30">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom ou extension (.pdf, .xlsx...)"
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>
            Affichage de <strong className="text-slate-200">{filteredFiles.length}</strong> sur {files.length} fichier(s)
          </span>
          {selectedCategory !== "ALL" && onTriggerOrganizeCategory && (
            <button
              onClick={() => onTriggerOrganizeCategory(selectedCategory)}
              className="text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 px-2.5 py-1 rounded-lg transition-colors"
            >
              Ranger ces {CATEGORY_LABELS[selectedCategory]}
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
        {filteredFiles.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <HelpCircle className="h-8 w-8 mx-auto text-slate-600" />
            <p className="text-sm font-medium text-slate-400">Aucun fichier correspondant</p>
            <p className="text-xs">Modifiez vos critères de recherche ou réinitialisez le filtre.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#0e1626] text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800 z-10">
              <tr>
                <th className="py-3 px-4">Nom du fichier</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Taille</th>
                <th className="py-3 px-4">Dernière modification</th>
                <th className="py-3 px-4 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredFiles.map((file) => {
                const style = getCategoryBadgeStyle(file.category);
                return (
                  <tr
                    key={file.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-2.5 px-4 max-w-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1 rounded bg-slate-800/80 shrink-0">
                          {getFileIcon(file.category)}
                        </div>
                        <span className="font-medium text-slate-200 truncate group-hover:text-blue-400 transition-colors" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${style.bg} ${style.text} ${style.border}`}
                      >
                        {CATEGORY_LABELS[file.category]}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-400">
                      {formatBytes(file.size)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">
                      {formatDateFr(file.modifiedAt)}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500/70" />
                        Prêt
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
