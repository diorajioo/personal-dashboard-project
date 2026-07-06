import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { Expense, FinanceData } from '@/types'

function getSheets(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return google.sheets({ version: 'v4', auth })
}

// GET /api/finance — fetch dashboard summary from GSheet
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sheets = getSheets(session.accessToken)
    const sheetId = process.env.GOOGLE_SHEETS_ID!

    // Expects sheet layout:
    // Sheet1: Expenses — columns: Date, Description, Category, Amount
    // Sheet2: Summary  — named cells for Income, Budget targets
    // Sheet3: Savings  — columns: Goal Name, Current, Target
    const [expensesRes, savingsRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Expenses!A2:D200',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Savings!A2:C20',
      }),
    ])

    const expRows = expensesRes.data.values || []
    const savRows = savingsRes.data.values || []

    const expenses: Expense[] = expRows.map((row, i) => ({
      id: `exp-${i}`,
      date: row[0] || '',
      description: row[1] || '',
      category: row[2] || 'Other',
      amount: parseFloat(row[3]) || 0,
      source: 'manual',
    }))

    // Group by category
    const categories: Record<string, { spent: number; budget: number }> = {}
    expenses.forEach((e) => {
      if (!categories[e.category]) categories[e.category] = { spent: 0, budget: 2000000 }
      categories[e.category].spent += e.amount
    })

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    // Hardcoded income until you set up Sheet2 — easy to change
    const income = 24500000

    const savingsGoals = savRows.map((row, i) => ({
      id: `goal-${i}`,
      name: row[0] || 'Goal',
      current: parseFloat(row[1]) || 0,
      target: row[2] ? parseFloat(row[2]) : null,
      color: ['#4fd1a5', '#7b9ef8', '#9b7ff4', '#f5c842'][i % 4],
    }))

    const data: FinanceData = {
      netBalance: income - totalExpenses,
      income,
      expenses: totalExpenses,
      savingsRate: Math.round(((income - totalExpenses) / income) * 100),
      categories,
      recentExpenses: expenses.slice(-10).reverse(),
      savingsGoals,
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Finance API error:', err)
    return NextResponse.json({ error: 'Failed to fetch finance data' }, { status: 500 })
  }
}

// POST /api/finance — append a new expense row to GSheet
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: Omit<Expense, 'id'> = await req.json()
    const sheets = getSheets(session.accessToken)
    const sheetId = process.env.GOOGLE_SHEETS_ID!

    const today = new Date().toISOString().split('T')[0]

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Expenses!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[body.date || today, body.description, body.category, body.amount]],
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Finance POST error:', err)
    return NextResponse.json({ error: 'Failed to save expense' }, { status: 500 })
  }
}
