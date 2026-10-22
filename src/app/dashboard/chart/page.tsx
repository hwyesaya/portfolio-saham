'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ChartPage() {
  const [transaksiList, setTransaksiList] = useState<any[]>([])
  const [cashflowList, setCashflowList] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

  useEffect(() => {
    checkUser()
    fetchData()
  }, [])

  useEffect(() => {
    if (transaksiList.length > 0 || cashflowList.length > 0) {
      calculateMonthlyProfit(transaksiList, cashflowList, selectedYear)
    }
  }, [selectedYear, transaksiList, cashflowList])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) window.location.replace('/login')
  }

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const [transRes, cfRes] = await Promise.all([
      supabase.from('transaction').select('*').eq('user_id', session.user.id).order('tanggal', { ascending: true }),
      supabase.from('cashflow').select('*').eq('user_id', session.user.id).order('tanggal', { ascending: true })
    ])

    setTransaksiList(transRes.data || [])
    setCashflowList(cfRes.data || [])

    const allDates = [
      ...(transRes.data || []).map(t => new Date(t.tanggal).getFullYear()),
      ...(cfRes.data || []).map(c => new Date(c.tanggal).getFullYear())
    ]
    const years = [...new Set(allDates)].sort()
    
    if (years.length > 0) {
      setAvailableYears(years)
      setSelectedYear(years[years.length - 1])
    } else {
      setAvailableYears([new Date().getFullYear()])
    }

    setLoading(false)
  }

  const calculateMonthlyProfit = (transactions: any[], cashflows: any[], year: number) => {
    const monthMap: any = {}
    monthNames.forEach((name, idx) => {
      monthMap[idx] = {
        month: name,
        capitalGain: 0,
        capitalLoss: 0,
        dividend: 0,
        totalTrades: 0
      }
    })

    const yearTransactions = transactions.filter(t => new Date(t.tanggal).getFullYear() === year)
    yearTransactions.forEach(t => {
      if (t.aksi === 'jual') {
        const month = new Date(t.tanggal).getMonth()
        monthMap[month].totalTrades++
        
        const sellValue = t.harga * t.jumlah_lot * 100
        const fee = t.fee || 0
        const estimatedCost = sellValue * 0.95
        const realizedPL = sellValue - estimatedCost - fee
        
        if (realizedPL > 0) {
          monthMap[month].capitalGain += realizedPL
        } else {
          monthMap[month].capitalLoss += Math.abs(realizedPL)
        }
      }
    })

    const yearCashflows = cashflows.filter(c => new Date(c.tanggal).getFullYear() === year && c.Type === 'dividen')
    yearCashflows.forEach(c => {
      const month = new Date(c.tanggal).getMonth()
      monthMap[month].dividend += c.amount || 0
    })

    const monthlyArray = Object.values(monthMap).map((item: any) => ({
      ...item,
      net: item.capitalGain + item.dividend - item.capitalLoss
    }))

    setMonthlyData(monthlyArray)
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)
  }

  const totalCapitalGain = monthlyData.reduce((sum, m) => sum + m.capitalGain, 0)
  const totalCapitalLoss = monthlyData.reduce((sum, m) => sum + m.capitalLoss, 0)
  const totalDividend = monthlyData.reduce((sum, m) => sum + m.dividend, 0)
  const totalNet = totalCapitalGain + totalDividend - totalCapitalLoss

  if (loading) return <div className="p-8 text-center text-gray-900 dark:text-white">Memuat data...</div>

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8 transition-colors">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
          ← Kembali ke Dashboard
        </Link>
        
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
           Laporan Profit Bulanan
        </h1>

        <div className="mb-6 flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pilih Tahun:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm font-medium"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">Capital Gain</p>
            <p className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">+{formatRupiah(totalCapitalGain)}</p>
            <p className="text-[10px] text-gray-500 mt-1">Dari transaksi jual</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">Total Dividen</p>
            <p className="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">+{formatRupiah(totalDividend)}</p>
            <p className="text-[10px] text-gray-500 mt-1">Passive income</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">Capital Loss</p>
            <p className="text-lg md:text-xl font-bold text-red-600 dark:text-red-400">-{formatRupiah(totalCapitalLoss)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">Total Profit Bersih</p>
            <p className={`text-lg md:text-xl font-bold ${totalNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {totalNet >= 0 ? '+' : ''}{formatRupiah(totalNet)}
            </p>
            <p className="text-[10px] text-gray-500 mt-1">Gain + Dividen - Loss</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Detail per Bulan — {selectedYear}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400 font-medium">Bulan</th>
                  <th className="text-right py-2 text-gray-600 dark:text-gray-400 font-medium">Capital Gain</th>
                  <th className="text-right py-2 text-gray-600 dark:text-gray-400 font-medium">Dividen</th>
                  <th className="text-right py-2 text-gray-600 dark:text-gray-400 font-medium">Loss</th>
                  <th className="text-right py-2 text-gray-600 dark:text-gray-400 font-medium">Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((month, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 font-bold text-gray-900 dark:text-white">{month.month}</td>
                    <td className="py-3 text-right text-green-600 dark:text-green-400 font-medium">
                      {month.capitalGain > 0 ? `+${formatRupiah(month.capitalGain)}` : '-'}
                    </td>
                    <td className="py-3 text-right text-blue-600 dark:text-blue-400 font-medium">
                      {month.dividend > 0 ? `+${formatRupiah(month.dividend)}` : '-'}
                    </td>
                    <td className="py-3 text-right text-red-600 dark:text-red-400 font-medium">
                      {month.capitalLoss > 0 ? `-${formatRupiah(month.capitalLoss)}` : '-'}
                    </td>
                    <td className={`py-3 text-right font-bold ${month.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {month.net !== 0 ? `${month.net >= 0 ? '+' : ''}${formatRupiah(month.net)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}