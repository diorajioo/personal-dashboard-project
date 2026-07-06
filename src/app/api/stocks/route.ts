import { NextResponse } from 'next/server'
import type { StockQuote } from '@/types'

const IDX_TICKERS = ['IHSG', 'BBCA', 'ANTM', 'BMRI', 'BBRI']
const CRYPTO_IDS = ['bitcoin', 'ethereum']

// Map IHSG to the actual Twelve Data symbol
const SYMBOL_MAP: Record<string, string> = {
  IHSG: 'IDX:COMPOSITE',
  BBCA: 'BBCA.JK',
  ANTM: 'ANTM.JK',
  BMRI: 'BMRI.JK',
  BBRI: 'BBRI.JK',
}

async function fetchIDXQuotes(): Promise<StockQuote[]> {
  const apiKey = process.env.TWELVE_DATA_API_KEY
  if (!apiKey) return getMockIDX()

  try {
    // Batch request — Twelve Data supports comma-separated symbols
    const symbols = IDX_TICKERS.map(t => SYMBOL_MAP[t]).join(',')
    const [quoteRes, sparkRes] = await Promise.all([
      fetch(`https://api.twelvedata.com/quote?symbol=${symbols}&apikey=${apiKey}`),
      fetch(`https://api.twelvedata.com/time_series?symbol=${symbols}&interval=1day&outputsize=6&apikey=${apiKey}`),
    ])

    const quotes = await quoteRes.json()
    const sparks = await sparkRes.json()

    return IDX_TICKERS.map((ticker, i) => {
      const sym = SYMBOL_MAP[ticker]
      const q = Array.isArray(quotes) ? quotes[i] : quotes[sym] || quotes
      const s = sparks[sym] || sparks

      const sparkline = (s?.values || [])
        .slice(0, 6)
        .reverse()
        .map((v: any) => parseFloat(v.close))

      return {
        symbol: ticker,
        name: getIDXName(ticker),
        price: parseFloat(q?.close || q?.price || 0),
        change: parseFloat(q?.change || 0),
        changePct: parseFloat(q?.percent_change || 0),
        sparkline,
        currency: 'IDR',
      }
    })
  } catch {
    return getMockIDX()
  }
}

async function fetchCrypto(): Promise<StockQuote[]> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${CRYPTO_IDS.join(',')}&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 300 } }
    )
    const data = await res.json()

    return [
      {
        symbol: 'BTC', name: 'Bitcoin',
        price: data.bitcoin?.usd || 0,
        change: 0,
        changePct: data.bitcoin?.usd_24h_change || 0,
        sparkline: [],
        currency: 'USD',
      },
      {
        symbol: 'ETH', name: 'Ethereum',
        price: data.ethereum?.usd || 0,
        change: 0,
        changePct: data.ethereum?.usd_24h_change || 0,
        sparkline: [],
        currency: 'USD',
      },
    ]
  } catch {
    return getMockCrypto()
  }
}

// GET /api/stocks
export async function GET() {
  const [idx, crypto] = await Promise.all([fetchIDXQuotes(), fetchCrypto()])
  return NextResponse.json({ idx, crypto }, { headers: { 'Cache-Control': 's-maxage=300' } })
}

function getIDXName(ticker: string): string {
  const names: Record<string, string> = {
    IHSG: 'Composite Index',
    BBCA: 'Bank Central Asia',
    ANTM: 'Aneka Tambang',
    BMRI: 'Bank Mandiri',
    BBRI: 'Bank Rakyat Indonesia',
  }
  return names[ticker] || ticker
}

function getMockIDX(): StockQuote[] {
  return [
    { symbol: 'IHSG', name: 'Composite Index',       price: 7248,  change: 59,   changePct: 0.82,  sparkline: [7100,7150,7120,7180,7200,7248], currency: 'IDR' },
    { symbol: 'BBCA', name: 'Bank Central Asia',      price: 9475,  change: 112,  changePct: 1.2,   sparkline: [9200,9280,9310,9350,9400,9475], currency: 'IDR' },
    { symbol: 'ANTM', name: 'Aneka Tambang',          price: 1630,  change: -25,  changePct: -1.5,  sparkline: [1720,1700,1680,1665,1645,1630], currency: 'IDR' },
    { symbol: 'BMRI', name: 'Bank Mandiri',           price: 5950,  change: 30,   changePct: 0.5,   sparkline: [5850,5880,5900,5890,5930,5950], currency: 'IDR' },
    { symbol: 'BBRI', name: 'Bank Rakyat Indonesia',  price: 4090,  change: -29,  changePct: -0.7,  sparkline: [4180,4160,4150,4130,4110,4090], currency: 'IDR' },
  ]
}

function getMockCrypto(): StockQuote[] {
  return [
    { symbol: 'BTC', name: 'Bitcoin',   price: 109210, change: 0, changePct: 2.1,  sparkline: [], currency: 'USD' },
    { symbol: 'ETH', name: 'Ethereum',  price: 2608,   change: 0, changePct: -0.8, sparkline: [], currency: 'USD' },
  ]
}
