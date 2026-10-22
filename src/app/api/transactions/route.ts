import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rdnId = searchParams.get('rdn_id')
    const kodeSaham = searchParams.get('kode_saham')

    let transactions
    if (rdnId && kodeSaham) {
      transactions = await sql`
        SELECT t.*, r.nama_sekuritas as rdn_nama, r.kode_broker as rdn_kode_broker
        FROM transactions t
        LEFT JOIN rdn r ON t.rdn_id = r.id
        WHERE t.user_id = ${userId} AND t.rdn_id = ${Number(rdnId)} AND t.kode_saham = ${kodeSaham.toUpperCase()}
        ORDER BY t.tanggal DESC
      `
    } else if (rdnId) {
      transactions = await sql`
        SELECT t.*, r.nama_sekuritas as rdn_nama, r.kode_broker as rdn_kode_broker
        FROM transactions t
        LEFT JOIN rdn r ON t.rdn_id = r.id
        WHERE t.user_id = ${userId} AND t.rdn_id = ${Number(rdnId)}
        ORDER BY t.tanggal DESC
      `
    } else if (kodeSaham) {
      transactions = await sql`
        SELECT t.*, r.nama_sekuritas as rdn_nama, r.kode_broker as rdn_kode_broker
        FROM transactions t
        LEFT JOIN rdn r ON t.rdn_id = r.id
        WHERE t.user_id = ${userId} AND t.kode_saham = ${kodeSaham.toUpperCase()}
        ORDER BY t.tanggal DESC
      `
    } else {
      transactions = await sql`
        SELECT t.*, r.nama_sekuritas as rdn_nama, r.kode_broker as rdn_kode_broker
        FROM transactions t
        LEFT JOIN rdn r ON t.rdn_id = r.id
        WHERE t.user_id = ${userId}
        ORDER BY t.tanggal DESC
      `
    }

    const result: any[] = []
    for (const tx of transactions) {
      const txWithAvg: any = { ...tx, avg_price_at_sale: null }
      
      if (tx.tipe === 'JUAL') {
        const buysBeforeSale = await sql`
          SELECT lot, harga, fee_beli, tanggal
          FROM transactions
          WHERE user_id = ${userId} 
            AND kode_saham = ${tx.kode_saham}
            AND tipe = 'BELI'
            AND tanggal <= ${tx.tanggal}
          ORDER BY tanggal ASC
        `

        if (buysBeforeSale.length > 0) {
          let totalLot = 0
          let totalModal = 0
          
          for (const buy of buysBeforeSale) {
            const lot = Number(buy.lot)
            const harga = Number(buy.harga)
            const fee = Number(buy.fee_beli || 0)
            totalLot += lot
            totalModal += (lot * 100 * harga) + fee
          }
          
          const avgPrice = totalLot > 0 ? totalModal / (totalLot * 100) : 0
          txWithAvg.avg_price_at_sale = Math.round(avgPrice)
        }
      }
      
      result.push(txWithAvg)
    }

    return NextResponse.json({ transactions: result })
  } catch (error: any) {
    console.error('GET transactions Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rdn_id, kode_saham, tipe, lot, harga, fee_beli, fee_jual, tanggal, catatan } = body

    if (!rdn_id || !kode_saham || !tipe || !lot || !harga || !tanggal) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const subtotal = Number(lot) * 100 * Number(harga)
    
    const finalFeeBeli: number | null = tipe === 'BELI' ? (fee_beli || Math.round(subtotal * 0.0015)) : null
    const finalFeeJual: number | null = tipe === 'JUAL' ? (fee_jual || Math.round(subtotal * 0.0025)) : null
    
    const total = tipe === 'BELI' ? subtotal + (finalFeeBeli || 0) : subtotal - (finalFeeJual || 0)

    const result = await sql`
      INSERT INTO transactions 
        (user_id, rdn_id, kode_saham, tipe, lot, harga, fee_beli, fee_jual, total_transaksi, tanggal, catatan)
      VALUES 
        (${userId}, ${Number(rdn_id)}, ${kode_saham.toUpperCase()}, ${tipe}, ${Number(lot)}, ${Number(harga)}, ${finalFeeBeli}, ${finalFeeJual}, ${total}, ${tanggal}, ${catatan || null})
      RETURNING *
    `

    // 🆕 AUTO-SAVE HARGA SAHAM KE TABEL stock_prices
    try {
      await sql`
        INSERT INTO stock_prices (kode_saham, harga, updated_at)
        VALUES (${kode_saham.toUpperCase()}, ${Number(harga)}, NOW())
        ON CONFLICT (kode_saham) 
        DO UPDATE SET harga = ${Number(harga)}, updated_at = NOW()
      `
      console.log(`[Transactions API] ✅ Saved price for ${kode_saham}: ${harga}`)
    } catch (err) {
      console.warn('[Transactions API] ️ Failed to save stock price:', err)
    }

    return NextResponse.json({ success: true, transaction: result[0] })
  } catch (error: any) {
    console.error('POST transactions Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, rdn_id, kode_saham, tipe, lot, harga, fee_beli, fee_jual, tanggal, catatan } = body

    if (!id) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    const subtotal = Number(lot) * 100 * Number(harga)
    
    const finalFeeBeli: number | null = tipe === 'BELI' ? (fee_beli || Math.round(subtotal * 0.0015)) : null
    const finalFeeJual: number | null = tipe === 'JUAL' ? (fee_jual || Math.round(subtotal * 0.0025)) : null
    
    const total = tipe === 'BELI' ? subtotal + (finalFeeBeli || 0) : subtotal - (finalFeeJual || 0)

    await sql`
      UPDATE transactions 
      SET 
        rdn_id = ${Number(rdn_id)},
        kode_saham = ${kode_saham.toUpperCase()},
        tipe = ${tipe},
        lot = ${Number(lot)},
        harga = ${Number(harga)},
        fee_beli = ${finalFeeBeli},
        fee_jual = ${finalFeeJual},
        total_transaksi = ${total},
        tanggal = ${tanggal},
        catatan = ${catatan || null}
      WHERE id = ${id} AND user_id = ${userId}
    `

    //  AUTO-SAVE HARGA SAHAM (juga saat update)
    try {
      await sql`
        INSERT INTO stock_prices (kode_saham, harga, updated_at)
        VALUES (${kode_saham.toUpperCase()}, ${Number(harga)}, NOW())
        ON CONFLICT (kode_saham) 
        DO UPDATE SET harga = ${Number(harga)}, updated_at = NOW()
      `
    } catch (err) {
      console.warn('[Transactions API] ⚠️ Failed to save stock price on update:', err)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PUT transactions Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    await sql`
      DELETE FROM transactions 
      WHERE id = ${id} AND user_id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE transactions Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}