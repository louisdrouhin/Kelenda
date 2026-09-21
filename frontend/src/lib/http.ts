import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { tokenStorage, type TokenPair } from './token-storage'

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_API_URL ?? '/auth'

export const http = axios.create()

http.interceptors.request.use((config) => {
  const tokens = tokenStorage.get()
  if (tokens) {
    config.headers.Authorization = `Bearer ${tokens.access_token}`
  }
  return config
})

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

// Le refresh token tourne à chaque appel POST /auth/refresh (l'ancien est
// révoqué côté serveur) : deux 401 concurrents ne doivent déclencher qu'un
// seul refresh, les autres attendent le même résultat.
let refreshPromise: Promise<TokenPair> | null = null

async function refreshTokens(): Promise<TokenPair> {
  const current = tokenStorage.get()
  if (!current) throw new Error('no refresh token available')

  const { data } = await axios.post<TokenPair>(`${AUTH_BASE_URL}/refresh`, {
    refresh_token: current.refresh_token,
  })
  tokenStorage.set(data)
  return data
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined

    if (error.response?.status !== 401 || !config || config._retried) {
      if (error.response?.status === 401) {
        tokenStorage.clear()
      }
      return Promise.reject(error)
    }

    config._retried = true

    try {
      refreshPromise ??= refreshTokens().finally(() => {
        refreshPromise = null
      })
      const tokens = await refreshPromise
      config.headers.Authorization = `Bearer ${tokens.access_token}`
      return http(config)
    } catch (refreshError) {
      tokenStorage.clear()
      return Promise.reject(refreshError)
    }
  },
)
