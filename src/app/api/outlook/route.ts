import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import type { Email, CalendarEvent } from '@/types'

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'

async function graphFetch(endpoint: string, token: string) {
  const res = await fetch(`${GRAPH_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Graph API ${res.status}`)
  return res.json()
}

function detectPlatform(event: any): CalendarEvent['platform'] {
  const body = (event.body?.content || '').toLowerCase()
  const loc = (event.location?.displayName || '').toLowerCase()
  const url = event.onlineMeeting?.joinUrl || ''
  if (url.includes('teams') || loc.includes('teams') || body.includes('teams')) return 'teams'
  if (url.includes('zoom') || loc.includes('zoom') || body.includes('zoom')) return 'zoom'
  if (url.includes('meet.google') || body.includes('google meet')) return 'meet'
  return 'other'
}

// GET /api/outlook — inbox + today's calendar
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken || session.provider !== 'azure-ad') {
    return NextResponse.json({ error: 'Outlook not connected' }, { status: 401 })
  }

  const token = session.accessToken
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  try {
    const [mailData, calData] = await Promise.all([
      graphFetch(
        `/me/messages?$top=8&$orderby=receivedDateTime desc&$select=id,from,subject,bodyPreview,receivedDateTime,isRead,webLink`,
        token
      ),
      graphFetch(
        `/me/calendarView?startDateTime=${todayStart.toISOString()}&endDateTime=${todayEnd.toISOString()}&$select=id,subject,start,end,location,body,onlineMeeting&$orderby=start/dateTime`,
        token
      ),
    ])

    const emails: Email[] = (mailData.value || []).map((m: any) => ({
      id: m.id,
      from: m.from?.emailAddress?.name || m.from?.emailAddress?.address || 'Unknown',
      subject: m.subject || '(no subject)',
      preview: m.bodyPreview || '',
      receivedAt: m.receivedDateTime,
      isRead: m.isRead,
      webLink: m.webLink,
    }))

    const events: CalendarEvent[] = (calData.value || []).map((e: any) => ({
      id: e.id,
      title: e.subject || 'Untitled',
      start: e.start.dateTime,
      end: e.end.dateTime,
      platform: detectPlatform(e),
      joinUrl: e.onlineMeeting?.joinUrl,
    }))

    return NextResponse.json({ emails, events })
  } catch (err) {
    console.error('Outlook error:', err)
    return NextResponse.json({ error: 'Failed to fetch Outlook data' }, { status: 500 })
  }
}
