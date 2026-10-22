import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const transactions = await sql`
      SELECT t.*, r.nama_sekuritas as rdn_nama, r.kode_broker as rdn_kode_broker
      FROM transactions t
      LEFT JOIN rdn r ON t.rdn_id = r.id
      WHERE t.user_id = ${userId}
      ORDER BY t.tanggal ASC
    `

    const holdingMap: Record<string, any> = {}

    for (const tx of transactions) {
      const key = `${tx.rdn_id}-${tx.kode_saham}`
      
      if (!holdingMap[key]) {
        holdingMap[key] = {
          rdn_id: Number(tx.rdn_id),
          rdn_nama: tx.rdn_nama || '-',
          rdn_kode_broker: tx.rdn_kode_broker || null,
          kode_saham: tx.kode_saham,
          total_lot_beli: 0,
          total_lot_jual: 0,
          total_modal: 0,
          total_jual: 0,
          transaksi_terakhir: tx.tanggal
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

      holdingMap[key].transaksi_terakhir = tx.tanggal
    }

    const holdings = Object.values(holdingMap).map((h: any) => {
      const lot_aktual = h.total_lot_beli - h.total_lot_jual
      const avg_price = h.total_lot_beli > 0 ? h.total_modal / (h.total_lot_beli * 100) : 0
      const realized_pl = h.total_jual - (h.total_lot_jual * 100 * avg_price)

      return {
        ...h,
        lot_aktual,
        avg_price: Math.round(avg_price),
        realized_pl: Math.round(realized_pl),
        modal_aktual: Math.round(lot_aktual * 100 * avg_price)
      }
    }).filter((h: any) => h.lot_aktual > 0)

    const uniqueCodes = [...new Set(holdings.map((h: any) => h.kode_saham))]
    const priceMap: Record<string, any> = {}

    // 🆕 TAMBAHAN: Logging & Cache Busting
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    console.log(`[Portfolio API] Base URL untuk fetch harga: ${baseUrl}`)

    await Promise.all(
      uniqueCodes.map(async (code) => {
        try {
          const res = await fetch(`${baseUrl}/api/stock-price?code=${code}`, {
            cache: 'no-store', // 🆕 Paksa ambil data baru, jangan pakai cache Vercel
            next: { revalidate: 0 }
          })
          const data = await res.json()
          
          // 🆕 Log hasil fetch agar kita bisa lihat di Vercel Logs
          console.log(`[Portfolio API] Harga untuk ${code}:`, data)
          
          if (data.price && Number(data.price) > 0) {
            priceMap[code] = {
              price: Number(data.price),
              previous_close: Number(data.previousClose || data.price)
            }
          } else {
            console.warn(`[Portfolio API] ⚠️ Harga tidak valid untuk ${code}:`, data)
          }
        } catch (error) {
          console.error(`[Portfolio API] ❌ Gagal fetch harga ${code}:`, error)
        }
      })
    )

    const holdingsWithPrice = holdings.map((h: any) => {
      const market = priceMap[h.kode_saham]
      const current_price = market?.price || 0
      const previous_close = market?.previous_close || current_price
      const nilai_pasar = h.lot_aktual * 100 * current_price
      const unrealized_pl = nilai_pasar - h.modal_aktual
      const change = current_price - previous_close
      const change_pct = previous_close > 0 ? (change / previous_close) * 100 : 0

      return {
        ...h,
        current_price,
        previous_close,
        nilai_pasar: Math.round(nilai_pasar),
        unrealized_pl: Math.round(unrealized_pl),
        unrealized_pl_pct: current_price > 0 && h.modal_aktual > 0 ? (unrealized_pl / h.modal_aktual) * 100 : 0,
        change: Math.round(change * 100) / 100,
        change_pct: Math.round(change_pct * 100) / 100
      }
    })

    const summary = holdingsWithPrice.reduce((acc: any, h: any) => {
      acc.total_modal += h.modal_aktual
      acc.total_nilai_pasar += h.nilai_pasar
      acc.total_unrealized_pl += h.unrealized_pl
      acc.total_realized_pl += h.realized_pl
      return acc
    }, { total_modal: 0, total_nilai_pasar: 0, total_unrealized_pl: 0, total_realized_pl: 0 })

    summary.total_pl = summary.total_unrealized_pl + summary.total_realized_pl
    summary.total_pl_pct = summary.total_modal > 0 
      ? (summary.total_pl / summary.total_modal) * 100 
      : 0

    return NextResponse.json({
      holdings: holdingsWithPrice,
      summary
    })
  } catch (error: any) {
    console.error('GET portfolio Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}