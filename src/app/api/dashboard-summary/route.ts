import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transactions = await sql`
      SELECT t.*, r.nama_sekuritas as rdn_nama, r.kode_broker as rdn_kode_broker
      FROM transactions t
      LEFT JOIN rdn r ON t.rdn_id = r.id
      WHERE t.user_id = ${userId}
      ORDER BY t.tanggal ASC
    `

    console.log('📦 Total transaksi:', transactions.length)

    const stockMap: Record<string, any> = {}
    
    for (const tx of transactions) {
      const key = tx.kode_saham
      
      if (!stockMap[key]) {
        stockMap[key] = {
          kode_saham: tx.kode_saham,
          total_lot_beli: 0,
          total_modal_beli: 0,
          total_lot_jual: 0,
          total_penerimaan_jual: 0
        }
      }

      const lot = Number(tx.lot)
      const harga = Number(tx.harga)
      const fee = tx.tipe === 'BELI' ? Number(tx.fee_beli || 0) : Number(tx.fee_jual || 0)
      const subtotal = lot * 100 * harga

      if (tx.tipe === 'BELI') {
        stockMap[key].total_lot_beli += lot
        stockMap[key].total_modal_beli += subtotal + fee
      } else if (tx.tipe === 'JUAL') {
        stockMap[key].total_lot_jual += lot
        stockMap[key].total_penerimaan_jual += subtotal - fee
      }
    }

    console.log('📊 Stock Map:', JSON.stringify(stockMap, null, 2))

    const allStocks = Object.values(stockMap)
    let totalModalAktual = 0
    let totalNilaiPasar = 0
    let totalUnrealizedPL = 0
    let totalRealizedPL = 0
    const holdingsToFetch: any[] = []
    
    for (const s of allStocks) {
      const avgPrice = s.total_lot_beli > 0 ? s.total_modal_beli / (s.total_lot_beli * 100) : 0
      const lotAktual = s.total_lot_beli - s.total_lot_jual
      
      console.log(`🔍 ${s.kode_saham}: Beli=${s.total_lot_beli}, Jual=${s.total_lot_jual}, Avg=${avgPrice}, LotAktual=${lotAktual}`)
      
      if (s.total_lot_jual > 0 && avgPrice > 0) {
        const costOfSold = s.total_lot_jual * 100 * avgPrice
        const realizedPL = s.total_penerimaan_jual - costOfSold
        totalRealizedPL += realizedPL
        console.log(`✅ ${s.kode_saham} Realized PL: ${realizedPL}`)
      } else if (s.total_lot_jual > 0 && avgPrice === 0) {
        console.log(`️ ${s.kode_saham}: Jual ada tapi avgPrice = 0 (tidak ada data beli)`)
      }

      if (lotAktual > 0) {
        const modalAktual = lotAktual * 100 * avgPrice
        totalModalAktual += modalAktual
        holdingsToFetch.push({
          kode_saham: s.kode_saham,
          lot_aktual: lotAktual,
          avg_price: Math.round(avgPrice),
          modal_aktual: Math.round(modalAktual)
        })
      }
    }

    await Promise.all(
      holdingsToFetch.map(async (h) => {
        try {
          const ticker = `${h.kode_saham}.JK`
          const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
          })
          
          if (res.ok) {
            const data = await res.json()
            const price = data.chart.result[0].meta.regularMarketPrice
            const nilaiPasar = h.lot_aktual * 100 * price
            const unrealizedPL = nilaiPasar - h.modal_aktual

            totalNilaiPasar += nilaiPasar
            totalUnrealizedPL += unrealizedPL
          }
        } catch (error) {
          console.error(`Gagal fetch ${h.kode_saham}:`, error)
        }
      })
    )

    let totalDividen = 0
    try {
      const result = await sql`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM cashflow 
        WHERE user_id = ${userId} AND type = 'dividen'
      `
      totalDividen = Number(result[0].total)
    } catch (error) {
      console.log('Gagal hitung dividen:', error)
    }

    console.log('🎯 FINAL:', { totalRealizedPL, totalUnrealizedPL, totalDividen })

    return NextResponse.json({
      summary: {
        total_modal: Math.round(totalModalAktual),
        total_nilai_pasar: Math.round(totalNilaiPasar),
        total_unrealized_pl: Math.round(totalUnrealizedPL),
        total_realized_pl: Math.round(totalRealizedPL),
        total_pl: Math.round(totalUnrealizedPL + totalRealizedPL),
        total_dividen: Math.round(totalDividen),
        total_transaksi: transactions.length
      },
      holdings: holdingsToFetch
    })

  } catch (error: any) {
    console.error('GET dashboard-summary Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
