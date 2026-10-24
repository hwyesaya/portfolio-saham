'use client'

import { useEffect, useState } from 'react'

export default function AlertBox() {
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

  if (loading || alerts.length === 0) return null

  return (
    <div className="mb-6 space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notifikasi Portfolio</h3>
      {alerts.slice(0, 5).map((alert, idx) => (
        <div
          key={idx}
          className={
            alert.type === 'danger'
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-3 rounded-lg text-sm flex items-start gap-2'
              : alert.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 p-3 rounded-lg text-sm flex items-start gap-2'
              : alert.type === 'warning'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg text-sm flex items-start gap-2'
              : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 p-3 rounded-lg text-sm flex items-start gap-2'
          }
        >
          <span className="text-lg">
            {alert.type === 'danger' ? '' : alert.type === 'success' ? '' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <div className="flex-1">
            <p className="font-medium">{alert.message}</p>
            {alert.detail && <p className="text-xs mt-1 opacity-80">{alert.detail}</p>}
          </div>
        </div>
      ))}
      {alerts.length > 5 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          +{alerts.length - 5} notifikasi lainnya
        </p>
      )}
    </div>
  )
}