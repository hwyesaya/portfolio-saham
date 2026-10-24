'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/alerts')
      .then(res => res.json())
      .then(data => {
        setAlerts(data.alerts || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch alerts:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Memuat notifikasi...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:underline mb-2 block">← Kembali ke Dashboard</Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifikasi Portfolio</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {alerts.length} notifikasi aktif
          </p>
        </div>

        {alerts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Tidak Ada Notifikasi</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Portfolio kamu dalam kondisi normal.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={
                  alert.type === 'danger'
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg'
                    : alert.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg'
                    : alert.type === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg'
                    : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg'
                }
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {alert.type === 'danger' ? '🔴' : alert.type === 'success' ? '🟢' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{alert.message}</p>
                    {alert.detail && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.detail}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}