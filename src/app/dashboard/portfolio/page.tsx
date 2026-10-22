'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({
    total_modal: 0,
    total_nilai_pasar: 0,
    total_unrealized_pl: 0,
    total_realized_pl: 0,
    total_pl: 0,
    total_pl_pct: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  
  // 🆕 State untuk grouping
  const [groupBy, setGroupBy] = useState<'saham' | 'rdn'>('saham')

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const fetchPortfolio = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    
    try {
      // 1. Fetch Holdings (dengan harga terbaru dari Yahoo)
      const resPortfolio = await fetch('/api/portfolio')
      const dataPortfolio = await resPortfolio.json()
      setHoldings(dataPortfolio.holdings || [])

      // 2. Fetch Summary
      const resSummary = await fetch('/api/dashboard-summary')
      const dataSummary = await resSummary.json()
      
      const s = dataSummary.summary || {}
      const totalPlPct = s.total_modal > 0 ? (s.total_pl / s.total_modal) * 100 : 0
      
      setSummary({
        total_modal: s.total_modal || 0,
        total_nilai_pasar: s.total_nilai_pasar || 0,
        total_unrealized_pl: s.total_unrealized_pl || 0,
        total_realized_pl: s.total_realized_pl || 0,
        total_pl: s.total_pl || 0,
        total_pl_pct: totalPlPct
      })

      // Update waktu terakhir refresh
      const now = new Date()
      setLastUpdated(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
      
    } catch (error) {
      console.error('Gagal fetch portfolio:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatRupiah = (num: number) => {
    if (num === undefined || num === null) return '-'
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)
  }

  // 🆕 Logic Grouping per RDN
  const groupedByRDN = holdings.reduce((acc: any, h: any) => {
    const rdnKey = `${h.rdn_id}-${h.rdn_nama}`
    if (!acc[rdnKey]) {
      acc[rdnKey] = {
        rdn_id: h.rdn_id,
        rdn_nama: h.rdn_nama,
        rdn_kode_broker: h.rdn_kode_broker,
        total_modal: 0,
        total_nilai_pasar: 0,
        total_unrealized_pl: 0,
        saham_count: 0
      }
    }
    acc[rdnKey].total_modal += h.modal_aktual || 0
    acc[rdnKey].total_nilai_pasar += h.nilai_pasar || 0
    acc[rdnKey].total_unrealized_pl += h.unrealized_pl || 0
    acc[rdnKey].saham_count += 1
    return acc
  }, {})

  const rdnGroups = Object.values(groupedByRDN)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Memuat portfolio...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Link href="/dashboard" className="text-blue-600 hover:underline mb-2 block">← Kembali ke Dashboard</Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ringkasan Portfolio</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {holdings.length} posisi saham aktif
              {lastUpdated && <span className="ml-2 text-xs text-gray-500">• Update terakhir: {lastUpdated}</span>}
            </p>
          </div>
          <button 
            onClick={() => fetchPortfolio(true)} 
            disabled={refreshing}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {refreshing ? '⏳ Memuat...' : '🔄 Refresh Harga'}
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Modal</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatRupiah(summary.total_modal)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Nilai Pasar</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatRupiah(summary.total_nilai_pasar)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Profit / Loss</p>
            <p className={`text-2xl font-bold ${summary.total_pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatRupiah(summary.total_pl)}
            </p>
            <p className={`text-xs mt-1 ${summary.total_pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.total_pl_pct >= 0 ? '+' : ''}{summary.total_pl_pct?.toFixed(2)}%
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Realized P/L</p>
            <p className={`text-2xl font-bold ${summary.total_realized_pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatRupiah(summary.total_realized_pl)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dari transaksi jual</p>
          </div>
        </div>

        {/* TABEL POSISI SAHAM */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Posisi Saham</h2>
            
            {/* 🆕 Tombol Toggle Grouping */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setGroupBy('saham')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${
                  groupBy === 'saham'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Per Saham
              </button>
              <button
                onClick={() => setGroupBy('rdn')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${
                  groupBy === 'rdn'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Per RDN
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-xs">
                {groupBy === 'saham' ? (
                  <tr>
                    <th className="px-4 py-3">Kode</th>
                    <th className="px-4 py-3">RDN</th>
                    <th className="px-4 py-3 text-right">Lot</th>
                    <th className="px-4 py-3 text-right">Avg Price</th>
                    <th className="px-4 py-3 text-right">Modal</th>
                    <th className="px-4 py-3 text-right">Harga Pasar</th>
                    <th className="px-4 py-3 text-right">Nilai</th>
                    <th className="px-4 py-3 text-right">Unrealized P/L</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-4 py-3">Nama Sekuritas (RDN)</th>
                    <th className="px-4 py-3 text-center">Jumlah Saham</th>
                    <th className="px-4 py-3 text-right">Total Modal</th>
                    <th className="px-4 py-3 text-right">Total Nilai Pasar</th>
                    <th className="px-4 py-3 text-right">Unrealized P/L</th>
                    <th className="px-4 py-3 text-right">P/L %</th>
                  </tr>
                )}
              </thead>
              
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {holdings.length === 0 ? (
                  <tr>
                    <td colSpan={groupBy === 'saham' ? 8 : 6} className="text-center py-8 text-gray-500">
                      Belum ada posisi saham.
                    </td>
                  </tr>
                ) : groupBy === 'saham' ? (
                  // Tampilan Per Saham
                  holdings.map((h, idx) => (
                    <tr key={`${h.rdn_id}-${h.kode_saham}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-white">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/stock/${h.kode_saham}`} className="font-bold text-base text-blue-600 hover:underline">
                          {h.kode_saham}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium">{h.rdn_nama}</div>
                        {h.rdn_kode_broker && (
                          <span className="inline-block mt-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono">
                            {h.rdn_kode_broker}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{h.lot_aktual}</td>
                      <td className="px-4 py-3 text-right">{formatRupiah(h.avg_price)}</td>
                      <td className="px-4 py-3 text-right">{formatRupiah(h.modal_aktual)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-semibold">{formatRupiah(h.current_price)}</div>
                        {h.change_pct !== undefined && (
                          <div className={`text-[10px] font-medium ${h.change_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {h.change_pct >= 0 ? '▲' : '▼'} {Math.abs(h.change_pct).toFixed(2)}%
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{formatRupiah(h.nilai_pasar)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className={`font-bold ${h.unrealized_pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {h.unrealized_pl >= 0 ? '+' : ''}{formatRupiah(h.unrealized_pl)}
                        </div>
                        <div className={`text-[10px] ${h.unrealized_pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {h.unrealized_pl_pct >= 0 ? '+' : ''}{h.unrealized_pl_pct?.toFixed(2)}%
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  // Tampilan Per RDN
                  rdnGroups.map((rdn: any, idx: number) => {
                    const plPct = rdn.total_modal > 0 ? (rdn.total_unrealized_pl / rdn.total_modal) * 100 : 0
                    return (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-white">
                        <td className="px-4 py-4">
                          <div className="font-bold text-gray-900 dark:text-white text-base">{rdn.rdn_nama}</div>
                          {rdn.rdn_kode_broker && (
                            <span className="inline-block mt-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded font-mono">
                              {rdn.rdn_kode_broker}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-bold">
                            {rdn.saham_count} emiten
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold">{formatRupiah(rdn.total_modal)}</td>
                        <td className="px-4 py-4 text-right font-semibold text-blue-600">{formatRupiah(rdn.total_nilai_pasar)}</td>
                        <td className={`px-4 py-4 text-right font-bold ${rdn.total_unrealized_pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {rdn.total_unrealized_pl >= 0 ? '+' : ''}{formatRupiah(rdn.total_unrealized_pl)}
                        </td>
                        <td className={`px-4 py-4 text-right font-bold ${plPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {plPct >= 0 ? '+' : ''}{plPct.toFixed(2)}%
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}