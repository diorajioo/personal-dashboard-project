import { NextResponse } from 'next/server'
import type { NewsItem } from '@/types'

const FEEDS = [
  { url: 'https://feeds.kontan.co.id/kanal/investasi', source: 'Kontan', category: 'Indonesia' },
  { url: 'https://www.cnbcindonesia.com/rss', source: 'CNBC Indonesia', category: 'Markets' },
  { url: 'https://feeds.feedburner.com/techcrunch/startups', source: 'TechCrunch', category: 'Tech' },
  { url: 'https://coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk', category: 'Crypto' },
  { url: 'https://www.theverge.com/rss/index.xml', source: 'The Verge', category: 'Tech' },
]

async function parseFeed(feedUrl: string, source: string, category: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 900 }, // 15 min cache
      signal: AbortSignal.timeout(4000),
    })
    const xml = await res.text()

    // Simple XML parser — no external lib needed
    const items: NewsItem[] = []
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)

    for (const match of itemMatches) {
      const block = match[1]
      const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] || ''
      const link = block.match(/<link>(.*?)<\/link>|<guid[^>]*>(.*?)<\/guid>/)?.[1] || ''
      const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString()

      if (title) {
        items.push({
          id: `${source}-${link}`,
          title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim(),
          source,
          category,
          publishedAt: pubDate,
          url: link.trim(),
        })
      }
      if (items.length >= 3) break
    }

    return items
  } catch {
    return []
  }
}

// GET /api/news
export async function GET() {
  try {
    const results = await Promise.allSettled(
      FEEDS.map(f => parseFeed(f.url, f.source, f.category))
    )

    const allNews: NewsItem[] = results
      .flatMap(r => r.status === 'fulfilled' ? r.value : [])
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 8)

    // Fallback mock if all feeds fail
    if (allNews.length === 0) {
      return NextResponse.json({ news: getMockNews() })
    }

    return NextResponse.json({ news: allNews })
  } catch (err) {
    return NextResponse.json({ news: getMockNews() })
  }
}

function getMockNews(): NewsItem[] {
  return [
    { id: '1', title: 'IHSG closes at 7,248 — consumer sector leads gains', source: 'Kontan', category: 'Indonesia', publishedAt: new Date(Date.now() - 7200000).toISOString(), url: '#' },
    { id: '2', title: 'OpenAI announces GPT-5 with 1M token context window', source: 'The Verge', category: 'Tech', publishedAt: new Date(Date.now() - 14400000).toISOString(), url: '#' },
    { id: '3', title: 'Bitcoin crosses $109k as institutional inflows accelerate', source: 'CoinDesk', category: 'Crypto', publishedAt: new Date(Date.now() - 18000000).toISOString(), url: '#' },
    { id: '4', title: 'Bank Indonesia holds rate at 5.75% for third straight month', source: 'CNBC Indonesia', category: 'Markets', publishedAt: new Date(Date.now() - 86400000).toISOString(), url: '#' },
    { id: '5', title: "Indonesia's startup ecosystem attracts $2.1B in Q1 2025", source: 'TechCrunch', category: 'Tech', publishedAt: new Date(Date.now() - 90000000).toISOString(), url: '#' },
  ]
}
