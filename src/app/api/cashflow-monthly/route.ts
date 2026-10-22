import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Ambil semua transaksi (urutkan dari yang paling lama agar avg cost akurat)
    const transactions = await sql`
      SELECT tipe, kode_saham, lot, harga, fee_beli, fee_jual, tanggal
      FROM transactions
      WHERE user_id = ${userId}
      ORDER BY tanggal ASC
    `

    // 2. Ambil semua cashflow
    const cashflows = await sql`
      SELECT type, amount, COALESCE(tanggal, created_at) as date_ref
      FROM cashflow
      WHERE user_id = ${userId}
      ORDER BY date_ref ASC
    `

    const monthlyStats: Record<string, { 
      dividen: number
      realizedPL: number
      netCashflow: number
      totalBeli: number
      totalJual: number
    }> = {}

    // Helper untuk melacak average cost per saham secara real-time
    const stockHistory: Record<string, { totalLot: number; totalModal: number }> = {}

    const getMonth = (date: any) => {
      if (!date) return 'Lainnya'
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    }

    // 3. Proses Transaksi Saham
    for (const tx of transactions) {
      const month = getMonth(tx.tanggal)
      if (!monthlyStats[month]) {
        monthlyStats[month] = { dividen: 0, realizedPL: 0, netCashflow: 0, totalBeli: 0, totalJual: 0 }
      }

      const lot = Number(tx.lot)
      const harga = Number(tx.harga)
      const fee = tx.tipe === 'BELI' ? Number(tx.fee_beli || 0) : Number(tx.fee_jual || 0)
      const subtotal = lot * 100 * harga

      if (tx.tipe === 'BELI') {
        if (!stockHistory[tx.kode_saham]) {
          stockHistory[tx.kode_saham] = { totalLot: 0, totalModal: 0 }
        }
        stockHistory[tx.kode_saham].totalLot += lot
        stockHistory[tx.kode_saham].totalModal += subtotal + fee
        
        monthlyStats[month].totalBeli += subtotal + fee
        monthlyStats[month].netCashflow -= (subtotal + fee)
      } 
      else if (tx.tipe === 'JUAL') {
        const hist = stockHistory[tx.kode_saham] || { totalLot: 0, totalModal: 0 }
        const avgPrice = hist.totalLot > 0 ? hist.totalModal / (hist.totalLot * 100) : 0
        
        // Hitung realized PL untuk penjualan ini
        const lotSold = Math.min(lot, hist.totalLot)
        const costOfSold = lotSold * 100 * avgPrice
        const proceeds = subtotal - fee
        const pl = proceeds - costOfSold
        
        monthlyStats[month].realizedPL += pl
        monthlyStats[month].totalJual += proceeds
        monthlyStats[month].netCashflow += proceeds

        // Update history (kurangi lot dan modal)
        hist.totalLot -= lotSold
        hist.totalModal -= costOfSold
      }
    }

    // 4. Proses Cashflow (Dividen, Deposit, dll)
    for (const cf of cashflows) {
      const month = getMonth(cf.date_ref)
      if (!monthlyStats[month]) {
        monthlyStats[month] = { dividen: 0, realizedPL: 0, netCashflow: 0, totalBeli: 0, totalJual: 0 }
      }

      const amount = Number(cf.amount || 0)
      if (cf.type === 'dividen') {
        monthlyStats[month].dividen += amount
        monthlyStats[month].netCashflow += amount
      } else if (cf.type === 'deposit') {
        monthlyStats[month].netCashflow += amount
      } else if (cf.type === 'withdraw') {
        monthlyStats[month].netCashflow -= amount
      }
    }

    // 5. Format hasil menjadi array dan urutkan dari bulan terbaru
    const result = Object.entries(monthlyStats)
      .map(([month, stats]) => ({
        month,
        ...stats,
        totalProfit: stats.realizedPL + stats.dividen // Profit bersih dari investasi (tanpa deposit/withdraw)
      }))
      .sort((a, b) => b.month.localeCompare(a.month))

    return NextResponse.json({ monthly: result })
  } catch (error: any) {
    console.error('GET cashflow-monthly Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}