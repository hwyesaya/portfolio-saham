'use server'

import { sql, getCurrentUserId } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getCashflowData2() {
  const userId = await getCurrentUserId()
  
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
  
  return { cashflows, rdns }
}

async function adjustRdnBalance(rdnId: number, type: string, amount: number, multiplier: number, userId: string) {
  if (!rdnId) return
  
  let adjustment = 0
  if (type === 'deposit' || type === 'dividen') {
    adjustment = amount * multiplier
  } else if (type === 'withdraw') {
    adjustment = -amount * multiplier
  }
  
  await sql`
    UPDATE rdn 
    SET cash_balance = cash_balance + ${adjustment}
    WHERE id = ${rdnId} AND user_id = ${userId}
  `
}

export async function handleAddCashflow2(data: any) {
  const userId = await getCurrentUserId()
  const amount = parseFloat(data.amount)
  
  await sql`
    INSERT INTO cashflow (user_id, tanggal, Type, amount, rdn_id, kode_saham, keterangan)
    VALUES (${userId}, ${data.tanggal}, ${data.Type}, ${amount}, ${data.rdn_id || null}, ${data.kode_saham || null}, ${data.keterangan || ''})
  `
  
  if (data.rdn_id) {
    await adjustRdnBalance(data.rdn_id, data.Type, amount, 1, userId)
  }
  
  revalidatePath('/dashboard/cashflow')
}

export async function handleUpdateCashflow2(id: number, oldData: any, newData: any) {
  const userId = await getCurrentUserId()
  const newAmount = parseFloat(newData.amount)
  const oldAmount = parseFloat(oldData.amount)

  if (oldData.rdn_id) {
    await adjustRdnBalance(oldData.rdn_id, oldData.Type, oldAmount, -1, userId)
  }

  await sql`
    UPDATE cashflow 
    SET tanggal = ${newData.tanggal}, Type = ${newData.Type}, amount = ${newAmount}, 
        rdn_id = ${newData.rdn_id || null}, kode_saham = ${newData.kode_saham || null}, 
        keterangan = ${newData.keterangan || ''}
    WHERE id = ${id} AND user_id = ${userId}
  `

  if (newData.rdn_id) {
    await adjustRdnBalance(newData.rdn_id, newData.Type, newAmount, 1, userId)
  }
  
  revalidatePath('/dashboard/cashflow')
}

export async function handleDeleteCashflow2(id: number, oldData: any) {
  const userId = await getCurrentUserId()
  
  if (oldData.rdn_id) {
    await adjustRdnBalance(oldData.rdn_id, oldData.Type, parseFloat(oldData.amount), -1, userId)
  }

  await sql`
    DELETE FROM cashflow 
    WHERE id = ${id} AND user_id = ${userId}
  `
  
  revalidatePath('/dashboard/cashflow')
}