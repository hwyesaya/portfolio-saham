import { neon } from '@neondatabase/serverless'
import { auth } from '@clerk/nextjs/server'

// Inisialisasi koneksi ke Neon DB
export const sql = neon(process.env.DATABASE_URL!)

// Fungsi helper untuk mendapatkan user_id dari Clerk
export async function getCurrentUserId(): Promise<string> {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('User tidak terautentikasi. Silakan login.')
  }

  return userId
}