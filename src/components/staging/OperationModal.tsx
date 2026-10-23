"use client";

import React, { useState } from "react";
import {
  X,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  FolderPlus,
  MoveRight,
  AlertTriangle,
  Play,
  RotateCcw,
} from "lucide-react";
import { FileOperation, OperationPlan } from "@/types";

interface OperationModalProps {
  plan: OperationPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onExecute: (validatedPlan: OperationPlan) => Promise<void>;
  isExecuting: boolean;
}

export function OperationModal({
  plan,
  isOpen,
  onClose,
  onExecute,
  isExecuting,
}: OperationModalProps) {
  const [operations, setOperations] = useState<FileOperation[]>(
    plan?.operations || []
  );

  // Sync operations if plan changes
  React.useEffect(() => {
    if (plan?.operations) {
      setOperations(plan.operations);
    }
  }, [plan]);

  if (!isOpen || !plan) return null;

  const toggleSelectAll = (checked: boolean) => {
    setOperations((prev) => prev.map((op) => ({ ...op, selected: checked })));
  };

  const toggleSingle = (id: string) => {
    setOperations((prev) =>
      prev.map((op) => (op.id === id ? { ...op, selected: !op.selected } : op))
    );
  };

  const selectedCount = operations.filter((op) => op.selected).length;
  const conflictCount = operations.filter((op) => op.status === "CONFLICT").length;

  const handleConfirm = async () => {
    if (selectedCount === 0 || isExecuting) return;
    const finalPlan: OperationPlan = {
      ...plan,
      operations,
    };
    await onExecute(finalPlan);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e1626] border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Aperçu avant exécution
              </span>
              {conflictCount > 0 && (
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {conflictCount} collision(s) gérée(s)
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white mt-1">{plan.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{plan.description}</p>
          </div>

          <button
            onClick={onClose}
            disabled={isExecuting}
            className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Security Banner */}
        <div className="px-6 py-2.5 bg-blue-950/30 border-b border-blue-900/30 flex items-center gap-2.5 text-xs text-blue-300">
          <ShieldAlert className="h-4 w-4 text-blue-400 shrink-0" />
          <span>
            <strong>Contrôle utilisateur strict :</strong> Décochez les fichiers que vous souhaitez conserver à leur emplacement actuel. Aucun fichier ne sera écrasé ni supprimé.
          </span>
        </div>

        {/* Toolbar: Select All */}
        <div className="px-6 py-3 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-slate-300 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={selectedCount === operations.length && operations.length > 0}
              onChange={(e) => toggleSelectAll(e.target.checked)}
              disabled={isExecuting}
              className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 focus:ring-offset-0 h-4 w-4"
            />
            Tout sélectionner ({operations.length} actions)
          </label>

          <span className="text-slate-400">
            <strong className="text-white">{selectedCount}</strong> sélectionnée(s)
          </span>
        </div>

        {/* Operations List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {operations.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Aucune action proposée dans ce plan.
            </div>
          ) : (
            operations.map((op) => {
              const sourceName = op.source.split(/[/\\]/).pop() || op.source;
              const destName = op.destination.split(/[/\\]/).pop() || "";
              
              // Extract the complete nested folder tree (e.g. 2026/Excel/Master Customer/)
              const normSrc = op.source.replace(/\\/g, "/");
              const normDest = op.destination.replace(/\\/g, "/");
              const srcDir = normSrc.substring(0, normSrc.lastIndexOf("/"));
              const destDir = normDest.substring(0, normDest.lastIndexOf("/"));
              
              let nestedFolderTree = "";
              if (destDir.startsWith(srcDir)) {
                const rel = destDir.substring(srcDir.length).replace(/^\//, "");
                nestedFolderTree = rel ? `${rel}/` : "";
              } else {
                const parts = destDir.split("/");
                nestedFolderTree = parts.slice(-3).join("/") + "/";
              }

              return (
                <div
                  key={op.id}
                  onClick={() => !isExecuting && toggleSingle(op.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    op.selected
                      ? "bg-slate-900/90 border-slate-700 hover:border-slate-600"
                      : "bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-80"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={op.selected}
                      onChange={() => {}} // handled by parent onClick
                      disabled={isExecuting}
                      className="mt-1 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 h-4 w-4 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                          {op.type === "CREATE_DIR" ? (
                            <>
                              <FolderPlus className="h-3 w-3" /> Créer dossier
                            </>
                          ) : (
                            <>
                              <MoveRight className="h-3 w-3" /> Déplacer
                            </>
                          )}
                        </span>
                        <span className="text-xs text-slate-400 truncate">
                          {op.reason}
                        </span>
                      </div>

                      {/* Source -> Destination Diff with complete nested folder tree */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs font-mono">
                        <span className="text-slate-300 truncate max-w-xs" title={op.source}>
                          {sourceName}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-blue-400 shrink-0 hidden sm:inline" />
                        <span className="text-emerald-400 font-semibold truncate max-w-sm" title={op.destination}>
                          {nestedFolderTree}
                          {destName}
                        </span>
                      </div>

                      {/* Conflict Notification */}
                      {op.conflictReason && (
                        <div className="mt-2 text-[11px] text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20 flex items-start gap-1.5 font-sans">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span>{op.conflictReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="px-4 py-2.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0 || isExecuting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                <span>Exécution sécurisée en cours...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Confirmer et exécuter ({selectedCount} actions)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
