import { NextRequest, NextResponse } from 'next/server'
import { createWorker } from 'tesseract.js'

// POST /api/finance/ocr — extract amount + merchant from a receipt photo
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('receipt') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No receipt image provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const worker = await createWorker('eng')
    const { data: { text } } = await worker.recognize(buffer)
    await worker.terminate()

    const { amount, merchant } = parseReceipt(text)

    return NextResponse.json({ amount, merchant, rawText: text })
  } catch (err) {
    console.error('OCR error:', err)
    return NextResponse.json({ error: 'Failed to process receipt' }, { status: 500 })
  }
}

function parseReceipt(text: string): { amount: number | null; merchant: string | null } {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Merchant: usually the first non-empty line at the top of the receipt
  const merchant = lines[0] || null

  // Amount: look for lines containing "total" first, fall back to largest number found
  const numberPattern = /(?:rp\.?\s?)?([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/gi

  let totalLineAmount: number | null = null
  const allAmounts: number[] = []

  for (const line of lines) {
    const matches = [...line.matchAll(numberPattern)]
    for (const m of matches) {
      const cleaned = m[1].replace(/\./g, '').replace(',', '.')
      const value = parseFloat(cleaned)
      if (!isNaN(value) && value > 0) {
        allAmounts.push(value)
        if (/total|jumlah|grand total/i.test(line) && !/subtotal/i.test(line)) {
          totalLineAmount = value
        }
      }
    }
  }

  const amount = totalLineAmount ?? (allAmounts.length ? Math.max(...allAmounts) : null)

  return { amount, merchant }
}