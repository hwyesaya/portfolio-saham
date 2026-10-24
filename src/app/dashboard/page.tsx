'use client'
import AlertBox from '@/components/AlertBox'

import { useEffect, useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import Link from 'next/link'
import DarkModeToggle from '@/components/DarkModeToggle'

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const [watchlist, setWatchlist] = useState<any[]>([])
  const [newStock, setNewStock] = useState({ kode_saham: '', target_price: '' })

  const [alerts, setAlerts] = useState<any[]>([])
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [loadingWatchlist, setLoadingWatchlist] = useState(true)
  const [summary, setSummary] = useState<any>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [editId, setEditId] = useState<number | null>(null)
  const [editStock, setEditStock] = useState({ kode_saham: '', target_price: '' })

  useEffect(() => {

  // Fetch alerts
  useEffect(() => {
    fetch('/api/alerts')
      .then(res => res.json())
      .then(data => {
        setAlerts(data.alerts || [])
        setAlertsLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch alerts:', err)
        setAlertsLoading(false)
      })
  }, [])
    if (isLoaded && user) {
      fetchWatchlist()
      fetchSummary()
    }
  }, [isLoaded, user])

  const fetchWatchlist = async () => {
    setLoadingWatchlist(true)
    try {
      const res = await fetch('/api/watchlist')
      const data = await res.json()
      setWatchlist(data.watchlist || [])
      
      if (data.watchlist && data.watchlist.length > 0) {
        await fetchPrices(data.watchlist)
      }
    } catch (error) {
      console.error('Gagal fetch watchlist:', error)
    } finally {
      setLoadingWatchlist(false)
    }
  }

  const fetchSummary = async () => {
    setLoadingSummary(true)
    try {
      const res = await fetch('/api/dashboard-summary')
      const data = await res.json()
      setSummary(data.summary)
    } catch (error) {
      console.error('Gagal fetch summary:', error)
    } finally {
      setLoadingSummary(false)
    }
  }

  const fetchPrices = async (items: any[]) => {
    const updatedItems = [...items]
    
    await Promise.all(updatedItems.map(async (item, index) => {
      try {
        const res = await fetch(`/api/stock-price?code=${item.kode_saham}`)
        const data = await res.json()
        
        if (data.price) {
          updatedItems[index].current_price = data.price
          updatedItems[index].previous_close = data.previousClose
          const change = data.price - data.previousClose
          const changePct = (change / data.previousClose) * 100
          updatedItems[index].change = change
          updatedItems[index].changePct = changePct
        }
      } catch (error) {
        console.error(`Gagal fetch harga untuk ${item.kode_saham}`, error)
      }
    }))

    setWatchlist(updatedItems)
  }

  const handleAddWatchlist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStock.kode_saham || !newStock.target_price) {
      alert('Kode saham dan target price harus diisi')
      return
    }

    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStock)
      })
      
      if (res.ok) {
        setNewStock({ kode_saham: '', target_price: '' })
        await fetchWatchlist()
      } else {
        const err = await res.json()
        alert('Error: ' + err.error)
      }
    } catch (error) {
      alert('Gagal menambah watchlist')
    }
  }

  const handleEditWatchlist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editStock.kode_saham || !editStock.target_price || editId === null) return

    try {
      const res = await fetch('/api/watchlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...editStock })
      })
      
      if (res.ok) {
        setEditId(null)
        setEditStock({ kode_saham: '', target_price: '' })
        await fetchWatchlist()
      } else {
        const err = await res.json()
        alert('Error: ' + err.error)
      }
    } catch (error) {
      alert('Gagal mengupdate watchlist')
    }
  }

  const startEdit = (item: any) => {
    setEditId(item.id)
    setEditStock({
      kode_saham: item.kode_saham,
      target_price: String(item.target_price)
    })
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditStock({ kode_saham: '', target_price: '' })
  }

  const handleDeleteWatchlist = async (id: number) => {
    if (!confirm('Yakin hapus dari watchlist?')) return
    
    try {
      const res = await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      
      if (res.ok) {
        await fetchWatchlist()
      }
    } catch (error) {
      alert('Gagal menghapus watchlist')
    }
  }

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  const menuItems = [
    { name: 'RDN', href: '/dashboard/rdn', color: 'bg-blue-600 dark:bg-blue-700', icon: '🏦' },
    { name: 'Transaksi', href: '/dashboard/transaksi', color: 'bg-green-600 dark:bg-green-700', icon: '📈' },
    { name: 'Cashflow', href: '/dashboard/cashflow', color: 'bg-yellow-500 dark:bg-yellow-600', icon: '💰' },
    { name: 'Portfolio', href: '/dashboard/portfolio', color: 'bg-purple-600 dark:bg-purple-700', icon: '📊' },
    { name: 'Dividen', href: '/dashboard/dividend', color: 'bg-teal-600 dark:bg-teal-700', icon: '💵' },
    { name: 'Statistics', href: '/dashboard/statistics', color: 'bg-pink-600 dark:bg-pink-700', icon: '🎯' },
    { name: 'Calculator', href: '/dashboard/calculator', color: 'bg-orange-600 dark:bg-orange-700', icon: '🧮' },
    { name: 'Chart', href: '/dashboard/chart', color: 'bg-indigo-600 dark:bg-indigo-700', icon: '📉' },
  ]

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)
  }

  if (!isLoaded) {
    return <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center"><Link href="/dashboard/alerts" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">🔔 Notifikasi</Link>
      <AlertBox />

        {/* ALERT BOX */}
        {!alertsLoading && alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notifikasi Portfolio</h3>
            {alerts.slice(0, 5).map((alert, idx) => (
              <div
                key={idx}
                className={
                  alert.type === 'danger'
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                    : alert.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                    : alert.type === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200'
                    : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
                }
                className="p-3 rounded-lg text-sm flex items-start gap-2"
              >
                <span className="text-lg">
                  {alert.type === 'danger' ? '🔴' : alert.type === 'success' ? '🟢' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
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
        )}

      <p className="text-gray-600 dark:text-gray-400">Memuat...</p>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-6 transition-colors">
      <div className="mx-auto max-w-7xl">
        
        {/* HEADER */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Portfolio Saham <span className="text-xl"></span>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 break-all">
              Selamat Datang, <span className="font-medium text-gray-900 dark:text-gray-200">{user?.emailAddresses[0]?.emailAddress || 'User'}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <button
              onClick={handleLogout}
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 font-medium transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3"> Ringkasan Portfolio</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Modal</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {loadingSummary ? '...' : summary ? formatRupiah(summary.total_modal) : '-'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Nilai Pasar</p>
              <p className="text-lg font-bold text-blue-600">
                {loadingSummary ? '...' : summary ? formatRupiah(summary.total_nilai_pasar) : '-'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total P/L</p>
              <p className={`text-lg font-bold ${summary?.total_pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {loadingSummary ? '...' : summary ? formatRupiah(summary.total_pl) : '-'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Dividen</p>
              <p className="text-lg font-bold text-yellow-600">
                {loadingSummary ? '...' : summary ? formatRupiah(summary.total_dividen) : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* LAYOUT UTAMA */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* KOLOM KIRI: Menu */}
          <div className="lg:w-3/5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">📌 Menu Utama</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {menuItems.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`${item.color} rounded-lg p-4 text-center text-white shadow-lg transition hover:opacity-90 hover:scale-[1.02] flex flex-col justify-center items-center min-h-[90px]`}
                >
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <h2 className="text-sm font-bold">{item.name}</h2>
                </Link>
              ))}
            </div>
          </div>

          {/* KOLOM KANAN: Watchlist */}
          <div className="lg:w-2/5">
            <div className="rounded-lg bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700 transition-colors flex flex-col h-[600px]">
              
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">👁️ Watchlist</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {watchlist.length} saham dipantau
                  </p>
                </div>
              </div>

              <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                {editId !== null ? (
                  <form onSubmit={handleEditWatchlist} className="space-y-2">
                    <input
                      type="text"
                      value={editStock.kode_saham}
                      onChange={(e) => setEditStock({ ...editStock, kode_saham: e.target.value.toUpperCase() })}
                      placeholder="Kode Saham"
                      className="w-full rounded border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm"
                      required
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={editStock.target_price}
                      onChange={(e) => setEditStock({ ...editStock, target_price: e.target.value })}
                      placeholder="Target Price (Rp)"
                      className="w-full rounded border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm"
                      required
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 rounded bg-green-600 px-3 py-1.5 text-white hover:bg-green-700 font-medium text-sm">Simpan</button>
                      <button type="button" onClick={cancelEdit} className="rounded bg-gray-500 px-3 py-1.5 text-white hover:bg-gray-600 font-medium text-sm">Batal</button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleAddWatchlist} className="flex gap-2">
                    <input
                      type="text"
                      value={newStock.kode_saham}
                      onChange={(e) => setNewStock({ ...newStock, kode_saham: e.target.value.toUpperCase() })}
                      placeholder="Kode (BBCA)"
                      className="flex-1 rounded border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm"
                      required
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={newStock.target_price}
                      onChange={(e) => setNewStock({ ...newStock, target_price: e.target.value })}
                      placeholder="Target"
                      className="w-24 rounded border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm"
                      required
                    />
                    <button type="submit" className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 font-medium text-sm">+</button>
                  </form>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loadingWatchlist ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">Memuat watchlist...</p>
                ) : watchlist.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">Belum ada saham di watchlist.</p>
                ) : (
                  watchlist.map((item) => {
                    const distanceToTarget = item.current_price 
                      ? ((item.target_price - item.current_price) / item.current_price) * 100 
                      : 0
                    const isTargetPositive = distanceToTarget >= 0
                    
                    return (
                      <div 
                        key={item.id} 
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Link 
                                href={`/dashboard/stock/${item.kode_saham}`} 
                                className="font-bold text-gray-900 dark:text-white text-base hover:text-blue-600 hover:underline cursor-pointer"
                              >
                                {item.kode_saham}
                              </Link>
                              {item.current_price && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isTargetPositive ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                                }`}>
                                  {isTargetPositive ? '▲' : '▼'} {Math.abs(distanceToTarget).toFixed(1)}%
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Harga: </span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {item.current_price ? formatRupiah(item.current_price) : '-'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Target: </span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">{formatRupiah(item.target_price)}</span>
                              </div>
                            </div>
                            {item.changePct !== undefined && (
                              <div className="mt-1">
                                <span className={`text-[10px] font-medium ${
                                  item.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.changePct).toFixed(2)}% hari ini
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <button onClick={() => startEdit(item)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-[10px] font-medium">Edit</button>
                            <button onClick={() => handleDeleteWatchlist(item.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-[10px] font-medium">Hapus</button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}