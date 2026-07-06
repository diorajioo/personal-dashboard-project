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
  if (!session?.google?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sheets = getSheets(session.google.accessToken)
    const sheetId = process.env.GOOGLE_SHEETS_ID!

    // Sheet layout (matches finance_tracker_dummy.xlsx):
    // Transactions: Date, Category, Description, Amount, Type, Account
    // Savings Goals: Goal Name, Target Amount, Current Amount, Progress %, Target Date
    const [transactionsRes, savingsRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Transactions!A2:F200',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "'Savings Goals'!A2:E20",
      }),
    ])

    const txRows = transactionsRes.data.values || []
    const savRows = savingsRes.data.values || []

    const expenses: Expense[] = txRows
      .filter((row) => (row[4] || '').toLowerCase() === 'expense')
      .map((row, i) => ({
        id: `exp-${i}`,
        date: row[0] || '',
        description: row[2] || '',
        category: row[1] || 'Other',
        amount: Math.abs(parseFloat(row[3])) || 0,
        source: 'manual',
      }))

    // Group by category
    const categories: Record<string, { spent: number; budget: number }> = {}
    expenses.forEach((e) => {
      if (!categories[e.category]) categories[e.category] = { spent: 0, budget: 2000000 }
      categories[e.category].spent += e.amount
    })

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

    const income = txRows
      .filter((row) => (row[4] || '').toLowerCase() === 'income')
      .reduce((s, row) => s + (parseFloat(row[3]) || 0), 0)

    const savingsGoals = savRows.map((row, i) => ({
      id: `goal-${i}`,
      name: row[0] || 'Goal',
      current: parseFloat(row[2]) || 0,
      target: row[1] ? parseFloat(row[1]) : null,
      color: ['#4fd1a5', '#7b9ef8', '#9b7ff4', '#f5c842'][i % 4],
    }))

    const data: FinanceData = {
      netBalance: income - totalExpenses,
      income,
      expenses: totalExpenses,
      savingsRate: income > 0 ? Math.round(((income - totalExpenses) / income) * 100) : 0,
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

// POST /api/finance — append a new transaction row to GSheet
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.google?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: Omit<Expense, 'id'> = await req.json()
    const sheets = getSheets(session.google.accessToken)
    const sheetId = process.env.GOOGLE_SHEETS_ID!

    const today = new Date().toISOString().split('T')[0]

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Transactions!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          body.date || today,
          body.category,
          body.description,
          -Math.abs(body.amount),
          'Expense',
          'Manual',
        ]],
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Finance POST error:', err)
    return NextResponse.json({ error: 'Failed to save expense' }, { status: 500 })
  }
}