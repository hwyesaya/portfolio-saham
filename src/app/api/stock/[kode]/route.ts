import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ kode: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 🔥 FIX: await params karena Next.js 15+ params adalah Promise
    const { kode } = await params
    const kodeSaham = kode.toUpperCase()

    // 1. Fetch harga dari Yahoo Finance
    const ticker = `${kodeSaham}.JK`
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1mo`
    
    let marketData = null
    try {
      const response = await fetch(yahooUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const result = data.chart.result[0]
        const meta = result.meta
        marketData = {
          price: meta.regularMarketPrice,
          previousClose: meta.chartPreviousClose || meta.previousClose,
          change: meta.regularMarketPrice - (meta.chartPreviousClose || meta.previousClose),
          changePercent: ((meta.regularMarketPrice - (meta.chartPreviousClose || meta.previousClose)) / (meta.chartPreviousClose || meta.previousClose)) * 100,
          currency: meta.currency || 'IDR',
          marketCap: meta.marketCap,
          volume: meta.regularMarketVolume
        }
      }
    } catch (error) {
      console.error('Yahoo Finance error:', error)
    }

    // 2. Fetch transaksi untuk saham ini
    const transactions = await sql`
      SELECT t.*, r.nama_sekuritas as rdn_nama, r.kode_broker as rdn_kode_broker
      FROM transactions t
      LEFT JOIN rdn r ON t.rdn_id = r.id
      WHERE t.user_id = ${userId} AND t.kode_saham = ${kodeSaham}
      ORDER BY t.tanggal DESC
    `

    // 3. Hitung portfolio summary
    const holdingMap: Record<string, any> = {}
    
    for (const tx of transactions) {
      const key = `${tx.rdn_id}`
      
      if (!holdingMap[key]) {
        holdingMap[key] = {
          rdn_id: Number(tx.rdn_id),
          rdn_nama: tx.rdn_nama,
          rdn_kode_broker: tx.rdn_kode_broker,
          total_lot_beli: 0,
          total_modal: 0,
          total_lot_jual: 0,
          total_jual: 0
        }
      }

      const lot = Number(tx.lot)
      const harga = Number(tx.harga)
      const fee = tx.tipe === 'BELI' ? Number(tx.fee_beli || 0) : Number(tx.fee_jual || 0)
      const subtotal = lot * 100 * harga

      if (tx.tipe === 'BELI') {
        holdingMap[key].total_lot_beli += lot
        holdingMap[key].total_modal += subtotal + fee
      } else if (tx.tipe === 'JUAL') {
        holdingMap[key].total_lot_jual += lot
        holdingMap[key].total_jual += subtotal - fee
      }
    }

    const portfolio = Object.values(holdingMap).map((h: any) => {
      const lot_aktual = h.total_lot_beli - h.total_lot_jual
      const avg_price = h.total_lot_beli > 0 ? h.total_modal / (h.total_lot_beli * 100) : 0
      const modal_aktual = lot_aktual * 100 * avg_price
      const nilai_pasar = marketData ? lot_aktual * 100 * marketData.price : 0
      const unrealized_pl = nilai_pasar - modal_aktual

      return {
        ...h,
        lot_aktual,
        avg_price: Math.round(avg_price),
        modal_aktual: Math.round(modal_aktual),
        nilai_pasar: Math.round(nilai_pasar),
        unrealized_pl: Math.round(unrealized_pl),
        unrealized_pl_pct: modal_aktual > 0 ? (unrealized_pl / modal_aktual) * 100 : 0
      }
    }).filter(h => h.lot_aktual > 0)

    // 4. Fetch watchlist data
    const watchlist = await sql`
      SELECT id, target_price, current_price
      FROM watchlist
      WHERE user_id = ${userId} AND kode_saham = ${kodeSaham}
    `

    return NextResponse.json({
      kode: kodeSaham,
      market_data: marketData,
      portfolio,
      watchlist: watchlist[0] || null,
      transactions,
      dividends: []
    })
  } catch (error: any) {
    console.error('GET stock detail Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}