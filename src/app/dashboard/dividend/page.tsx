'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function DividendPage() {
  const [plan, setPlan] = useState<any>(null)
  const [stocks, setStocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [targetInput, setTargetInput] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    kode_saham: '',
    lot_target: '',
    lot_aktual: '',
    target_harga_beli: '',
    interim_dividen: '',
    final_dividen: '',
    cumdate_interim: '',
    cumdate_final: ''
  })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dividend-plan')
      const data = await res.json()
      if (data.plan) {
        setPlan(data.plan)
        setTargetInput(data.plan.target_yearly_dividend.toString())
      }
      if (data.stocks) setStocks(data.stocks)
    } catch (error) {
      console.error('Gagal memuat data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTarget = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/dividend-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_target', target_yearly_dividend: targetInput })
      })
      await fetchData()
      alert('Target berhasil diupdate!')
    } catch (error) {
      alert('Gagal update target')
    } finally { setSaving(false) }
  }

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      let res;
      if (editId) {
        res = await fetch('/api/dividend-plan', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...formData })
        })
      } else {
        res = await fetch('/api/dividend-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add_stock', ...formData })
        })
      }
      if (res.ok) {
        setShowForm(false)
        setEditId(null)
        resetForm()
        await fetchData()
      }
    } catch (error) {
      alert('Terjadi kesalahan')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin hapus saham ini dari plan?')) return
    try {
      const res = await fetch('/api/dividend-plan', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) await fetchData()
    } catch (error) { alert('Gagal menghapus') }
  }

  const handleEdit = (stock: any) => {
    setEditId(stock.id)
    setFormData({
      kode_saham: stock.kode_saham,
      lot_target: stock.lot_target.toString(),
      lot_aktual: stock.lot_aktual.toString(),
      target_harga_beli: stock.target_harga_beli.toString(),
      interim_dividen: stock.interim_dividen.toString(),
      final_dividen: stock.final_dividen.toString(),
      cumdate_interim: stock.cumdate_interim ? stock.cumdate_interim.split('T')[0] : '',
      cumdate_final: stock.cumdate_final ? stock.cumdate_final.split('T')[0] : ''
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      kode_saham: '', lot_target: '', lot_aktual: '', target_harga_beli: '',
      interim_dividen: '', final_dividen: '', cumdate_interim: '', cumdate_final: ''
    })
  }

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)

  const totalDividenTahunan = stocks.reduce((acc, stock) => {
    const divPerShare = (parseFloat(stock.interim_dividen) || 0) + (parseFloat(stock.final_dividen) || 0)
    return acc + (parseInt(stock.lot_aktual) * 100 * divPerShare)
  }, 0)

  const targetValue = parseFloat(plan?.target_yearly_dividend) || 0
  const progressPercent = targetValue > 0 ? Math.min(100, (totalDividenTahunan / targetValue) * 100) : 0
  
  const modalDibutuhkan = stocks.reduce((acc, stock) => {
    const sisaLot = parseInt(stock.lot_target) - parseInt(stock.lot_aktual)
    if (sisaLot > 0) return acc + (sisaLot * 100 * parseFloat(stock.target_harga_beli))
    return acc
  }, 0)

  if (loading) return <div className="p-8 text-center text-gray-600 dark:text-gray-400">Memuat data...</div>

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Link href="/dashboard" className="text-blue-600 hover:underline mb-2 block">← Kembali ke Dashboard</Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Proyeksi Dividen Tahunan</h1>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); setEditId(null); }} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + Tambah Saham
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Target Dividen</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatRupiah(targetValue)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Tercapai (Tahunan)</p>
            <p className="text-xl font-bold text-green-600">{formatRupiah(totalDividenTahunan)}</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <p className="text-xs text-right mt-1 text-gray-500">{progressPercent.toFixed(1)}%</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Sisa Target</p>
            <p className="text-xl font-bold text-red-500">{formatRupiah(Math.max(0, targetValue - totalDividenTahunan))}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Modal Dibutuhkan Lagi</p>
            <p className="text-xl font-bold text-blue-600">{formatRupiah(modalDibutuhkan)}</p>
          </div>
        </div>

        {/* TARGET SETTING */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Atur Target Tahunan</h2>
          <form onSubmit={handleUpdateTarget} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Dividen (Rp)</label>
              <input 
                type="number" 
                value={targetInput} 
                onChange={(e) => setTargetInput(e.target.value)} 
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="36000000"
              />
            </div>
            <button type="submit" disabled={saving} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50">
              Simpan Target
            </button>
          </form>
        </div>

        {/* STOCKS TABLE */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase">
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3 text-right">Lot Target</th>
                  <th className="px-4 py-3 text-right">Lot Aktual</th>
                  <th className="px-4 py-3 text-right">Target Harga</th>
                  <th className="px-4 py-3 text-right">Div Interim</th>
                  <th className="px-4 py-3 text-right">Div Final</th>
                  <th className="px-4 py-3 text-right">Total Div/Tahun</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {stocks.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-500">Belum ada saham dalam plan. Klik "Tambah Saham".</td></tr>
                ) : stocks.map((stock) => {
                  const divPerShare = (parseFloat(stock.interim_dividen) || 0) + (parseFloat(stock.final_dividen) || 0)
                  const totalDiv = parseInt(stock.lot_aktual) * 100 * divPerShare
                  return (
                    <tr key={stock.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-white">
                      <td className="px-4 py-3 font-bold">{stock.kode_saham}</td>
                      <td className="px-4 py-3 text-right">{stock.lot_target}</td>
                      <td className="px-4 py-3 text-right text-blue-600 font-semibold">{stock.lot_aktual}</td>
                      <td className="px-4 py-3 text-right">{formatRupiah(stock.target_harga_beli)}</td>
                      <td className="px-4 py-3 text-right text-xs">
                        {stock.interim_dividen > 0 && <div>{formatRupiah(stock.interim_dividen)}</div>}
                        {stock.cumdate_interim && <div className="text-gray-400">{stock.cumdate_interim.split('T')[0]}</div>}
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        {stock.final_dividen > 0 && <div>{formatRupiah(stock.final_dividen)}</div>}
                        {stock.cumdate_final && <div className="text-gray-400">{stock.cumdate_final.split('T')[0]}</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">{formatRupiah(totalDiv)}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleEdit(stock)} className="text-blue-500 hover:text-blue-700 mr-2">Edit</button>
                        <button onClick={() => handleDelete(stock.id)} className="text-red-500 hover:text-red-700">Hapus</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL FORM */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{editId ? 'Edit Saham' : 'Tambah Saham ke Plan'}</h2>
              <form onSubmit={handleSaveStock} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kode Saham</label>
                    <input required type="text" value={formData.kode_saham} onChange={e => setFormData({...formData, kode_saham: e.target.value.toUpperCase()})} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Harga Beli</label>
                    <input required type="number" value={formData.target_harga_beli} onChange={e => setFormData({...formData, target_harga_beli: e.target.value})} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lot Target</label>
                    <input required type="number" value={formData.lot_target} onChange={e => setFormData({...formData, lot_target: e.target.value})} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lot Aktual (Sekarang)</label>
                    <input type="number" value={formData.lot_aktual} onChange={e => setFormData({...formData, lot_aktual: e.target.value})} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  
                  <div className="col-span-2 border-t dark:border-gray-700 pt-4 mt-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Dividen Interim</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500">Dividen per Lembar (Rp)</label>
                        <input type="number" step="0.01" value={formData.interim_dividen} onChange={e => setFormData({...formData, interim_dividen: e.target.value})} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">Cumdate</label>
                        <input type="date" value={formData.cumdate_interim} onChange={e => setFormData({...formData, cumdate_interim: e.target.value})} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 border-t dark:border-gray-700 pt-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Dividen Final</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500">Dividen per Lembar (Rp)</label>
                        <input type="number" step="0.01" value={formData.final_dividen} onChange={e => setFormData({...formData, final_dividen: e.target.value})} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">Cumdate</label>
                        <input type="date" value={formData.cumdate_final} onChange={e => setFormData({...formData, cumdate_final: e.target.value})} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Batal</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}