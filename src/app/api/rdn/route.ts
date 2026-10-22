import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

// GET
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await sql`
      SELECT id, user_id, nama_sekuritas, nomor_rekening, kode_broker, cash_balance, created_at
      FROM rdn 
      WHERE user_id = ${userId}
      ORDER BY nama_sekuritas ASC
    `

    return NextResponse.json({ rdn: result })
  } catch (error: any) {
    console.error('GET rdn Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { nama_sekuritas, nomor_rekening, kode_broker, cash_balance } = body

    if (!nama_sekuritas) {
      return NextResponse.json({ error: 'Nama sekuritas wajib diisi' }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO rdn (user_id, nama_sekuritas, nomor_rekening, kode_broker, cash_balance)
      VALUES (${userId}, ${nama_sekuritas}, ${nomor_rekening || null}, ${(kode_broker || '').toUpperCase() || null}, ${parseFloat(cash_balance) || 0})
      RETURNING id, user_id, nama_sekuritas, nomor_rekening, kode_broker, cash_balance, created_at
    `

    return NextResponse.json({ success: true, rdn: result[0] })
  } catch (error: any) {
    console.error('POST rdn Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT
export async function PUT(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, nama_sekuritas, nomor_rekening, kode_broker, cash_balance } = body

    if (!id) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    await sql`
      UPDATE rdn 
      SET 
        nama_sekuritas = ${nama_sekuritas},
        nomor_rekening = ${nomor_rekening || null},
        kode_broker = ${(kode_broker || '').toUpperCase() || null},
        cash_balance = ${parseFloat(cash_balance) || 0},
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PUT rdn Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    await sql`
      DELETE FROM rdn 
      WHERE id = ${id} AND user_id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE rdn Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}