import path from "node:path";
import crypto from "node:crypto";
import { AIWorkspaceContext, IAIProvider } from "../interfaces";
import { FileOperation, OperationPlan, FileItem, FileCategory } from "@/types";
import { CATEGORY_LABELS } from "@/core/fs/categories";
import { formatBytes, formatDateFr } from "@/lib/utils";

type IntentType =
  | "GREETING_HELP"
  | "BIGGEST_FILES"
  | "STATS_OVERVIEW"
  | "DATE_QUERY"
  | "TEMPORARY_DUPLICATES"
  | "SECURITY_ROLLBACK"
  | "ADVICE_RECOMMENDATION"
  | "SPECIFIC_CATEGORY"
  | "ACTION_ORGANIZE";

type HierarchyLevel = "YEAR" | "CATEGORY" | "SUBJECT" | "CUSTOM_NAME";

const CATEGORY_SHORT_NAMES: Record<FileCategory, string> = {
  DOCUMENTS: "Documents",
  EXCEL: "Excel",
  PDF: "PDF",
  DEVELOPPEMENT: "Code",
  IMAGES: "Images",
  ARCHIVES: "Archives",
  RACCOURCIS: "Raccourcis",
  EXECUTABLES: "Applications",
  AUTRE: "Divers",
};

/**
 * Extracts a clean, semantic subject/project name from a filename.
 * e.g., "Master CustomerList2 & 3 to update (04-Sep-26)-extract.xlsx" -> "Master Customer"
 */
export function extractFileSubject(filename: string): string {
  const withoutExt = path.parse(filename).name.replace(/^~\$/, "").trim();
  const lower = withoutExt.toLowerCase();

  // High priority known thematic patterns
  if (lower.includes("master customer")) return "Master Customer";
  if (lower.includes("p&l analytic") || lower.includes("mgt accounts")) return "P&L Analytic";
  if (lower.includes("colisage") || lower.includes("colisages")) return "Colisages";
  if (lower.includes("sfxeguce") || lower.includes("sfx_eguce")) return "SFXeGUCE";
  if (lower.includes("guce benin") || lower.includes("guce")) return "GUCE Benin";
  if (lower.includes("edifact") || lower.includes("iftmcs")) return "EDIFACT";
  if (lower.includes("brainopx") || lower.includes("bopx")) return "BrainOpx";
  if (lower.includes("bs3li")) return "BS3LI";
  if (/cm2[4-6][-_ ]/i.test(lower)) return "Dossiers CM";
  if (lower.includes("predouane") || lower.includes("sfx_predouane")) return "PreDouane";
  if (lower.includes("hscodes")) return "HS Codes";
  if (lower.includes("antigravity")) return "Antigravity";
  if (lower.includes("sidify")) return "Sidify";
  if (lower.includes("obs-studio") || lower.includes("obs studio")) return "OBS Studio";
  if (lower.includes("script") || lower.includes("base de donnees") || lower.includes("sqlserver")) return "Bases de Données";
  if (lower.includes("whatsapp")) return "WhatsApp Médias";
  if (lower.includes("manifeste") || lower.includes("oocl")) return "Manifestes OOCL";

  // Clean noise patterns: dates, suffixes, tags
  const cleaned = withoutExt
    .replace(/\b\d{1,2}[-_][a-zA-Z]{3,}[-_]\d{2,4}\b/gi, "") // 04-Sep-26
    .replace(/\b\d{4}[-_]\d{2}[-_]\d{2}\b/g, "")             // 2026-08-25
    .replace(/\b20\d{6}\b/g, "")                             // 20260826
    .replace(/[-_]extract\d?/gi, "")
    .replace(/\(cleaned\)/gi, "")
    .replace(/\(new\)/gi, "")
    .replace(/\(copy\)/gi, "")
    .replace(/- Copy/gi, "")
    .replace(/to update/gi, "")
    .replace(/template/gi, "")
    .replace(/\(\d+\)/g, "")
    .replace(/[_\-]+/g, " ")
    .trim();

  // Extract up to 2-3 words
  const words = cleaned.split(/\s+/).filter((w) => w.length > 1 && !/^\d+$/.test(w));
  if (words.length >= 2) {
    return `${words[0]} ${words[1]}`;
  }
  if (words.length === 1) {
    return words[0];
  }

  return "Divers";
}

/**
 * Parses user prompt to determine nested folder levels and their exact sequence.
 */
function parseHierarchyLevels(prompt: string): HierarchyLevel[] {
  const p = prompt.toLowerCase();
  const indices: { level: HierarchyLevel; index: number }[] = [];

  const yearMatch = p.match(/(année|annee|date|chronolog)/i);
  if (yearMatch && yearMatch.index !== undefined) {
    indices.push({ level: "YEAR", index: yearMatch.index });
  }

  const typeMatch = p.match(/(type|extension|format|catégorie|categorie)/i);
  if (typeMatch && typeMatch.index !== undefined) {
    indices.push({ level: "CATEGORY", index: typeMatch.index });
  }

  const nameMatch = p.match(/(nom|projet|sujet|client|thème|theme)/i);
  if (nameMatch && nameMatch.index !== undefined) {
    indices.push({ level: "SUBJECT", index: nameMatch.index });
  }

  // Sort by order of appearance in user's prompt
  indices.sort((a, b) => a.index - b.index);

  if (indices.length > 0) {
    return indices.map((i) => i.level);
  }

  // If user says "creer un dossier et creer un dossier dedans"
  if (p.includes("dedans") || p.includes("sous-dossier") || p.includes("imbriq")) {
    return ["YEAR", "CATEGORY", "SUBJECT"];
  }

  return [];
}

function detectIntent(prompt: string): IntentType {
  const p = prompt.toLowerCase().trim();

  if (
    /^(bonjour|salut|hello|coucou|qui es[- ]tu|aide[- ]moi|que sais[- ]tu faire)/i.test(p) ||
    p === "aide" ||
    p === "bonjour"
  ) {
    return "GREETING_HELP";
  }

  if (
    p.includes("gros") ||
    p.includes("lourd") ||
    p.includes("volumineux") ||
    p.includes("taille") ||
    p.includes("espace disque") ||
    p.includes("qui prend") ||
    p.includes("place")
  ) {
    return "BIGGEST_FILES";
  }

  if (
    p.includes("doublon") ||
    p.includes("temporaire") ||
    p.includes("verrou") ||
    p.includes("~$") ||
    p.includes("inutile") ||
    p.includes("clean")
  ) {
    return "TEMPORARY_DUPLICATES";
  }

  if (
    p.includes("sécur") ||
    p.includes("secur") ||
    p.includes("perte") ||
    p.includes("perdre") ||
    p.includes("supprim") ||
    p.includes("écras") ||
    p.includes("annul")
  ) {
    return "SECURITY_ROLLBACK";
  }

  if (
    p.includes("conseil") ||
    p.includes("recommand") ||
    p.includes("idée") ||
    p.includes("suggestion") ||
    p.includes("avis")
  ) {
    return "ADVICE_RECOMMENDATION";
  }

  if (
    p.includes("stat") ||
    p.includes("combien") ||
    p.includes("inventaire") ||
    p.includes("état des lieux") ||
    p.includes("résumé") ||
    p.includes("resume") ||
    p.includes("qu'est-ce qu'il y a")
  ) {
    return "STATS_OVERVIEW";
  }

  // Action queries: organize, sort, group, move, or hierarchical nesting!
  if (
    p.includes("trie") ||
    p.includes("trier") ||
    p.includes("range") ||
    p.includes("ranger") ||
    p.includes("organise") ||
    p.includes("organiser") ||
    p.includes("classe") ||
    p.includes("classer") ||
    p.includes("regroupe") ||
    p.includes("regrouper") ||
    p.includes("déplace") ||
    p.includes("deplacer") ||
    p.includes("mets") ||
    p.includes("mettre") ||
    p.includes("crée") ||
    p.includes("creer") ||
    p.includes("dossier") ||
    p.includes("par annee") ||
    p.includes("par année") ||
    p.includes("par type") ||
    p.includes("par nom") ||
    p.includes("dedans")
  ) {
    return "ACTION_ORGANIZE";
  }

  return "ACTION_ORGANIZE";
}

export class RuleEngineProvider implements IAIProvider {
  name = "DeskMind Local Engine";

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generateChatReply(context: AIWorkspaceContext, userPrompt: string): Promise<string> {
    const files = context.files;
    const totalCount = files.length;
    const intent = detectIntent(userPrompt);

    if (totalCount === 0) {
      return `Votre dossier de travail (**${context.workspaceRoot}**) est actuellement vide de fichiers à la racine.`;
    }

    if (intent === "GREETING_HELP") {
      return `Bonjour ! Je suis **DeskMind AI**, votre assistant d'organisation locale pour Windows.

J'ai analysé votre bureau actuel (**${totalCount} fichiers** détectés).
Vous pouvez me demander de trier simplement ou de **créer des dossiers imbriqués hiérarchiques** :
- *"Trie par année, par type de fichier et par nom"* $\rightarrow$ créera par exemple \`2026/Excel/Master Customer/...\`
- *"Regroupe uniquement mes classeurs Excel dans un dossier"*
- *"Quels sont mes fichiers les plus volumineux ?"*

Je vous présenterai toujours un aperçu clair avant toute exécution.`;
    }

    if (intent === "BIGGEST_FILES") {
      const sortedBySize = [...files].sort((a, b) => b.size - a.size).slice(0, 5);
      const totalSize = files.reduce((acc, f) => acc + f.size, 0);

      const listStr = sortedBySize
        .map(
          (f, idx) =>
            `${idx + 1}. **${f.name}** — \`${formatBytes(f.size)}\` *(${CATEGORY_LABELS[f.category]})*`
        )
        .join("\n");

      return `Voici les **5 fichiers les plus volumineux** sur votre bureau (sur un total de ${formatBytes(
        totalSize
      )}) :

${listStr}

💡 **Constat :** Les gros fichiers occupent la majeure partie de l'espace. Vous pouvez me demander de les regrouper dans un dossier *"Archives & Téléchargements"* pour désencombrer votre vue.`;
    }

    if (intent === "TEMPORARY_DUPLICATES") {
      const lockFiles = files.filter((f) => f.name.startsWith("~$"));
      return `### Analyse des fichiers temporaires :\n\n` +
        (lockFiles.length > 0
          ? `🔍 **Fichiers de verrouillage Office détectés (${lockFiles.length}) :**\nCes fichiers \`~$\` sont générés par Word/Excel lorsqu'un classeur est ouvert. Pour éviter toute corruption, DeskMind ne les déplace jamais.\n`
          : `✅ Aucun fichier de verrouillage temporaire (\`~$\`) détecté sur votre bureau.\n`);
    }

    if (intent === "SECURITY_ROLLBACK") {
      return `### Vos garanties de sécurité avec DeskMind AI :

1. **Aucun écrasement :** Si un fichier existe déjà au même nom dans le dossier cible, un suffixe de sécurité comme \`(1)\` est automatiquement ajouté.
2. **Restauration en 1 clic :** Toutes les opérations sont consignées dans l'onglet **Historique**. Vous pouvez annuler et tout replacer à l'origine à tout moment.
3. **Périmètre cloisonné :** Les opérations sont strictement limitées à votre dossier autorisé (**${context.workspaceRoot}**).`;
    }

    if (intent === "ADVICE_RECOMMENDATION") {
      const excelCount = files.filter((f) => f.category === "EXCEL").length;
      return `Pour organiser vos **${totalCount} fichiers**, je vous recommande une structure hiérarchique :

1. 📂 **Par année, par type puis par projet :**
   Exemple : \`2026/Excel/Master Customer/\` ou \`2026/Excel/Colisages/\`.
2. 📄 **Isoler les documents de référence :**
   Placer les PDF et Word dans \`2026/Documents/\`.

Voulez-vous que je crée cette arborescence ? Dites simplement : *"Trie par année, par type et par nom"* !`;
    }

    // Action execution response
    const plan = await this.generatePlan(context, userPrompt);
    const opCount = plan ? plan.operations.length : 0;

    if (opCount === 0) {
      return `J'ai bien compris votre demande ("*${userPrompt}*"), mais aucun fichier ne correspond aux critères indiqués ou ils sont déjà correctement placés.`;
    }

    // Detect distinct target folder trees
    const targetTrees = new Set<string>();
    for (const op of plan!.operations) {
      const relativeDest = path.relative(context.workspaceRoot, op.destination);
      const parentDir = path.dirname(relativeDest);
      if (parentDir && parentDir !== ".") {
        targetTrees.add(parentDir.replace(/\\/g, "/"));
      }
    }

    const treeSample = Array.from(targetTrees).slice(0, 5);
    const hierarchyLevels = parseHierarchyLevels(userPrompt);

    return `J'ai parfaitement compris votre demande : **"${userPrompt}"** !

${
  hierarchyLevels.length > 1
    ? `✨ **Arborescence hiérarchique détectée (${hierarchyLevels.map((l) => (l === "YEAR" ? "Année" : l === "CATEGORY" ? "Type" : "Nom/Projet")).join(" ➔ ")}) :**\n`
    : ""
}
J'ai sélectionné **${opCount} fichier(s)** et préparé la création des dossiers imbriqués correspondants.

📁 **Exemples de dossiers imbriqués qui seront créés :**
${treeSample.map((t) => `- \`${t}/\``).join("\n")}
${targetTrees.size > 5 ? `- *... et ${targetTrees.size - 5} autre(s) sous-dossier(s)*` : ""}

Cliquez sur **"Examiner et Valider ce plan"** ci-dessous pour inspecter les déplacements prévus et lancer l'exécution en toute sécurité !`;
  }

  async generatePlan(context: AIWorkspaceContext, userPrompt: string): Promise<OperationPlan | null> {
    const intent = detectIntent(userPrompt);
    if (intent !== "ACTION_ORGANIZE") {
      return null;
    }

    const prompt = userPrompt.toLowerCase();
    const operations: FileOperation[] = [];
    const root = context.workspaceRoot;

    // Detect hierarchy levels requested by user
    const hierarchyLevels = parseHierarchyLevels(userPrompt);

    // Filter scope
    const filterExcel = prompt.includes("excel") || prompt.includes("tableur") || prompt.includes("csv");
    const filterPdf = prompt.includes("pdf");
    const filterImages = prompt.includes("image") || prompt.includes("photo");
    const filterDev = prompt.includes("code") || prompt.includes("dev") || prompt.includes("sql");
    const filterShortcuts = prompt.includes("raccourci") || prompt.includes(".lnk");
    const filterArchives = prompt.includes("archive") || prompt.includes("zip") || prompt.includes("7z");
    const filterDocs = prompt.includes("word") || prompt.includes("document");

    // Specific subject filter if user asked for a specific entity
    let specificSubjectFilter = "";
    if (prompt.includes("master customer")) specificSubjectFilter = "master customer";
    else if (prompt.includes("colisage")) specificSubjectFilter = "colisage";
    else if (prompt.includes("sfxeguce")) specificSubjectFilter = "sfxeguce";
    else if (prompt.includes("guce")) specificSubjectFilter = "guce";
    else if (prompt.includes("brainopx")) specificSubjectFilter = "brainopx";

    // Has user restricted scope to one category or keyword?
    const hasCategoryRestriction =
      filterExcel || filterPdf || filterImages || filterDev || filterShortcuts || filterArchives || filterDocs;

    for (const file of context.files) {
      if (file.isDirectory || file.name.startsWith("~$")) continue;

      // Check category filter if restricted
      if (hasCategoryRestriction) {
        if (filterExcel && file.category !== "EXCEL") continue;
        if (filterPdf && file.category !== "PDF") continue;
        if (filterImages && file.category !== "IMAGES") continue;
        if (filterDev && file.category !== "DEVELOPPEMENT") continue;
        if (filterShortcuts && file.category !== "RACCOURCIS") continue;
        if (filterArchives && file.category !== "ARCHIVES") continue;
        if (filterDocs && file.category !== "DOCUMENTS") continue;
      }

      // Check subject filter if restricted
      if (specificSubjectFilter && !file.name.toLowerCase().includes(specificSubjectFilter)) {
        continue;
      }

      // Construct nested folders path
      const pathSegments: string[] = [];
      const fileYear = new Date(file.modifiedAt).getFullYear().toString();
      const fileCategoryShort = CATEGORY_SHORT_NAMES[file.category] || "Divers";
      const fileSubject = extractFileSubject(file.name);

      if (hierarchyLevels.length > 0) {
        // Build multi-level directory according to user's specified order!
        for (const level of hierarchyLevels) {
          if (level === "YEAR") {
            pathSegments.push(fileYear);
          } else if (level === "CATEGORY") {
            pathSegments.push(fileCategoryShort);
          } else if (level === "SUBJECT") {
            pathSegments.push(fileSubject);
          }
        }
      } else {
        // Fallback standard organization
        if (prompt.includes("année") || prompt.includes("annee") || prompt.includes("date")) {
          pathSegments.push(fileYear);
        }
        if (prompt.includes("nom") || prompt.includes("projet") || prompt.includes("sujet")) {
          pathSegments.push(fileSubject);
        } else {
          pathSegments.push(fileCategoryShort);
        }
      }

      const targetSubdir = path.join(...pathSegments);
      const destination = path.join(root, targetSubdir, file.name);

      if (path.resolve(file.path) !== path.resolve(destination)) {
        operations.push({
          id: crypto.randomUUID(),
          type: "MOVE",
          source: file.path,
          destination,
          reason: `Classement hiérarchique dans ${pathSegments.join(" / ")}`,
          status: "PENDING",
          selected: true,
        });
      }
    }

    if (operations.length === 0) {
      return null;
    }

    return {
      id: crypto.randomUUID(),
      title: `Plan hiérarchique : ${userPrompt.slice(0, 45)}`,
      description: `Création des dossiers imbriqués et classement de ${operations.length} fichier(s).`,
      operations,
      createdAt: new Date().toISOString(),
    };
  }
}
