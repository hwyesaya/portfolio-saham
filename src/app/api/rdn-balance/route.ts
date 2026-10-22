import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ambil semua RDN user
    const rdnList = await sql`
      SELECT id, nama_sekuritas, kode_broker, cash_balance
      FROM rdn
      WHERE user_id = ${userId}
    `

    const rdnWithBalance = []

    for (const rdn of rdnList) {
      // 💡 KUNCI: Gunakan cash_balance dari DB sebagai "Initial Deposit"
      // Ini mengakomodasi data historis yang tidak tercatat
      const initialBalance = Number(rdn.cash_balance) || 0

      let newDeposit = 0
      let totalDividend = 0
      let totalBuy = 0
      let totalSell = 0

      // 1. Hitung deposit BARU (setelah initial balance)
      const deposits = await sql`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM cashflow
        WHERE rdn_id = ${rdn.id} AND type = 'deposit'
      `
      newDeposit = Number(deposits[0]?.total || 0)

      // 2. Hitung dividen
      const dividends = await sql`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM cashflow
        WHERE rdn_id = ${rdn.id} AND type = 'dividen'
      `
      totalDividend = Number(dividends[0]?.total || 0)

      // 3. Hitung total beli
      const buys = await sql`
        SELECT COALESCE(SUM(lot * 100 * harga + COALESCE(fee_beli, 0)), 0) as total
        FROM transactions
        WHERE rdn_id = ${rdn.id} AND tipe = 'BELI'
      `
      totalBuy = Number(buys[0]?.total || 0)

      // 4. Hitung total jual
      const sells = await sql`
        SELECT COALESCE(SUM(lot * 100 * harga - COALESCE(fee_jual, 0)), 0) as total
        FROM transactions
        WHERE rdn_id = ${rdn.id} AND tipe = 'JUAL'
      `
      totalSell = Number(sells[0]?.total || 0)

      // 5. Hitung cash balance FINAL
      // Formula: Initial + Deposit Baru + Dividen + Jual - Beli
      const calculatedBalance = initialBalance + newDeposit + totalDividend + totalSell - totalBuy

      rdnWithBalance.push({
        id: rdn.id,
        nama_sekuritas: rdn.nama_sekuritas,
        kode_broker: rdn.kode_broker,
        cash_balance_final: Math.round(calculatedBalance),
        breakdown: {
          initial_balance: Math.round(initialBalance),
          deposit_baru: Math.round(newDeposit),
          dividen: Math.round(totalDividend),
          total_beli: Math.round(totalBuy),
          total_jual: Math.round(totalSell)
        }
      })
    }

    return NextResponse.json({ rdn: rdnWithBalance })
  } catch (error: any) {
    console.error('GET rdn-balance Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}