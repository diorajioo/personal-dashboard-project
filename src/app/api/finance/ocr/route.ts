import { NextRequest, NextResponse } from 'next/server'
import Tesseract from 'tesseract.js'

// POST /api/finance/ocr — extract amount & merchant from receipt image
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('receipt') as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())

    const { data: { text } } = await Tesseract.recognize(buffer, 'eng+ind', {
      logger: () => {},
    })

    // Parse amount — look for common Indonesian receipt patterns
    const amountPatterns = [
      /total[:\s]+rp\.?\s*([\d.,]+)/i,
      /grand\s*total[:\s]+rp\.?\s*([\d.,]+)/i,
      /jumlah[:\s]+rp\.?\s*([\d.,]+)/i,
      /rp\.?\s*([\d.,]+)/i,
      /([\d.,]{4,})/,
    ]

    let amount = 0
    for (const pattern of amountPatterns) {
      const match = text.match(pattern)
      if (match) {
        const raw = match[1].replace(/\./g, '').replace(',', '.')
        const parsed = parseFloat(raw)
        if (!isNaN(parsed) && parsed > 1000) {
          amount = Math.round(parsed)
          break
        }
      }
    }

    // Extract merchant name — usually first non-empty line
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const merchant = lines[0] || ''

    return NextResponse.json({ amount, merchant, rawText: text })
  } catch (err) {
    console.error('OCR error:', err)
    return NextResponse.json({ error: 'OCR failed' }, { status: 500 })
  }
}
