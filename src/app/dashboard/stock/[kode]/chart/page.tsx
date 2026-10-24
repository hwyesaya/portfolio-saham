'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StockChartPage() {
  const params = useParams()
  const router = useRouter()
  const kode = params.kode as string
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!kode) return
    
    fetch('/api/stock-history?code=' + kode)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setChartData(data.chartData || [])
        }
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [kode])

  const formatRupiah = (num: number) => {
    if (num === undefined || num === null) return '-'
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Memuat chart...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Link href={'/dashboard/stock/' + kode} className="text-blue-600 hover:underline mb-4 block">← Kembali ke Detail Saham</Link>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-lg">
            <p className="text-red-800 dark:text-red-200">Gagal memuat chart: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Link href={'/dashboard/stock/' + kode} className="text-blue-600 hover:underline mb-4 block">← Kembali ke Detail Saham</Link>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Tidak Ada Data Chart</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Data historis tidak tersedia untuk {kode}. Coba refresh harga terlebih dahulu.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Hitung min/max untuk scaling
  const prices = chartData.map(d => d.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice || 1

  const firstPrice = chartData[0].price
  const lastPrice = chartData[chartData.length - 1].price
  const change = lastPrice - firstPrice
  const changePct = firstPrice > 0 ? (change / firstPrice) * 100 : 0
  const isPositive = change >= 0

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link href={'/dashboard/stock/' + kode} className="text-blue-600 hover:underline mb-2 block">← Kembali ke Detail Saham</Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chart {kode}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Pergerakan harga 30 hari terakhir
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Harga Terakhir</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatRupiah(lastPrice)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Perubahan 30 Hari</p>
            <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{formatRupiah(change)}
            </p>
            <p className={`text-xs mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{changePct.toFixed(2)}%
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Range 30 Hari</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatRupiah(minPrice)}</p>
            <p className="text-sm text-gray-500">s/d {formatRupiah(maxPrice)}</p>
          </div>
        </div>

        {/* Chart Area */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Grafik Harga</h2>
          
          {/* Custom SVG Chart */}
          <div className="relative w-full" style={{ height: '400px' }}>
            <svg
              viewBox="0 0 800 400"
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map(i => (
                <line
                  key={i}
                  x1="0"
                  y1={i * 100}
                  x2="800"
                  y2={i * 100}
                  stroke="currentColor"
                  className="text-gray-200 dark:text-gray-700"
                  strokeWidth="1"
                />
              ))}

              {/* Price line */}
              <polyline
                points={chartData.map((d, i) => {
                  const x = (i / (chartData.length - 1)) * 800
                  const y = 400 - ((d.price - minPrice) / priceRange) * 350 - 25
                  return `${x},${y}`
                }).join(' ')}
                fill="none"
                stroke={isPositive ? '#10b981' : '#ef4444'}
                strokeWidth="2"
              />

              {/* Area under line */}
              <polygon
                points={
                  `0,400 ` +
                  chartData.map((d, i) => {
                    const x = (i / (chartData.length - 1)) * 800
                    const y = 400 - ((d.price - minPrice) / priceRange) * 350 - 25
                    return `${x},${y}`
                  }).join(' ') +
                  ` 800,400`
                }
                fill={isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
              />

              {/* Data points */}
              {chartData.map((d, i) => {
                const x = (i / (chartData.length - 1)) * 800
                const y = 400 - ((d.price - minPrice) / priceRange) * 350 - 25
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="3"
                    fill={isPositive ? '#10b981' : '#ef4444'}
                  />
                )
              })}
            </svg>

            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
              <span>{formatRupiah(maxPrice)}</span>
              <span>{formatRupiah(minPrice + priceRange * 0.75)}</span>
              <span>{formatRupiah(minPrice + priceRange * 0.5)}</span>
              <span>{formatRupiah(minPrice + priceRange * 0.25)}</span>
              <span>{formatRupiah(minPrice)}</span>
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{chartData[0]?.date}</span>
            <span>{chartData[Math.floor(chartData.length / 4)]?.date}</span>
            <span>{chartData[Math.floor(chartData.length / 2)]?.date}</span>
            <span>{chartData[Math.floor(chartData.length * 0.75)]?.date}</span>
            <span>{chartData[chartData.length - 1]?.date}</span>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 mt-6 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Data Harian</h3>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-200">Tanggal</th>
                  <th className="px-4 py-2 text-right text-gray-600 dark:text-gray-200">Harga</th>
                  <th className="px-4 py-2 text-right text-gray-600 dark:text-gray-200">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {chartData.slice().reverse().map((d, i) => {
                  const prevPrice = chartData[chartData.length - i - 2]?.price || d.price
                  const dailyChange = d.price - prevPrice
                  const dailyPct = prevPrice > 0 ? (dailyChange / prevPrice) * 100 : 0
                  return (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-2 text-gray-900 dark:text-white">{d.date}</td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-900 dark:text-white">
                        {formatRupiah(d.price)}
                      </td>
                      <td className={`px-4 py-2 text-right ${dailyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {dailyChange >= 0 ? '+' : ''}{dailyPct.toFixed(2)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}