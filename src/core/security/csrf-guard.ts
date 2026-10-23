import crypto from "node:crypto";
import { headers } from "next/headers";

// Ephemeral in-memory security token generated per server run
const SERVER_SESSION_TOKEN = crypto.randomBytes(24).toString("hex");

/**
 * Returns the current active session token for legitimate local UI clients.
 */
export function getActiveSessionToken(): string {
  return SERVER_SESSION_TOKEN;
}

/**
 * Validates request origin and local session token.
 * Prevents Cross-Site Request Forgery (CSRF) and unauthorized access from other web pages.
 */
export async function validateLocalRequest(options?: { requireToken?: boolean }): Promise<void> {
  const headerList = await headers();
  const host = headerList.get("host") || "";
  const origin = headerList.get("origin");
  const referer = headerList.get("referer");

  // Validate Host is localhost or Vercel deployment
  const isVercel =
    Boolean(process.env.VERCEL) ||
    host.endsWith("vercel.app") ||
    (origin ? new URL(origin).hostname.endsWith("vercel.app") : false);

  const isLocalHost =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::1]");

  if (!isLocalHost && !isVercel) {
    throw new Error("Accès réseau non autorisé : Seules les connexions locales sont permises.");
  }

  // If origin is present, ensure it's local or Vercel
  if (origin) {
    const originUrl = new URL(origin);
    const isOriginLocal =
      originUrl.hostname === "localhost" ||
      originUrl.hostname === "127.0.0.1" ||
      originUrl.hostname === "::1" ||
      originUrl.hostname.endsWith("vercel.app");

    if (!isOriginLocal && !isVercel) {
      throw new Error(`Origine de requête non autorisée (${origin}).`);
    }
  }

  // Token check for mutation endpoints if required
  if (options?.requireToken) {
    const providedToken = headerList.get("x-deskmind-token");
    if (!providedToken || providedToken !== SERVER_SESSION_TOKEN) {
      throw new Error("Jeton de sécurité local manquant ou invalide.");
    }
  }
}
