import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const holdings = await sql`SELECT DISTINCT kode_saham FROM transactions WHERE user_id = ${userId}`
    const results = []
    let successCount = 0
    let failCount = 0

    for (const holding of holdings) {
      const code = holding.kode_saham
      const ticker = code + '.JK'
      let price = 0

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetch(
            'https://query1.finance.yahoo.com/v8/finance/chart/' + ticker + '?interval=1d&range=1d',
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
          )
          if (res.ok) {
            const data = await res.json()
            const fetchedPrice = data.chart?.result?.[0]?.meta?.regularMarketPrice
            if (fetchedPrice && fetchedPrice > 0) {
              price = fetchedPrice
              break
            }
          }
        } catch (error) {
          if (attempt === 3) throw error
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      if (price > 0) {
        await sql`INSERT INTO stock_prices (kode_saham, harga, updated_at) VALUES (${code}, ${price}, NOW()) ON CONFLICT (kode_saham) DO UPDATE SET harga = ${price}, updated_at = NOW()`
        successCount++
        results.push({ code, price, status: 'success' })
      } else {
        failCount++
        results.push({ code, price: 0, status: 'failed' })
      }
    }

    return NextResponse.json({ success: true, updated: successCount, failed: failCount, results })
  } catch (error) {
    console.error('Update stock prices error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}