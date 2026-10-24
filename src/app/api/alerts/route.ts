import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Ambil semua holdings dengan harga terbaru
    const holdings = await sql`
      SELECT DISTINCT ON (t.kode_saham)
        t.kode_saham,
        t.harga as harga_beli,
        sp.harga as harga_terkini,
        sp.updated_at
      FROM transactions t
      LEFT JOIN stock_prices sp ON sp.kode_saham = t.kode_saham
      WHERE t.user_id = ${userId} AND t.tipe = 'BELI'
      ORDER BY t.kode_saham, t.tanggal DESC
    `

    const alerts: any[] = []
    const now = new Date()

    for (const h of holdings) {
      const hargaBeli = Number(h.harga_beli)
      const hargaTerkini = Number(h.harga_terkini)

      if (!hargaTerkini || hargaTerkini <= 0) {
        alerts.push({
          type: 'warning',
          kode: h.kode_saham,
          message: `Harga ${h.kode_saham} belum tersedia di database`,
          severity: 'medium'
        })
        continue
      }

      const changePct = ((hargaTerkini - hargaBeli) / hargaBeli) * 100

      // Cek jika turun > 10%
      if (changePct <= -10) {
        alerts.push({
          type: 'danger',
          kode: h.kode_saham,
          message: `${h.kode_saham} turun ${changePct.toFixed(1)}% dari harga beli`,
          detail: `Beli: Rp ${hargaBeli.toLocaleString('id-ID')}, Kini: Rp ${hargaTerkini.toLocaleString('id-ID')}`,
          severity: 'high'
        })
      }

      // Cek jika naik > 10%
      if (changePct >= 10) {
        alerts.push({
          type: 'success',
          kode: h.kode_saham,
          message: `${h.kode_saham} naik ${changePct.toFixed(1)}% dari harga beli`,
          detail: `Beli: Rp ${hargaBeli.toLocaleString('id-ID')}, Kini: Rp ${hargaTerkini.toLocaleString('id-ID')}`,
          severity: 'high'
        })
      }

      // Cek jika data stale (> 7 hari)
      if (h.updated_at) {
        const daysSinceUpdate = Math.floor((now.getTime() - new Date(h.updated_at).getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceUpdate > 7) {
          alerts.push({
            type: 'info',
            kode: h.kode_saham,
            message: `Harga ${h.kode_saham} sudah ${daysSinceUpdate} hari tidak diupdate`,
            severity: 'low'
          })
        }
      }
    }

    
    // 🆕 NEW: Check Watchlist Target Prices
    const watchlist = await sql`
      SELECT w.kode_saham, w.target_price, sp.harga as current_price
      FROM watchlist w
      LEFT JOIN stock_prices sp ON sp.kode_saham = w.kode_saham
      WHERE w.user_id = ${userId} AND w.target_price IS NOT NULL AND w.target_price > 0
    `

    for (const w of watchlist) {
      const target = Number(w.target_price)
      const current = Number(w.current_price)

      if (current > 0) {
        const diff = current - target
        const diffPct = (diff / target) * 100

        if (current >= target) {
          alerts.push({
            type: 'success',
            kode: w.kode_saham,
            message: `🎯 Target Harga ${w.kode_saham} TERCAPAI!`,
            detail: `Target: Rp ${target.toLocaleString('id-ID')}, Saat ini: Rp ${current.toLocaleString('id-ID')} (+${diffPct.toFixed(1)}%)`,
            severity: 'high'
          })
        } else if (diffPct >= -5) {
          alerts.push({
            type: 'info',
            kode: w.kode_saham,
            message: `⚠️ ${w.kode_saham} mendekati target harga`,
            detail: `Target: Rp ${target.toLocaleString('id-ID')}, Saat ini: Rp ${current.toLocaleString('id-ID')} (Kurang ${Math.abs(diffPct).toFixed(1)}%)`,
            severity: 'medium'
          })
        }
      }
    }

return NextResponse.json({ alerts })
  } catch (error: any) {
    console.error('Alerts API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}