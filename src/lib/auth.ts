import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import MicrosoftProvider from 'next-auth/providers/azure-ad'
import SpotifyProvider from 'next-auth/providers/spotify'

const SPOTIFY_SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-recently-played',
  'playlist-read-private',
].join(' ')

const GOOGLE_SCOPES = [
  'openid', 'email', 'profile',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/calendar.readonly',
].join(' ')

const MICROSOFT_SCOPES = [
  'openid', 'email', 'profile', 'offline_access',
  'Mail.Read', 'Calendars.Read',
].join(' ')

async function refreshSpotifyToken(refreshToken: string) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' +
        Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw data
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken, // Spotify may not always return a new one
    expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: { scope: GOOGLE_SCOPES, access_type: 'offline', prompt: 'consent' },
      },
    }),
    MicrosoftProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID,
      authorization: { params: { scope: MICROSOFT_SCOPES } },
    }),
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: { params: { scope: SPOTIFY_SCOPES } },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign-in for a given provider: store its tokens under its own key
      if (account) {
        token[account.provider] = {
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        }
      }

      // Refresh Spotify token if expired
      const spotify = token.spotify as any
      if (spotify?.expiresAt && Date.now() / 1000 > spotify.expiresAt) {
        try {
          token.spotify = await refreshSpotifyToken(spotify.refreshToken)
        } catch (err) {
          console.error('Failed to refresh Spotify token', err)
          token.spotify = { ...spotify, error: 'RefreshFailed' }
        }
      }

      return token
    },
    async session({ session, token }) {
      session.spotify = token.spotify as any
      session.google = token.google as any
      session.microsoft = token['azure-ad'] as any // azure-ad is the actual provider id
      return session
    },
  },
  pages: { signIn: '/auth/signin' },
  secret: process.env.NEXTAUTH_SECRET,
}