# Dio's Personal Dashboard

A personal life dashboard built with Next.js 14, deployable to Vercel for free.

## Features
- **Finance** — Google Sheets sync, expense tracker, savings goals, free OCR receipt scanning
- **Spotify** — Now playing, controls, queue preview
- **Weather** — Open-Meteo (100% free, no key), auto-location
- **Meetings** — Outlook Calendar via Microsoft Graph
- **Tasks** — Notion database sync
- **Inbox** — Outlook email via Microsoft Graph
- **Stocks** — IDX watchlist via Twelve Data + crypto via CoinGecko
- **Health** — Garmin/Apple Health push integration
- **News** — RSS feeds (no key required)
- **AI Agent** — Groq Llama 3.3 (free tier), context-aware

---

## Setup

### 1. Clone & install
```bash
git clone https://github.com/yourusername/dio-dashboard
cd dio-dashboard
npm install
```

### 2. Environment variables
```bash
cp .env.local.example .env.local
```
Fill in each key — see instructions below.

### 3. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

---

## Getting API Keys

### Google (Sheets + Calendar)
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable **Google Sheets API** and **Google Calendar API**
3. OAuth 2.0 credentials → Web application
4. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID + Secret to `.env.local`
6. Set `GOOGLE_SHEETS_ID` = the long ID in your GSheet URL

**GSheet structure expected:**
- Sheet named `Expenses` — columns: A=Date, B=Description, C=Category, D=Amount
- Sheet named `Savings` — columns: A=Goal Name, B=Current Amount, C=Target Amount (optional)

### Microsoft (Outlook + Calendar)
1. Go to [portal.azure.com](https://portal.azure.com) → Azure Active Directory → App registrations
2. New registration → Web → Redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`
3. Certificates & secrets → New client secret
4. API permissions → Add: `Mail.Read`, `Calendars.Read`, `offline_access`

### Spotify
1. Go to [developer.spotify.com](https://developer.spotify.com/dashboard)
2. Create app → Redirect URI: `http://localhost:3000/api/auth/callback/spotify`
3. Note: Playback controls require Spotify Premium on your account

### Notion
1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. New integration → copy the token
3. Open your Tasks database → Share → invite your integration
4. Copy the database ID from the URL: `notion.so/workspace/[DATABASE_ID]?v=...`

**Tasks database columns expected:**
- `Name` (title), `Status` (status: Open/In Progress/Done), `Due` (date), `Priority` (select)

### Twelve Data (Stocks)
1. Register at [twelvedata.com](https://twelvedata.com)
2. Free tier: 800 API calls/day — plenty for personal use
3. Copy your API key

### Groq (AI Agent — free)
1. Register at [console.groq.com](https://console.groq.com)
2. Create API key — free tier is generous

### Health data (Garmin/Apple)
**Apple Health via iOS Shortcuts:**
1. Set `HEALTH_PUSH_TOKEN` to any random string (your secret)
2. Create an iOS Shortcut that runs daily:
   - Get Health Samples (Steps, Sleep, Heart Rate, Active Energy)
   - Get Contents of URL (POST to `your-domain.vercel.app/api/health`)
   - Headers: `x-health-token: your-token-here`
   - Body: `{"steps": ..., "calories": ..., "sleepHours": ..., "heartRate": ...}`

---

## Deploy to Vercel (free)

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo at [vercel.com/new](https://vercel.com/new).

Add all env variables in Vercel dashboard → Project Settings → Environment Variables.

Update OAuth redirect URIs to your Vercel domain (e.g. `https://dio-dashboard.vercel.app/api/auth/callback/...`).

---

## Cost breakdown
| Service | Cost |
|---|---|
| Vercel hosting | $0 (Hobby plan) |
| Supabase (optional, for persistent storage) | $0 (free tier) |
| Google APIs | $0 |
| Microsoft Graph | $0 |
| Spotify API | $0 |
| Notion API | $0 |
| Open-Meteo (weather) | $0 forever |
| Twelve Data (stocks) | $0 (800 calls/day free) |
| CoinGecko (crypto) | $0 |
| Groq AI | $0 (free tier) |
| News RSS | $0 |
| **Total** | **$0/month** |
