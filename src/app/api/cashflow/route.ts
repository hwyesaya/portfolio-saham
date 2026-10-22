import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cashflows = await sql`
      SELECT c.*, r.nama_sekuritas 
      FROM cashflow c
      LEFT JOIN rdn r ON c.rdn_id = r.id
      WHERE c.user_id = ${userId}
      ORDER BY c.tanggal DESC
    `

    const rdns = await sql`
      SELECT id, nama_sekuritas 
      FROM rdn 
      WHERE user_id = ${userId}
    `

    return NextResponse.json({ cashflows, rdns })
  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json({ error: 'Gagal memuat data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const amount = parseFloat(body.amount)

    const result = await sql`
      INSERT INTO cashflow (user_id, tanggal, Type, amount, rdn_id, kode_saham, keterangan)
      VALUES (${userId}, ${body.tanggal}, ${body.Type}, ${amount}, ${body.rdn_id || null}, ${body.kode_saham || null}, ${body.keterangan || ''})
      RETURNING *
    `

    if (body.rdn_id) {
      let adjustment = 0
      if (body.Type === 'deposit' || body.Type === 'dividen') {
        adjustment = amount
      } else if (body.Type === 'withdraw') {
        adjustment = -amount
      }

      await sql`
        UPDATE rdn 
        SET cash_balance = cash_balance + ${adjustment}
        WHERE id = ${parseInt(body.rdn_id)} AND user_id = ${userId}
      `
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('POST Error:', error)
    return NextResponse.json({ error: error.message || 'Gagal menambah cashflow' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, tanggal, Type, amount, rdn_id, kode_saham, keterangan, old_rdn_id, old_type, old_amount } = body
    const newAmount = parseFloat(amount)
    const oldAmountVal = parseFloat(old_amount)

    // Balikkan efek lama
    if (old_rdn_id) {
      let oldAdjustment = 0
      if (old_type === 'deposit' || old_type === 'dividen') {
        oldAdjustment = -oldAmountVal
      } else if (old_type === 'withdraw') {
        oldAdjustment = oldAmountVal
      }

      await sql`
        UPDATE rdn 
        SET cash_balance = cash_balance + ${oldAdjustment}
        WHERE id = ${parseInt(old_rdn_id)} AND user_id = ${userId}
      `
    }

    // Update data
    await sql`
      UPDATE cashflow 
      SET tanggal = ${tanggal}, Type = ${Type}, amount = ${newAmount}, 
          rdn_id = ${rdn_id || null}, kode_saham = ${kode_saham || null}, 
          keterangan = ${keterangan || ''}
      WHERE id = ${id} AND user_id = ${userId}
    `

    // Terapkan efek baru
    if (rdn_id) {
      let newAdjustment = 0
      if (Type === 'deposit' || Type === 'dividen') {
        newAdjustment = newAmount
      } else if (Type === 'withdraw') {
        newAdjustment = -newAmount
      }

      await sql`
        UPDATE rdn 
        SET cash_balance = cash_balance + ${newAdjustment}
        WHERE id = ${parseInt(rdn_id)} AND user_id = ${userId}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PUT Error:', error)
    return NextResponse.json({ error: error.message || 'Gagal mengupdate cashflow' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, rdn_id, Type, amount } = body

    if (!id) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    // Kembalikan saldo RDN jika ada
    if (rdn_id) {
      let adjustment = 0
      const amt = parseFloat(amount)
      if (Type === 'deposit' || Type === 'dividen') {
        adjustment = -amt
      } else if (Type === 'withdraw') {
        adjustment = amt
      }

      await sql`
        UPDATE rdn 
        SET cash_balance = cash_balance + ${adjustment}
        WHERE id = ${parseInt(rdn_id)} AND user_id = ${userId}
      `
    }

    // Hapus data cashflow
    await sql`
      DELETE FROM cashflow 
      WHERE id = ${id} AND user_id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE Error:', error)
    return NextResponse.json({ error: error.message || 'Gagal menghapus cashflow' }, { status: 500 })
  }
}