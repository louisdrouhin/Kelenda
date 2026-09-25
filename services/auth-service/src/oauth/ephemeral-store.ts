// Stockage en mémoire process, à courte durée de vie, pour deux usages du
// flux OAuth : le paramètre `state` (anti-CSRF, entre la redirection vers le
// provider et son retour) et le code d'échange à usage unique (entre le
// callback backend et l'échange contre les vrais tokens côté frontend).
// Suffisant en MVP mono-instance ; à remplacer par Redis si auth-service est
// un jour scalé horizontalement (le state/code émis par une instance
// devrait être vérifiable par une autre).
interface StoredEntry<T> {
  value: T;
  expiresAt: number;
}

class EphemeralStore<T> {
  private entries = new Map<string, StoredEntry<T>>();

  constructor(private readonly ttlMs: number) {}

  set(key: string, value: T): void {
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  // Usage unique : une lecture consomme l'entrée, qu'elle soit valide ou expirée.
  take(key: string): T | undefined {
    const entry = this.entries.get(key);
    this.entries.delete(key);
    if (!entry || entry.expiresAt < Date.now()) return undefined;
    return entry.value;
  }
}

// state : durée de vie généreuse (l'utilisateur peut mettre du temps sur
// l'écran de consentement Microsoft/Google/GitHub).
export const oauthStateStore = new EphemeralStore<{ provider: string }>(10 * 60 * 1000);

// code d'échange : usage unique quasi immédiat (redirection navigateur puis
// appel API synchrone depuis le frontend) — 60s est largement suffisant et
// limite la fenêtre d'exposition si l'URL de redirection fuitait (logs, etc.).
export const oauthExchangeCodeStore = new EphemeralStore<{
  access_token: string;
  refresh_token: string;
}>(60 * 1000);
