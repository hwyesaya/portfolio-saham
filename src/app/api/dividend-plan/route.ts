import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

// GET - Ambil plan dividen user beserta semua sahamnya
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Ambil plan dividen user (kalau belum ada, buat default)
    let plan = await sql`
      SELECT * FROM dividend_plan WHERE user_id = ${userId}
      LIMIT 1
    `

    if (plan.length === 0) {
      // Buat plan default dengan target 0
      const newPlan = await sql`
        INSERT INTO dividend_plan (user_id, target_yearly_dividend)
        VALUES (${userId}, 0)
        RETURNING *
      `
      plan = newPlan
    }

    // Ambil semua saham dalam plan
    const stocks = await sql`
      SELECT * FROM dividend_plan_stocks 
      WHERE plan_id = ${plan[0].id} AND user_id = ${userId}
      ORDER BY kode_saham ASC
    `

    return NextResponse.json({ plan: plan[0], stocks })
  } catch (error: any) {
    console.error('GET dividend-plan Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Update target dividen atau tambah saham baru
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    if (action === 'update_target') {
      // Update target dividen tahunan
      const target = parseFloat(body.target_yearly_dividend) || 0
      
      await sql`
        UPDATE dividend_plan 
        SET target_yearly_dividend = ${target}, updated_at = NOW()
        WHERE user_id = ${userId}
      `

      return NextResponse.json({ success: true })
    }

    if (action === 'add_stock') {
      // Tambah saham baru ke plan
      const plan = await sql`
        SELECT id FROM dividend_plan WHERE user_id = ${userId} LIMIT 1
      `

      if (plan.length === 0) {
        return NextResponse.json({ error: 'Plan tidak ditemukan' }, { status: 404 })
      }

      const result = await sql`
        INSERT INTO dividend_plan_stocks (
          plan_id, user_id, kode_saham, lot_target, lot_aktual, 
          target_harga_beli, interim_dividen, final_dividen,
          cumdate_interim, cumdate_final
        )
        VALUES (
          ${plan[0].id}, ${userId}, ${body.kode_saham.toUpperCase()}, 
          ${parseInt(body.lot_target) || 0}, ${parseInt(body.lot_aktual) || 0},
          ${parseFloat(body.target_harga_beli) || 0},
          ${parseFloat(body.interim_dividen) || 0},
          ${parseFloat(body.final_dividen) || 0},
          ${body.cumdate_interim || null},
          ${body.cumdate_final || null}
        )
        RETURNING *
      `

      return NextResponse.json({ success: true, stock: result[0] })
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 })
  } catch (error: any) {
    console.error('POST dividend-plan Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update saham yang sudah ada
export async function PUT(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    await sql`
      UPDATE dividend_plan_stocks 
      SET 
        kode_saham = ${body.kode_saham.toUpperCase()},
        lot_target = ${parseInt(body.lot_target) || 0},
        lot_aktual = ${parseInt(body.lot_aktual) || 0},
        target_harga_beli = ${parseFloat(body.target_harga_beli) || 0},
        interim_dividen = ${parseFloat(body.interim_dividen) || 0},
        final_dividen = ${parseFloat(body.final_dividen) || 0},
        cumdate_interim = ${body.cumdate_interim || null},
        cumdate_final = ${body.cumdate_final || null},
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PUT dividend-plan Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Hapus saham dari plan
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
      DELETE FROM dividend_plan_stocks 
      WHERE id = ${id} AND user_id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE dividend-plan Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}