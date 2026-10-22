'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StockDetailPage() {
  const params = useParams()
  const router = useRouter()
  const kode = params.kode as string
  
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (kode) fetchStockDetail()
  }, [kode])

  const fetchStockDetail = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/stock/${kode}`)
      const result = await res.json()
      setData(result)
    } catch (error) {
      console.error('Gagal fetch stock detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatRupiah = (num: number) => {
    if (num === undefined || num === null) return '-'
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)
  }

  const formatTanggal = (date: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Memuat data saham...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="text-blue-600 hover:underline mb-2 block">← Kembali ke Dashboard</Link>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
            <p className="text-gray-600 dark:text-gray-400">Data saham tidak ditemukan</p>
          </div>
        </div>
      </div>
    )
  }

  // 🔥 FALLBACK UNTUK SEMUA ARRAY
  const marketData = data.market_data || null
  const portfolio = data.portfolio || []
  const transactions = data.transactions || []
  const watchlistData = data.watchlist || null
  const dividends = data.dividends || []

  const totalPortfolio = portfolio.reduce((acc: any, p: any) => {
    acc.lot += p.lot_aktual || 0
    acc.modal += p.modal_aktual || 0
    acc.nilai += p.nilai_pasar || 0
    acc.pl += p.unrealized_pl || 0
    return acc
  }, { lot: 0, modal: 0, nilai: 0, pl: 0 })

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:underline mb-2 block">← Kembali ke Dashboard</Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{data.kode}</h1>
              {marketData && (
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatRupiah(marketData.price)}
                  </span>
                  <span className={`text-lg font-semibold ${marketData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {marketData.change >= 0 ? '▲' : '▼'} {Math.abs(marketData.change).toFixed(2)} ({Math.abs(marketData.changePercent).toFixed(2)}%)
                  </span>
                </div>
              )}
            </div>
            <button onClick={fetchStockDetail} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
               Refresh
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Lot</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalPortfolio.lot}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Modal</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatRupiah(totalPortfolio.modal)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Nilai Pasar</p>
            <p className="text-2xl font-bold text-blue-600">{formatRupiah(totalPortfolio.nilai)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Unrealized P/L</p>
            <p className={`text-2xl font-bold ${totalPortfolio.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatRupiah(totalPortfolio.pl)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KOLOM KIRI */}
          <div className="lg:col-span-2 space-y-6">
            {/* POSISI PORTFOLIO */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Posisi Portfolio</h2>
              {portfolio.length > 0 ? (
                <div className="space-y-3">
                  {portfolio.map((p: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{p.rdn_nama}</p>
                          {p.rdn_kode_broker && (
                            <span className="inline-block mt-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded">
                              {p.rdn_kode_broker}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Lot</p>
                          <p className="font-bold text-gray-900 dark:text-white">{p.lot_aktual}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Avg Price</p>
                          <p className="font-semibold">{formatRupiah(p.avg_price)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Modal</p>
                          <p className="font-semibold">{formatRupiah(p.modal_aktual)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">P/L</p>
                          <p className={`font-bold ${p.unrealized_pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatRupiah(p.unrealized_pl)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Belum ada posisi saham ini</p>
              )}
            </div>

            {/* RIWAYAT TRANSAKSI */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Riwayat Transaksi</h2>
              {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="text-left py-2 px-3">Tanggal</th>
                        <th className="text-left py-2 px-3">RDN</th>
                        <th className="text-center py-2 px-3">Tipe</th>
                        <th className="text-right py-2 px-3">Lot</th>
                        <th className="text-right py-2 px-3">Harga</th>
                        <th className="text-right py-2 px-3">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {transactions.map((tx: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-2 px-3">{formatTanggal(tx.tanggal)}</td>
                          <td className="py-2 px-3 text-xs">{tx.rdn_nama} {tx.rdn_kode_broker && `(${tx.rdn_kode_broker})`}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              tx.tipe === 'BELI' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {tx.tipe}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">{tx.lot}</td>
                          <td className="py-2 px-3 text-right">{formatRupiah(tx.harga)}</td>
                          <td className="py-2 px-3 text-right font-semibold">{formatRupiah(tx.total_transaksi)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Belum ada transaksi</p>
              )}
            </div>
          </div>

          {/* KOLOM KANAN */}
          <div className="space-y-6">
            {/* WATCHLIST INFO */}
            {watchlistData && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Watchlist</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Target Price</p>
                    <p className="text-xl font-bold text-blue-600">{formatRupiah(watchlistData.target_price)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Current Price</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatRupiah(watchlistData.current_price)}</p>
                  </div>
                  {marketData && watchlistData.target_price && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-500">Jarak ke Target</p>
                      <p className={`text-lg font-bold ${
                        marketData.price >= watchlistData.target_price ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {marketData.price >= watchlistData.target_price ? '✓ Sudah capai!' : `${(((watchlistData.target_price - marketData.price) / marketData.price) * 100).toFixed(2)}% lagi`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MARKET INFO */}
            {marketData && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Info Pasar</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Previous Close</span>
                    <span className="font-semibold">{formatRupiah(marketData.previousClose)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Volume</span>
                    <span className="font-semibold">{marketData.volume?.toLocaleString() || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Currency</span>
                    <span className="font-semibold">{marketData.currency}</span>
                  </div>
                </div>
              </div>
            )}

            {/* QUICK ACTIONS */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aksi Cepat</h2>
              <div className="space-y-2">
                <Link 
                  href={`/dashboard/transaksi`}
                  className="block w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center"
                >
                  + Tambah Transaksi
                </Link>
                <button 
                  onClick={() => router.push('/dashboard/portfolio')}
                  className="block w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Lihat Portfolio
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}