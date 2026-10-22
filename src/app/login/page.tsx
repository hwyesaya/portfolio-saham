'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (isRegister) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage('Error: ' + error.message)
      } else {
        setMessage('Registrasi berhasil! Silakan cek email untuk verifikasi.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage('Error: ' + error.message)
      } else {
        router.replace('/dashboard')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 transition-colors">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">Portfolio Saham</h1>
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-6">{isRegister ? 'Buat akun baru' : 'Masuk ke akun kamu'}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs md:text-sm font-bold text-gray-900 dark:text-gray-200">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded border border-gray-300 dark:border-gray-600 p-2 md:p-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm md:text-base" placeholder="email@example.com" />
            </div>
            <div>
              <label className="mb-1 block text-xs md:text-sm font-bold text-gray-900 dark:text-gray-200">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded border border-gray-300 dark:border-gray-600 p-2 md:p-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm md:text-base" placeholder="Minimal 6 karakter" minLength={6} />
            </div>

            {message && (
              <div className={`p-3 rounded text-xs md:text-sm ${message.includes('Error') ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'}`}>
                {message}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full rounded bg-blue-600 py-2 md:py-3 text-white hover:bg-blue-700 font-medium text-sm md:text-base disabled:opacity-50">
              {loading ? 'Memproses...' : (isRegister ? 'Daftar' : 'Masuk')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button onClick={() => { setIsRegister(!isRegister); setMessage('') }} className="text-xs md:text-sm text-blue-600 dark:text-blue-400 hover:underline">
              {isRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}