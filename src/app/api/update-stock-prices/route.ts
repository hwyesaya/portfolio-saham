import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const holdings = await sqlSELECT DISTINCT kode_saham FROM transactions WHERE user_id = ${userId}`

    const results: any[] = []
    let successCount = 0
    let failCount = 0

    for (const holding of holdings) {
      const code = holding.kode_saham
      const ticker = ${code}.JK

      try {
        let price = 0
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const res = await fetch(
              https://query1.finance.yahoo.com/v8/finance/chart/?interval=1d&range=1d,
              { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
            )
            if (res.ok) {
              const data = await res.json()
              const fetchedPrice = data.chart?.result?.[0]?.meta?.regularMarketPrice
              if (fetchedPrice && fetchedPrice > 0) { price = fetchedPrice; break }
            }
          } catch (error) {
            if (attempt === 3) throw error
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }

        if (price > 0) {
          await sqlINSERT INTO stock_prices (kode_saham, harga, updated_at) VALUES (, , NOW()) ON CONFLICT (kode_saham) DO UPDATE SET harga = , updated_at = NOW()
          successCount++
          results.push({ code, price, status: 'success' })
        } else {
          failCount++
          results.push({ code, price: 0, status: 'failed' })
        }
      } catch (error: any) {
        console.error(Failed to fetch :, error.message)
        failCount++
        results.push({ code, price: 0, status: 'error', error: error.message })
      }
    }

    return NextResponse.json({ success: true, updated: successCount, failed: failCount, results })
  } catch (error: any) {
    console.error('Update stock prices error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
