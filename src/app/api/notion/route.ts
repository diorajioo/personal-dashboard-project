import { NextRequest, NextResponse } from 'next/server'
import type { Task } from '@/types'

const NOTION_BASE = 'https://api.notion.com/v1'
const headers = {
  Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
}

function parseStatus(page: any): Task['status'] {
  const status = page.properties?.Status?.status?.name?.toLowerCase() || ''
  const dueDate = page.properties?.Due?.date?.start
  if (status === 'done' || status === 'complete' || status === 'completed') return 'done'
  if (dueDate && new Date(dueDate) < new Date()) return 'overdue'
  return 'open'
}

// GET /api/notion — fetch tasks from Notion DB
export async function GET() {
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
    return NextResponse.json({ error: 'Notion not configured' }, { status: 501 })
  }

  try {
    const res = await fetch(`${NOTION_BASE}/databases/${process.env.NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sorts: [{ property: 'Due', direction: 'ascending' }],
        page_size: 20,
      }),
    })

    if (!res.ok) throw new Error(`Notion ${res.status}`)
    const data = await res.json()

    const tasks: Task[] = (data.results || []).map((page: any) => ({
      id: page.id,
      title: page.properties?.Name?.title?.[0]?.plain_text || 'Untitled',
      status: parseStatus(page),
      dueDate: page.properties?.Due?.date?.start,
      priority: page.properties?.Priority?.select?.name?.toLowerCase(),
      notionUrl: page.url,
    }))

    return NextResponse.json({ tasks })
  } catch (err) {
    console.error('Notion error:', err)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// PATCH /api/notion — update task status
export async function PATCH(req: NextRequest) {
  try {
    const { pageId, status } = await req.json()

    await fetch(`${NOTION_BASE}/pages/${pageId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        properties: {
          Status: { status: { name: status === 'done' ? 'Done' : 'In Progress' } },
        },
      }),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Notion PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}
