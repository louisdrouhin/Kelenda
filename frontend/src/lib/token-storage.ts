const ACCESS_TOKEN_KEY = 'kelenda.access_token'
const REFRESH_TOKEN_KEY = 'kelenda.refresh_token'

export interface TokenPair {
  access_token: string
  refresh_token: string
}

export const tokenStorage = {
  get(): TokenPair | null {
    const access_token = localStorage.getItem(ACCESS_TOKEN_KEY)
    const refresh_token = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!access_token || !refresh_token) return null
    return { access_token, refresh_token }
  },
  set(tokens: TokenPair): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
  },
  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}
