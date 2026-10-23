"use client";

import React, { useState } from "react";
import {
  History,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { RollbackSession } from "@/types";
import { formatDateFr } from "@/lib/utils";

interface HistoryDrawerProps {
  sessions: RollbackSession[];
  onRollback: (sessionId: string) => Promise<void>;
  isRollingBack: boolean;
  onRefreshHistory: () => void;
}

export function HistoryDrawer({
  sessions,
  onRollback,
  isRollingBack,
  onRefreshHistory,
}: HistoryDrawerProps) {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [selectedSessionForRollback, setSelectedSessionForRollback] =
    useState<RollbackSession | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedSessionId((prev) => (prev === id ? null : id));
  };

  const handleConfirmRollback = async () => {
    if (!selectedSessionForRollback || isRollingBack) return;
    await onRollback(selectedSessionForRollback.id);
    setSelectedSessionForRollback(null);
    onRefreshHistory();
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <History className="h-5 w-5 text-blue-400" />
            Historique des opérations & Restauration
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Chaque déplacement est archivé dans le grand livre local (Ledger). Vous pouvez restaurer vos fichiers à leur état d&apos;origine à tout moment.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
          <ShieldCheck className="h-4 w-4" />
          <span>Restauration non destructive</span>
        </div>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <History className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">
            Aucun historique enregistré
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Les opérations de tri confirmées apparaîtront ici automatiquement avec la possibilité d&apos;annuler.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isExpanded = expandedSessionId === session.id;
            const isCancelled = session.title.startsWith("[ANNULÉ]");

            return (
              <div
                key={session.id}
                className="glass-card rounded-2xl border border-slate-800 overflow-hidden"
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                        isCancelled
                          ? "bg-slate-800 text-slate-500"
                          : "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <h4
                        className={`text-sm font-semibold ${
                          isCancelled ? "text-slate-400 line-through" : "text-white"
                        }`}
                      >
                        {session.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          {formatDateFr(session.timestamp)}
                        </span>
                        <span>•</span>
                        <span>{session.operations.length} fichier(s) déplacé(s)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isCancelled && (
                      <button
                        onClick={() => setSelectedSessionForRollback(session)}
                        disabled={isRollingBack}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restaurer
                      </button>
                    )}

                    <button
                      onClick={() => toggleExpand(session.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="Détails des opérations"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-800/60 bg-slate-950/40 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Fichiers de cette session :
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2">
                      {session.operations.map((op, i) => {
                        const originalName = op.originalSource.split(/[/\\]/).pop();
                        const destName = op.executedDestination.split(/[/\\]/).pop();

                        return (
                          <div
                            key={i}
                            className="p-2 rounded bg-slate-900/80 border border-slate-800/80 text-xs font-mono flex items-center justify-between"
                          >
                            <span className="text-slate-300 truncate max-w-xs">
                              {originalName}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-blue-400 shrink-0 mx-2" />
                            <span className="text-emerald-400 truncate max-w-xs font-semibold">
                              {destName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rollback Confirmation Modal */}
      {selectedSessionForRollback && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1626] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
              <RotateCcw className="h-6 w-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">
                Confirmer la restauration ?
              </h3>
              <p className="text-xs text-slate-400">
                Vous êtes sur le point de replacer les{" "}
                <strong className="text-white">
                  {selectedSessionForRollback.operations.length} fichier(s)
                </strong>{" "}
                à leur emplacement d&apos;origine sur votre bureau.
              </p>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Opération 100% réversible
              </div>
              <p className="text-[11px] text-slate-400">
                Les fichiers seront déplacés sans aucune perte de contenu.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedSessionForRollback(null)}
                disabled={isRollingBack}
                className="flex-1 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmRollback}
                disabled={isRollingBack}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                {isRollingBack ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                    <span>Restauration...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Restaurer maintenant</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
