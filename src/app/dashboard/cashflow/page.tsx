'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CashflowPage() {
  const [cashflowList, setCashflowList] = useState<any[]>([])
  const [rdnList, setRdnList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [newCashflow, setNewCashflow] = useState({
    tanggal: '', Type: 'deposit', amount: '', rdn_id: '', kode_saham: '', keterangan: ''
  })

  // 🆕 State untuk Ringkasan Bulanan
  const [monthlySummary, setMonthlySummary] = useState<any[]>([])
  const [loadingSummary, setLoadingSummary] = useState(true)

  useEffect(() => {
    fetchData()
    fetchMonthlySummary()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cashflow')
      const data = await res.json()
      setCashflowList(data.cashflows || [])
      setRdnList(data.rdns || [])
    } catch (error) {
      console.error("Gagal memuat data:", error)
    } finally {
      setLoading(false)
    }
  }

  // 🆕 Fetch Ringkasan Bulanan
  const fetchMonthlySummary = async () => {
    setLoadingSummary(true)
    try {
      const res = await fetch('/api/cashflow-monthly')
      const data = await res.json()
      setMonthlySummary(data.monthly || [])
    } catch (error) {
      console.error('Gagal fetch monthly summary:', error)
    } finally {
      setLoadingSummary(false)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      let res
      if (editId) {
        const oldData = cashflowList.find(c => c.id === editId)
        res = await fetch('/api/cashflow', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editId,
            ...newCashflow,
            amount: parseFloat(newCashflow.amount) || 0,
            rdn_id: newCashflow.rdn_id ? parseInt(newCashflow.rdn_id) : null,
            old_rdn_id: oldData?.rdn_id,
            old_type: oldData?.Type || oldData?.type,
            old_amount: oldData?.amount
          })
        })
      } else {
        res = await fetch('/api/cashflow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newCashflow,
            amount: parseFloat(newCashflow.amount) || 0,
            rdn_id: newCashflow.rdn_id ? parseInt(newCashflow.rdn_id) : null
          })
        })
      }
      
      if (res.ok) {
        setShowForm(false)
        setEditId(null)
        setNewCashflow({ tanggal: '', Type: 'deposit', amount: '', rdn_id: '', kode_saham: '', keterangan: '' })
        await fetchData()
        await fetchMonthlySummary() // 🆕 Refresh summary setelah tambah data
      } else {
        const error = await res.json()
        alert('Error: ' + error.error)
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (c: any) => {
    const typeValue = c.Type || c.type || 'deposit'
    setEditId(c.id)
    setNewCashflow({
      tanggal: c.tanggal ? String(c.tanggal).split('T')[0] : '',
      Type: typeValue, 
      amount: String(c.amount),
      rdn_id: String(c.rdn_id || ''), 
      kode_saham: c.kode_saham || '', 
      keterangan: c.keterangan || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus cashflow ini? Saldo RDN akan dikembalikan.')) return
    
    const cfToDelete = cashflowList.find(c => c.id === id)
    if (!cfToDelete) return

    try {
      const res = await fetch('/api/cashflow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          rdn_id: cfToDelete.rdn_id,
          Type: cfToDelete.Type || cfToDelete.type,
          amount: cfToDelete.amount
        })
      })

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal menghapus');
        await fetchData()
        await fetchMonthlySummary() // 🆕 Refresh summary setelah hapus data
      } else {
        const text = await res.text();
        console.error("Server returned HTML:", text);
        throw new Error('Gagal menghapus: Server error. Cek terminal VS Code untuk detail.');
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditId(null)
    setNewCashflow({ tanggal: '', Type: 'deposit', amount: '', rdn_id: '', kode_saham: '', keterangan: '' })
  }

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)
  const getType = (c: any) => c.Type || c.type || 'unknown'
  
  // 🆕 Helper format bulan
  const formatMonth = (monthStr: string) => {
    if (monthStr === 'Lainnya') return 'Lainnya'
    const [year, month] = monthStr.split('-')
    const date = new Date(Number(year), Number(month) - 1)
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }

  if (loading) return <div className="p-8 text-center text-gray-900 dark:text-white">Memuat data...</div>

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8 transition-colors">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Link href="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block text-sm md:text-base">← Kembali ke Dashboard</Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Daftar Cashflow</h1>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Total: {cashflowList.length} transaksi</p>
          </div>
          <button 
            onClick={() => { handleCancel(); setShowForm(true) }} 
            className="rounded bg-blue-600 px-4 md:px-6 py-2 text-white hover:bg-blue-700 font-medium text-sm md:text-base"
          >
            + Tambah Cashflow
          </button>
        </div>

        {/* 🆕 RINGKASAN PROFIT BULANAN */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📊 Ringkasan Profit Bulanan</h2>
          
          {loadingSummary ? (
            <div className="text-center py-8 text-gray-500 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">Memuat ringkasan...</div>
          ) : monthlySummary.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center text-gray-500 border border-gray-200 dark:border-gray-700">
              Belum ada data transaksi atau cashflow.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Bulan</th>
                    <th className="px-4 py-3 text-right">Dividen</th>
                    <th className="px-4 py-3 text-right">Realized P/L</th>
                    <th className="px-4 py-3 text-right font-bold">Total Profit</th>
                    <th className="px-4 py-3 text-right text-gray-500">Net Cashflow*</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {monthlySummary.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {formatMonth(item.month)}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-medium">
                        +{formatRupiah(item.dividen)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${item.realizedPL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {item.realizedPL >= 0 ? '+' : ''}{formatRupiah(item.realizedPL)}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${item.totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {item.totalProfit >= 0 ? '+' : ''}{formatRupiah(item.totalProfit)}
                      </td>
                      <td className={`px-4 py-3 text-right text-xs ${item.netCashflow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {item.netCashflow >= 0 ? '+' : ''}{formatRupiah(item.netCashflow)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                * Net Cashflow = Deposit + Dividen + Hasil Jual - Total Beli. Tidak memperhitungkan fee secara terpisah di baris ini.
              </p>
            </div>
          )}
        </div>

        {/* FORM INPUT */}
        {showForm && (
          <div className="mb-6 rounded-lg bg-white dark:bg-gray-800 p-4 md:p-6 shadow border border-gray-200 dark:border-gray-700">
            <h2 className="mb-4 text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {editId ? 'Edit Cashflow' : 'Tambah Cashflow Baru'}
            </h2>
            <form onSubmit={onSubmit} className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="mb-1 block text-xs md:text-sm font-bold text-gray-900 dark:text-gray-200">Tanggal</label>
                  <input type="date" value={newCashflow.tanggal} onChange={(e) => setNewCashflow({ ...newCashflow, tanggal: e.target.value })} required className="w-full rounded border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm md:text-base" />
                </div>
                <div>
                  <label className="mb-1 block text-xs md:text-sm font-bold text-gray-900 dark:text-gray-200">Tipe</label>
                  <select value={newCashflow.Type} onChange={(e) => setNewCashflow({ ...newCashflow, Type: e.target.value })} className="w-full rounded border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm md:text-base">
                    <option value="deposit">Deposit</option>
                    <option value="withdraw">Withdraw</option>
                    <option value="dividen">Dividen</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs md:text-sm font-bold text-gray-900 dark:text-gray-200">Jumlah (Rp)</label>
                  <input type="number" value={newCashflow.amount} onChange={(e) => setNewCashflow({ ...newCashflow, amount: e.target.value })} required className="w-full rounded border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm md:text-base" />
                </div>
                <div>
                  <label className="mb-1 block text-xs md:text-sm font-bold text-gray-900 dark:text-gray-200">RDN</label>
                  <select value={newCashflow.rdn_id} onChange={(e) => setNewCashflow({ ...newCashflow, rdn_id: e.target.value })} className="w-full rounded border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm md:text-base">
                    <option value="">-- Pilih RDN --</option>
                    {rdnList.map((r: any) => <option key={r.id} value={r.id}>{r.nama_sekuritas}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs md:text-sm font-bold text-gray-900 dark:text-gray-200">Kode Saham (opsional)</label>
                  <input type="text" value={newCashflow.kode_saham} onChange={(e) => setNewCashflow({ ...newCashflow, kode_saham: e.target.value.toUpperCase() })} className="w-full rounded border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm md:text-base" placeholder="Contoh: BBCA" />
                </div>
                <div>
                  <label className="mb-1 block text-xs md:text-sm font-bold text-gray-900 dark:text-gray-200">Keterangan</label>
                  <input type="text" value={newCashflow.keterangan} onChange={(e) => setNewCashflow({ ...newCashflow, keterangan: e.target.value })} className="w-full rounded border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm md:text-base" placeholder="Contoh: Transfer dari BCA" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="flex-1 rounded bg-green-600 py-2 text-white hover:bg-green-700 font-medium text-sm md:text-base disabled:opacity-50">
                  {saving ? 'Memproses...' : (editId ? 'Simpan Perubahan' : 'Simpan Cashflow')}
                </button>
                <button type="button" onClick={handleCancel} disabled={saving} className="rounded bg-gray-500 px-4 md:px-6 py-2 text-white hover:bg-gray-600 font-medium text-sm md:text-base disabled:opacity-50">
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TABEL CASHFLOW */}
        <div className="rounded-lg bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="text-left py-3 px-3 text-gray-600 dark:text-gray-300 font-medium">Tanggal</th>
                  <th className="text-left py-3 px-3 text-gray-600 dark:text-gray-300 font-medium">Tipe</th>
                  <th className="text-right py-3 px-3 text-gray-600 dark:text-gray-300 font-medium">Jumlah</th>
                  <th className="text-left py-3 px-3 text-gray-600 dark:text-gray-300 font-medium">RDN</th>
                  <th className="text-left py-3 px-3 text-gray-600 dark:text-gray-300 font-medium">Saham</th>
                  <th className="text-left py-3 px-3 text-gray-600 dark:text-gray-300 font-medium">Keterangan</th>
                  <th className="text-center py-3 px-3 text-gray-600 dark:text-gray-300 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {cashflowList.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">Belum ada cashflow</td></tr>
                ) : cashflowList.map((c: any) => {
                  const typeVal = getType(c).toLowerCase()
                  return (
                    <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-2 px-3 text-gray-900 dark:text-white">{new Date(c.tanggal).toLocaleDateString('id-ID')}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          typeVal === 'deposit' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                          typeVal === 'withdraw' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                          typeVal === 'dividen' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                          'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                        }`}>
                          {getType(c).toUpperCase()}
                        </span>
                      </td>
                      <td className={`py-2 px-3 text-right font-bold ${
                        typeVal === 'deposit' || typeVal === 'dividen' ? 'text-green-600 dark:text-green-400' : 
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {typeVal === 'withdraw' ? '-' : '+'}{formatRupiah(c.amount)}
                      </td>
                      <td className="py-2 px-3 text-gray-900 dark:text-white">{rdnList.find((r: any) => String(r.id) === String(c.rdn_id))?.nama_sekuritas || '-'}</td>
                      <td className="py-2 px-3 text-gray-900 dark:text-white">{c.kode_saham || '-'}</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400 text-xs">{c.keterangan || '-'}</td>
                      <td className="py-2 px-3">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleEdit(c)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(c.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs font-medium">Hapus</button>
                        </div>
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