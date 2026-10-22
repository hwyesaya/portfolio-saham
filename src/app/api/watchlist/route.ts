import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

// GET - Ambil semua watchlist user
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await sql`
      SELECT id, user_id, kode_saham, nama_saham, target_price, current_price, created_at
      FROM watchlist 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ watchlist: result })
  } catch (error: any) {
    console.error('GET watchlist Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Tambah saham ke watchlist
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { kode_saham, nama_saham, target_price, current_price } = body

    if (!kode_saham) {
      return NextResponse.json({ error: 'Kode saham wajib diisi' }, { status: 400 })
    }

    // Cek duplikat
    const existing = await sql`
      SELECT id FROM watchlist WHERE user_id = ${userId} AND kode_saham = ${kode_saham.toUpperCase()}
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Saham sudah ada di watchlist' }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO watchlist 
        (user_id, kode_saham, nama_saham, target_price, current_price)
      VALUES 
        (${userId}, ${kode_saham.toUpperCase()}, ${nama_saham || null}, ${Number(target_price) || null}, ${Number(current_price) || null})
      RETURNING id, user_id, kode_saham, nama_saham, target_price, current_price, created_at
    `

    return NextResponse.json({ success: true, watchlist: result[0] })
  } catch (error: any) {
    console.error('POST watchlist Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update watchlist (target price, current price, nama)
export async function PUT(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, nama_saham, target_price, current_price } = body

    if (!id) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    await sql`
      UPDATE watchlist 
      SET 
        nama_saham = ${nama_saham || null},
        target_price = ${Number(target_price) || null},
        current_price = ${Number(current_price) || null}
      WHERE id = ${id} AND user_id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PUT watchlist Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Hapus dari watchlist
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
      DELETE FROM watchlist 
      WHERE id = ${id} AND user_id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE watchlist Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}