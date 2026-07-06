import { NextResponse } from 'next/server'

// Garmin has no official public API.
// Options:
//   1. garmin-connect npm package (unofficial, may break)
//   2. Export from Garmin Connect app + store in Supabase
//   3. Apple Health → Shortcuts → POST to this endpoint
//
// This route accepts both: a POST from your phone's automation,
// and a GET that returns the latest stored values from env/db.

let cachedHealth = {
  steps: 0,
  stepsGoal: 10000,
  calories: 0,
  sleepHours: 0,
  heartRate: 0,
  activityPct: 0,
  updatedAt: null as string | null,
}

// GET /api/health
export async function GET() {
  // If no data has been pushed yet, return demo values
  if (!cachedHealth.updatedAt) {
    return NextResponse.json({
      steps: 7840,
      stepsGoal: 10000,
      calories: 1640,
      sleepHours: 7.33,
      heartRate: 72,
      activityPct: 78,
      updatedAt: new Date().toISOString(),
      source: 'demo',
    })
  }
  return NextResponse.json(cachedHealth)
}

// POST /api/health — push from Apple Shortcuts or Garmin automation
// Set up an iOS Shortcut: Health → Get Steps → POST to your-domain/api/health
export async function POST(req: Request) {
  const auth = req.headers.get('x-health-token')
  if (auth !== process.env.HEALTH_PUSH_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    cachedHealth = {
      steps: body.steps ?? cachedHealth.steps,
      stepsGoal: body.stepsGoal ?? cachedHealth.stepsGoal,
      calories: body.calories ?? cachedHealth.calories,
      sleepHours: body.sleepHours ?? cachedHealth.sleepHours,
      heartRate: body.heartRate ?? cachedHealth.heartRate,
      activityPct: Math.round(((body.steps ?? cachedHealth.steps) / (body.stepsGoal ?? 10000)) * 100),
      updatedAt: new Date().toISOString(),
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
}
