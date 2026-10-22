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
      ORDER BY t.tanggal ASC, t.created_at ASC
    `

    if (transactions.length === 0) {
      return NextResponse.json({
        summary: { total_trades: 0, total_beli: 0, total_jual: 0, win_rate: 0, total_profit: 0, total_loss: 0, net_profit: 0 },
        favorite_stocks: [],
        broker_performance: [],
        biggest_winners: [],
        biggest_losers: [],
        portfolio_distribution: []
      })
    }

    const totalBeli = transactions.filter(t => t.tipe === 'BELI').length
    const totalJual = transactions.filter(t => t.tipe === 'JUAL').length
    const totalTrades = transactions.length

    const holdingMap: Record<string, any> = {}
    
    for (const tx of transactions) {
      const key = `${tx.rdn_id}-${tx.kode_saham}`
      
      if (!holdingMap[key]) {
        holdingMap[key] = {
          rdn_id: Number(tx.rdn_id),
          rdn_nama: tx.rdn_nama,
          rdn_kode_broker: tx.rdn_kode_broker,
          kode_saham: tx.kode_saham,
          total_lot_beli: 0,
          total_modal_beli: 0,
          total_lot_jual: 0,
          total_penerimaan_jual: 0,
          total_fee: 0,
          trades: []
        }
      }

      const lot = Number(tx.lot)
      const harga = Number(tx.harga)
      const fee = Number(tx.fee_beli || 0) + Number(tx.fee_jual || 0)
      const subtotal = lot * 100 * harga

      if (tx.tipe === 'BELI') {
        holdingMap[key].total_lot_beli += lot
        holdingMap[key].total_modal_beli += subtotal
        holdingMap[key].total_fee += fee
        holdingMap[key].trades.push({ tipe: 'BELI', lot, harga, fee, tanggal: tx.tanggal })
      } else if (tx.tipe === 'JUAL') {
        holdingMap[key].total_lot_jual += lot
        holdingMap[key].total_penerimaan_jual += subtotal
        holdingMap[key].total_fee += fee
        holdingMap[key].trades.push({ tipe: 'JUAL', lot, harga, fee, tanggal: tx.tanggal })
      }
    }

    let total_win_count = 0
    let total_loss_count = 0
    let total_profit_amount = 0
    let total_loss_amount = 0

    const all_positions = Object.values(holdingMap).map((h: any) => {
      const avg_price = h.total_lot_beli > 0 ? h.total_modal_beli / (h.total_lot_beli * 100) : 0
      const lot_aktual = h.total_lot_beli - h.total_lot_jual
      const cost_of_sold = h.total_lot_jual * 100 * avg_price
      const pl_realized = h.total_penerimaan_jual - cost_of_sold - h.total_fee
      
      let win_count = 0
      let loss_count = 0
      
      let remaining_buy = h.trades
        .filter((t: any) => t.tipe === 'BELI')
        .map((t: any) => ({ lot: t.lot, harga: t.harga }))
      
      for (const sellTrade of h.trades.filter((t: any) => t.tipe === 'JUAL')) {
        let sellLot = sellTrade.lot
        let total_cost = 0
        
        while (sellLot > 0 && remaining_buy.length > 0) {
          const buy = remaining_buy[0]
          const lot_used = Math.min(sellLot, buy.lot)
          total_cost += lot_used * 100 * buy.harga
          buy.lot -= lot_used
          sellLot -= lot_used
          
          if (buy.lot === 0) {
            remaining_buy.shift()
          }
        }
        
        const sell_revenue = sellTrade.lot * 100 * sellTrade.harga
        const trade_pl = sell_revenue - total_cost - sellTrade.fee
        
        if (trade_pl > 0) win_count++
        else if (trade_pl < 0) loss_count++
      }
      
      total_win_count += win_count
      total_loss_count += loss_count
      
      if (pl_realized > 0) total_profit_amount += pl_realized
      else if (pl_realized < 0) total_loss_amount += Math.abs(pl_realized)
      
      return {
        rdn_id: h.rdn_id,
        rdn_nama: h.rdn_nama,
        rdn_kode_broker: h.rdn_kode_broker,
        kode_saham: h.kode_saham,
        lot_beli: h.total_lot_beli,
        lot_jual: h.total_lot_jual,
        lot_aktual,
        avg_price: Math.round(avg_price),
        total_modal: Math.round(h.total_modal_beli),
        total_penerimaan: Math.round(h.total_penerimaan_jual),
        total_fee: Math.round(h.total_fee),
        pl_realized: Math.round(pl_realized),
        pl_realized_pct: h.total_modal_beli > 0 && h.total_lot_jual > 0 
          ? (pl_realized / (h.total_lot_jual * 100 * avg_price)) * 100 
          : 0,
        win_count,
        loss_count
      }
    })

    const total_closed_trades = total_win_count + total_loss_count
    const win_rate = total_closed_trades > 0 ? (total_win_count / total_closed_trades) * 100 : 0

    const stockFrequency: Record<string, number> = {}
    transactions.forEach(tx => {
      stockFrequency[tx.kode_saham] = (stockFrequency[tx.kode_saham] || 0) + 1
    })
    const favorite_stocks = Object.entries(stockFrequency)
      .map(([kode, count]) => ({ kode, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const brokerMap: Record<string, any> = {}
    
    all_positions.forEach((p) => {
      const brokerKey = `${p.rdn_nama} (${p.rdn_kode_broker || '?'})`
      if (!brokerMap[brokerKey]) {
        brokerMap[brokerKey] = {
          nama: brokerKey,
          lot_beli: 0,
          lot_jual: 0,
          total_modal: 0,
          total_penerimaan: 0,
          total_fee: 0
        }
      }
      brokerMap[brokerKey].lot_beli += p.lot_beli
      brokerMap[brokerKey].lot_jual += p.lot_jual
      brokerMap[brokerKey].total_modal += p.total_modal
      brokerMap[brokerKey].total_penerimaan += p.total_penerimaan
      brokerMap[brokerKey].total_fee += p.total_fee
    })

    const broker_performance = Object.values(brokerMap).map((b: any) => {
      const avg_price = b.lot_beli > 0 ? b.total_modal / (b.lot_beli * 100) : 0
      const cost_of_sold = b.lot_jual * 100 * avg_price
      const pl = b.total_penerimaan - cost_of_sold - b.total_fee
      const pl_pct = cost_of_sold > 0 ? (pl / cost_of_sold) * 100 : 0
      
      return {
        ...b,
        avg_price: Math.round(avg_price),
        profit_loss: Math.round(pl),
        profit_loss_pct: Math.round(pl_pct * 100) / 100
      }
    }).sort((a, b) => b.profit_loss - a.profit_loss)

    const biggest_winners = all_positions
      .filter(p => p.pl_realized > 0 && p.lot_jual > 0)
      .sort((a, b) => b.pl_realized - a.pl_realized)
      .slice(0, 3)

    const biggest_losers = all_positions
      .filter(p => p.pl_realized < 0 && p.lot_jual > 0)
      .sort((a, b) => a.pl_realized - b.pl_realized)
      .slice(0, 3)

    const portfolio_distribution = all_positions
      .filter(p => p.lot_aktual > 0)
      .map(p => ({
        kode_saham: p.kode_saham,
        lot: p.lot_aktual,
        modal: Math.round(p.lot_aktual * 100 * p.avg_price)
      }))
      .sort((a, b) => b.modal - a.modal)

    return NextResponse.json({
      summary: {
        total_trades: totalTrades,
        total_beli: totalBeli,
        total_jual: totalJual,
        win_rate: Math.round(win_rate * 100) / 100,
        total_profit: Math.round(total_profit_amount),
        total_loss: Math.round(total_loss_amount),
        net_profit: Math.round(total_profit_amount - total_loss_amount)
      },
      favorite_stocks,
      broker_performance,
      biggest_winners,
      biggest_losers,
      portfolio_distribution
    })
  } catch (error: any) {
    console.error('GET statistics Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}