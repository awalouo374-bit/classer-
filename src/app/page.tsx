"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StatCards } from "@/components/dashboard/StatCards";
import { CategoryDistribution } from "@/components/dashboard/CategoryDistribution";
import { FileExplorerView } from "@/components/dashboard/FileExplorerView";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { OperationModal } from "@/components/staging/OperationModal";
import { HistoryDrawer } from "@/components/history/HistoryDrawer";
import {
  FileCategory,
  FileItem,
  WorkspaceInfo,
  ChatMessage,
  OperationPlan,
  RollbackSession,
} from "@/types";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export default function DeskMindPage() {
  const [currentTab, setCurrentTab] = useState<"dashboard" | "chat" | "history">("dashboard");
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | "ALL">("ALL");
  const [sessionToken, setSessionToken] = useState<string>("");
  const [historySessions, setHistorySessions] = useState<RollbackSession[]>([]);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  // Staging Modal State
  const [activePlan, setActivePlan] = useState<OperationPlan | null>(null);
  const [isStagingOpen, setIsStagingOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Rollback state
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [isLoadingScan, setIsLoadingScan] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 5000);
  };

  // Fetch scan data
  const fetchScan = useCallback(async (customPath?: string) => {
    setIsLoadingScan(true);
    try {
      const url = customPath
        ? `/api/workspace/scan?path=${encodeURIComponent(customPath)}`
        : "/api/workspace/scan";

      const res = await fetch(url);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Échec de l'analyse du bureau");
      }

      setWorkspace(json.data.workspace);
      setFiles(json.data.files);
      if (json.data.sessionToken) {
        setSessionToken(json.data.sessionToken);
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, "error");
    } finally {
      setIsLoadingScan(false);
    }
  }, []);

  // Fetch History
  const fetchHistory = useCallback(async (workspacePath: string) => {
    try {
      const res = await fetch(`/api/history?path=${encodeURIComponent(workspacePath)}`);
      const json = await res.json();
      if (json.success) {
        setHistorySessions(json.data);
      }
    } catch {
      // Ignore background history fetch errors
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchScan();
  }, [fetchScan]);

  // When workspace changes, fetch history
  useEffect(() => {
    if (workspace?.canonicalPath) {
      fetchHistory(workspace.canonicalPath);
    }
  }, [workspace?.canonicalPath, fetchHistory]);

  // Initial Welcome Chat Message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome-1",
          sender: "assistant",
          text: `Bonjour ! Je suis DeskMind AI, votre assistant local d'organisation de bureau Windows.\n\nDemandez-moi simplement en français ce que vous souhaitez faire. Par exemple : *"Organise tous mes fichiers par catégorie"* ou *"Regroupe mes tableurs et mes PDF"*.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [messages.length]);

  // Handle Send Chat
  const handleSendMessage = async (
    prompt: string,
    options?: { provider?: string; apiKey?: string }
  ) => {
    if (!workspace) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: prompt,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoadingChat(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          workspacePath: workspace.canonicalPath,
          provider: options?.provider || "auto",
          apiKey: options?.apiKey,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Erreur lors de la réponse du chatbot");
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: json.data.reply,
        timestamp: new Date().toISOString(),
        suggestedPlan: json.data.plan,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If user is on dashboard, give visual hint or automatically open staging if desired
      if (json.data.plan && json.data.plan.operations.length > 0) {
        setActivePlan(json.data.plan);
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, "error");
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Handle Plan Execution
  const handleExecutePlan = async (planToExecute: OperationPlan) => {
    if (!workspace) return;
    setIsExecuting(true);

    try {
      const res = await fetch("/api/operations/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-deskmind-token": sessionToken,
        },
        body: JSON.stringify({
          plan: planToExecute,
          workspacePath: workspace.canonicalPath,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Erreur lors de l'exécution");
      }

      const { successCount, failedCount } = json.data;
      showToast(
        `Succès : ${successCount} fichier(s) réorganisé(s) en toute sécurité !`,
        "success"
      );

      setIsStagingOpen(false);
      setActivePlan(null);

      // Refresh files and history
      await fetchScan(workspace.canonicalPath);
      await fetchHistory(workspace.canonicalPath);

      // Add confirmation message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: "assistant",
          text: `✅ Exécution terminée avec succès ! ${successCount} opération(s) appliquée(s). Vos fichiers originaux ont été déplacés sans aucun écrasement. Une entrée a été consignée dans l'Historique pour permettre une annulation (Rollback) à tout moment si vous le souhaitez.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, "error");
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle Rollback
  const handleRollback = async (sessionId: string) => {
    if (!workspace) return;
    setIsRollingBack(true);

    try {
      const res = await fetch("/api/operations/rollback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-deskmind-token": sessionToken,
        },
        body: JSON.stringify({
          sessionId,
          workspacePath: workspace.canonicalPath,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Erreur lors de la restauration");
      }

      showToast(
        `Restauration terminée : ${json.data.restoredCount} fichier(s) replacé(s) à leur emplacement initial.`,
        "success"
      );

      await fetchScan(workspace.canonicalPath);
      await fetchHistory(workspace.canonicalPath);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, "error");
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        workspace={workspace}
        onRefresh={() => workspace && fetchScan(workspace.canonicalPath)}
        onChangeWorkspace={(newPath) => fetchScan(newPath)}
        isLoading={isLoadingScan}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          workspace={workspace}
          onRefresh={() => workspace && fetchScan(workspace.canonicalPath)}
          isLoading={isLoadingScan}
          onOpenChat={() => setCurrentTab("chat")}
        />

        {/* Dynamic Views */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentTab === "dashboard" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Stat Cards */}
              <StatCards workspace={workspace} />

              {/* Category Breakdown Bar */}
              <CategoryDistribution
                workspace={workspace}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />

              {/* File Explorer View */}
              <FileExplorerView
                files={files}
                selectedCategory={selectedCategory}
                onTriggerOrganizeCategory={(category) => {
                  setCurrentTab("chat");
                  handleSendMessage(`Organise et regroupe tous mes fichiers de la catégorie ${category}`);
                }}
              />
            </div>
          )}

          {currentTab === "chat" && (
            <div className="max-w-4xl mx-auto">
              <ChatContainer
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoadingChat}
                onOpenStaging={(plan) => {
                  setActivePlan(plan);
                  setIsStagingOpen(true);
                }}
                totalFiles={files.length}
              />
            </div>
          )}

          {currentTab === "history" && (
            <div className="max-w-4xl mx-auto">
              <HistoryDrawer
                sessions={historySessions}
                onRollback={handleRollback}
                isRollingBack={isRollingBack}
                onRefreshHistory={() => workspace && fetchHistory(workspace.canonicalPath)}
              />
            </div>
          )}
        </main>
      </div>

      {/* Staging & Confirmation Modal */}
      <OperationModal
        plan={activePlan}
        isOpen={isStagingOpen}
        onClose={() => setIsStagingOpen(false)}
        onExecute={handleExecutePlan}
        isExecuting={isExecuting}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-medium backdrop-blur-md ${
              toast.type === "success"
                ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/30 shadow-emerald-950/50"
                : toast.type === "error"
                ? "bg-rose-950/90 text-rose-200 border-rose-500/30 shadow-rose-950/50"
                : "bg-slate-900/90 text-slate-200 border-slate-700 shadow-slate-950/50"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
            {toast.type === "error" && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />}
            {toast.type === "info" && <Info className="h-4 w-4 text-blue-400 shrink-0" />}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors ml-2"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
