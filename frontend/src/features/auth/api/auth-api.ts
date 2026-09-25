import { isAxiosError } from 'axios'
import { http } from '../../../lib/http'
import type { TokenPair } from '../../../lib/token-storage'

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_API_URL ?? '/auth'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  workspace_name: string
  display_name?: string
}

export interface CurrentUser {
  id: string
  workspace_id: string
  email: string
  display_name: string | null
  role: 'admin' | 'member'
  status: string
  created_at: string
}

export async function login(payload: LoginPayload): Promise<TokenPair> {
  const { data } = await http.post<TokenPair>(`${AUTH_BASE_URL}/login`, payload)
  return data
}

export async function register(payload: RegisterPayload): Promise<{ id: string; email: string; workspace_id: string }> {
  const { data } = await http.post(`${AUTH_BASE_URL}/register`, payload)
  return data
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const { data } = await http.get<CurrentUser>(`${AUTH_BASE_URL}/me`)
  return data
}

export async function logout(refresh_token: string): Promise<void> {
  await http.post(`${AUTH_BASE_URL}/logout`, { refresh_token })
}

// Échange le code temporaire reçu sur /oauth/callback?code=... (après un
// login OAuth réussi côté auth-service) contre les vrais tokens. Usage
// unique côté serveur — un second appel avec le même code échoue en 401.
export async function exchangeOAuthCode(code: string): Promise<TokenPair> {
  const { data } = await http.post<TokenPair>(`${AUTH_BASE_URL}/exchange`, { code })
  return data
}

// POST /auth/register répond 409 quand l'email est déjà pris (contrainte
// unique en base) — pas d'endpoint dédié de vérification pour éviter
// d'exposer un moyen d'énumérer les comptes existants.
export function isEmailAlreadyUsedError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 409
}
