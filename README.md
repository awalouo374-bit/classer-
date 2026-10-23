# 🧠 DeskMind AI

> **Assistant intelligent d'organisation de bureau Windows** — Classez vos fichiers avec un chatbot en langage naturel, en toute sécurité.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8?logo=tailwindcss)

---

## ✨ Fonctionnalités

- **🗂️ Tableau de bord** — Aperçu visuel des fichiers du bureau avec statistiques par catégorie
- **💬 Chatbot IA** — Posez vos questions en français et organisez vos fichiers en langage naturel
- **📁 Dossiers hiérarchiques** — Création intelligente de dossiers imbriqués (par année, type, projet)
- **🔍 Analyse automatique** — Détection des catégories, fichiers volumineux, fichiers temporaires
- **✅ Confirmation avant exécution** — Aperçu complet du plan avant tout déplacement
- **⏪ Rollback intégré** — Annulation en 1 clic de n'importe quelle opération passée
- **🔒 Sécurité renforcée** — Protection contre le directory traversal, CSRF, et les écrasements

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ et npm

### Installation

```bash
git clone https://github.com/VOTRE_USER/deskmind-ai.git
cd deskmind-ai
npm install
npm run dev
```

L'application démarre sur [http://localhost:3000](http://localhost:3000).

### Mode Démo (Vercel)

Sur Vercel, l'application fonctionne automatiquement en **mode démo** avec des fichiers simulés. Toutes les fonctionnalités du chatbot sont pleinement opérationnelles.

## 🏗️ Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes (chat, workspace, operations)
│   └── page.tsx            # Page principale
├── components/             # Composants React
│   ├── chat/               # Interface chatbot
│   ├── dashboard/          # Tableaux de bord et statistiques
│   ├── history/            # Historique et rollback
│   ├── layout/             # Sidebar, Header
│   └── staging/            # Modal de confirmation
├── core/                   # Logique métier
│   ├── ai/                 # Moteur IA (Rule Engine, Ollama, Cloud)
│   ├── fs/                 # Scanner, Executor, Catégorisation
│   ├── ledger/             # Historique et restauration
│   ├── schemas/            # Schémas Zod
│   └── security/           # PathGuard, CSRF Guard
├── lib/                    # Utilitaires
└── types/                  # Types TypeScript
```

## 🤖 Fournisseurs IA

| Fournisseur | Mode | Configuration |
|---|---|---|
| **Rule Engine** | Offline (par défaut) | Aucune configuration requise |
| **Ollama** | Local | Installer [Ollama](https://ollama.ai) |
| **OpenAI** | Cloud | Variable `OPENAI_API_KEY` |
| **Groq** | Cloud | Variable `GROQ_API_KEY` |
| **OpenRouter** | Cloud | Clé API dans le chat |

## 🔐 Sécurité

- **PathGuard** : Validation canonique des chemins, blocage du directory traversal
- **CSRF Guard** : Vérification d'origine locale, jeton de session éphémère
- **Aucun écrasement** : Suffixe de sécurité automatique en cas de conflit de noms
- **Périmètre cloisonné** : Opérations strictement limitées au dossier autorisé

## 📜 Licence

MIT © DeskMind AI
