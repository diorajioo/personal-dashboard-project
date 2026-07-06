// types/next-auth.d.ts
import 'next-auth'
import 'next-auth/jwt'

interface ProviderTokens {
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
  error?: string
}

declare module 'next-auth' {
  interface Session {
    spotify?: ProviderTokens
    google?: ProviderTokens
    microsoft?: ProviderTokens
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    spotify?: ProviderTokens
    google?: ProviderTokens
    'azure-ad'?: ProviderTokens
  }
}