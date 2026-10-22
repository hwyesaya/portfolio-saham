'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'

export default function StatisticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/statistics')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Gagal fetch statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatRupiah = (num: number) => {
    if (num === undefined || num === null) return '-'
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)
  }

  const formatNumber = (num: number, decimals = 2) => {
    if (num === undefined || num === null) return '0'
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: decimals }).format(num)
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Memuat statistik...</p>
      </div>
    )
  }

  if (!stats || stats.summary.total_trades === 0) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="text-blue-600 hover:underline mb-2 block">← Kembali ke Dashboard</Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Statistik Trading</h1>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
            <p className="text-gray-600 dark:text-gray-400">Belum ada data transaksi. Mulai trading untuk melihat statistik!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Link href="/dashboard" className="text-blue-600 hover:underline mb-2 block">← Kembali ke Dashboard</Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Statistik Trading</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Analisis performa trading kamu</p>
          </div>
          <button onClick={fetchStatistics} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
            🔄 Refresh
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Transaksi</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.summary.total_trades}</p>
            <p className="text-xs text-gray-500 mt-1">Beli: {stats.summary.total_beli} | Jual: {stats.summary.total_jual}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Win Rate</p>
            <p className={`text-2xl font-bold ${stats.summary.win_rate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
              {formatNumber(stats.summary.win_rate)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Dari {stats.biggest_winners.length + stats.biggest_losers.length} trade closed</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Profit</p>
            <p className="text-2xl font-bold text-green-600">{formatRupiah(stats.summary.total_profit)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Loss</p>
            <p className="text-2xl font-bold text-red-600">{formatRupiah(stats.summary.total_loss)}</p>
            <p className="text-xs text-gray-500 mt-1">Net: {formatRupiah(stats.summary.net_profit)}</p>
          </div>
        </div>

        {/* CHARTS ROW 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Portfolio Distribution */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribusi Portfolio</h2>
            {stats.portfolio_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.portfolio_distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="modal"
                  >
                    {stats.portfolio_distribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatRupiah(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">Belum ada posisi saham</p>
            )}
          </div>

          {/* Favorite Stocks */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Saham Favorit</h2>
            {stats.favorite_stocks.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.favorite_stocks}>
                  <XAxis dataKey="kode" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">Belum ada data</p>
            )}
          </div>
        </div>

        {/* BROKER PERFORMANCE */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performa per Broker</h2>
          {stats.broker_performance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-300">Broker</th>
                    <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-300">Lot Beli</th>
                    <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-300">Lot Jual</th>
                    <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-300">Avg Price</th>
                    <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-300">Profit/Loss</th>
                    <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-300">P/L %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {stats.broker_performance.map((broker: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{broker.nama}</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{broker.lot_beli}</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{broker.lot_jual}</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{formatRupiah(broker.avg_price)}</td>
                      <td className={`py-3 px-4 text-right font-bold ${broker.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatRupiah(broker.profit_loss)}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${broker.profit_loss_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatNumber(broker.profit_loss_pct)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Belum ada data broker</p>
          )}
        </div>

        {/* WINNERS & LOSERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Biggest Winners */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-green-600 mb-4"> Biggest Winners</h2>
            {stats.biggest_winners.length > 0 ? (
              <div className="space-y-3">
                {stats.biggest_winners.map((winner: any, idx: number) => (
                  <div key={idx} className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{winner.kode_saham}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {winner.rdn_nama} {winner.rdn_kode_broker && `(${winner.rdn_kode_broker})`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+{formatRupiah(winner.profit_loss)}</p>
                        <p className="text-xs text-green-600">+{formatNumber(winner.profit_loss_pct)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Belum ada profit</p>
            )}
          </div>

          {/* Biggest Losers */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-red-600 mb-4">💔 Biggest Losers</h2>
            {stats.biggest_losers.length > 0 ? (
              <div className="space-y-3">
                {stats.biggest_losers.map((loser: any, idx: number) => (
                  <div key={idx} className="bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{loser.kode_saham}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {loser.rdn_nama} {loser.rdn_kode_broker && `(${loser.rdn_kode_broker})`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{formatRupiah(loser.profit_loss)}</p>
                        <p className="text-xs text-red-600">{formatNumber(loser.profit_loss_pct)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Belum ada loss</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}