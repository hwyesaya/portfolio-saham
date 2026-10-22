'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function TransaksiPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [rdnList, setRdnList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [filterRdn, setFilterRdn] = useState('')
  const [filterKode, setFilterKode] = useState('')
  
  const [formData, setFormData] = useState({
    rdn_id: '',
    kode_saham: '',
    tipe: 'BELI',
    lot: '',
    harga: '',
    fee_beli: '0',
    fee_jual: '0',
    tanggal: new Date().toISOString().split('T')[0],
    catatan: ''
  })

  useEffect(() => {
    fetchRdnList()
    fetchTransactions()
  }, [])

  const fetchRdnList = async () => {
    try {
      const res = await fetch('/api/rdn')
      const data = await res.json()
      setRdnList(data.rdn || [])
    } catch (error) {
      console.error('Gagal fetch RDN:', error)
    }
  }

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      let url = '/api/transactions'
      const params = new URLSearchParams()
      if (filterRdn) params.append('rdn_id', filterRdn)
      if (filterKode) params.append('kode_saham', filterKode)
      if (params.toString()) url += '?' + params.toString()

      const res = await fetch(url)
      const data = await res.json()
      setTransactions(data.transactions || [])
    } catch (error) {
      console.error('Gagal fetch transaksi:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [filterRdn, filterKode])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...formData,
        lot: parseInt(formData.lot),
        harga: parseFloat(formData.harga),
        fee_beli: parseFloat(formData.fee_beli) || 0,
        fee_jual: parseFloat(formData.fee_jual) || 0,
      }

      let res;
      if (editId) {
        res = await fetch('/api/transactions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...payload })
        })
      } else {
        res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      if (res.ok) {
        setShowForm(false)
        setEditId(null)
        resetForm()
        await fetchTransactions()
      } else {
        const err = await res.json()
        alert('Error: ' + err.error)
      }
    } catch (error) {
      alert('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin hapus transaksi ini?')) return
    try {
      const res = await fetch('/api/transactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) await fetchTransactions()
    } catch (error) {
      alert('Gagal menghapus')
    }
  }

  const handleEdit = (tx: any) => {
    setEditId(tx.id)
    setFormData({
      rdn_id: tx.rdn_id?.toString() || '',
      kode_saham: tx.kode_saham,
      tipe: tx.tipe,
      lot: tx.lot.toString(),
      harga: tx.harga.toString(),
      fee_beli: tx.fee_beli?.toString() || '0',
      fee_jual: tx.fee_jual?.toString() || '0',
      tanggal: tx.tanggal?.split('T')[0] || new Date().toISOString().split('T')[0],
      catatan: tx.catatan || ''
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      rdn_id: '',
      kode_saham: '',
      tipe: 'BELI',
      lot: '',
      harga: '',
      fee_beli: '0',
      fee_jual: '0',
      tanggal: new Date().toISOString().split('T')[0],
      catatan: ''
    })
  }

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)
  const formatTanggal = (date: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Helper untuk dapat nama RDN dengan kode broker
  const getRdnDisplay = (rdnId: any, fallbackName: string) => {
  const rdn = rdnList.find(r => Number(r.id) === Number(rdnId))
  if (rdn) {
    return `${rdn.nama_sekuritas} ${rdn.kode_broker ? `(${rdn.kode_broker})` : ''}`
  }
  return fallbackName || '-'
}

  // Hitung ringkasan (dengan parseFloat untuk hindari string concatenation)
  const totalBeli = transactions
    .filter(t => t.tipe === 'BELI')
    .reduce((sum, t) => sum + parseFloat(t.total_transaksi || 0), 0)

  const totalJual = transactions
    .filter(t => t.tipe === 'JUAL')
    .reduce((sum, t) => sum + parseFloat(t.total_transaksi || 0), 0)

  const totalTransaksi = transactions.length

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Link href="/dashboard" className="text-blue-600 hover:underline mb-2 block">← Kembali ke Dashboard</Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transaksi Saham</h1>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); setEditId(null); }} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + Tambah Transaksi
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Transaksi</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTransaksi}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Pembelian</p>
            <p className="text-2xl font-bold text-red-600">{formatRupiah(totalBeli)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Penjualan</p>
            <p className="text-2xl font-bold text-green-600">{formatRupiah(totalJual)}</p>
          </div>
        </div>

        {/* FILTER */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white"> Filter Transaksi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Filter RDN</label>
              <select 
                value={filterRdn} 
                onChange={(e) => setFilterRdn(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              >
                <option value="">Semua RDN</option>
                {rdnList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nama_sekuritas} {r.kode_broker ? `(${r.kode_broker})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Filter Kode Saham</label>
              <input 
                type="text" 
                value={filterKode} 
                onChange={(e) => setFilterKode(e.target.value.toUpperCase())}
                placeholder="BBCA"
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              />
            </div>
            <div className="flex items-end">
              <button 
                onClick={() => { setFilterRdn(''); setFilterKode(''); }}
                className="w-full p-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>

        {/* TABEL TRANSAKSI */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">RDN</th>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3 text-center">Tipe</th>
                  <th className="px-4 py-3 text-right">Lot</th>
                  <th className="px-4 py-3 text-right">Harga</th>
<th className="px-4 py-3 text-right">Avg Jual</th>
<th className="px-4 py-3 text-right">Fee</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-500">Memuat...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-500">Belum ada transaksi. Klik "Tambah Transaksi".</td></tr>
                ) : transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-white">
                    <td className="px-4 py-3 text-xs">{formatTanggal(tx.tanggal)}</td>
                    <td className="px-4 py-3 text-xs">{getRdnDisplay(tx.rdn_id, tx.rdn_nama)}</td>
                    <td className="px-4 py-3 font-bold">{tx.kode_saham}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        tx.tipe === 'BELI' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {tx.tipe}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{tx.lot}</td>
                    <td className="px-4 py-3 text-right">{formatRupiah(tx.harga)}</td>
                    <td className="px-4 py-3 text-right">
  {tx.tipe === 'JUAL' && tx.avg_price_at_sale ? (
    <div>
      <span className="font-semibold">{formatRupiah(tx.avg_price_at_sale)}</span>
      <div className={`text-[10px] ${
        Number(tx.harga) >= tx.avg_price_at_sale ? 'text-green-600' : 'text-red-600'
      }`}>
        {Number(tx.harga) >= tx.avg_price_at_sale ? '▲' : '▼'} 
        {Math.abs(((Number(tx.harga) - tx.avg_price_at_sale) / tx.avg_price_at_sale) * 100).toFixed(2)}%
      </div>
    </div>
  ) : (
    <span className="text-gray-400">-</span>
  )}
</td>
                    <td className="px-4 py-3 text-right text-xs">
  {formatRupiah(tx.tipe === 'BELI' ? (tx.fee_beli || 0) : (tx.fee_jual || 0))}
</td>
                    <td className={`px-4 py-3 text-right font-bold ${tx.tipe === 'BELI' ? 'text-red-600' : 'text-green-600'}`}>
                      {formatRupiah(tx.total_transaksi)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleEdit(tx)} className="text-blue-500 hover:text-blue-700 mr-2 text-xs">Edit</button>
                      <button onClick={() => handleDelete(tx.id)} className="text-red-500 hover:text-red-700 text-xs">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL FORM */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                {editId ? 'Edit Transaksi' : 'Tambah Transaksi'}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* RDN */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">RDN *</label>
                    <select 
                      required
                      value={formData.rdn_id}
                      onChange={(e) => setFormData({...formData, rdn_id: e.target.value})}
                      className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Pilih RDN</option>
                      {rdnList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nama_sekuritas} {r.kode_broker ? `(${r.kode_broker})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kode Saham */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kode Saham *</label>
                    <input 
                      required
                      type="text"
                      value={formData.kode_saham}
                      onChange={(e) => setFormData({...formData, kode_saham: e.target.value.toUpperCase()})}
                      placeholder="BBCA"
                      className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  {/* Tipe */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipe *</label>
                    <select 
                      required
                      value={formData.tipe}
                      onChange={(e) => setFormData({...formData, tipe: e.target.value})}
                      className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="BELI">BELI</option>
                      <option value="JUAL">JUAL</option>
                    </select>
                  </div>

                  {/* Tanggal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal *</label>
                    <input 
                      required
                      type="date"
                      value={formData.tanggal}
                      onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                      className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  {/* Lot */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lot *</label>
                    <input 
                      required
                      type="number"
                      value={formData.lot}
                      onChange={(e) => setFormData({...formData, lot: e.target.value})}
                      placeholder="10"
                      className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  {/* Harga */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Harga per Lembar *</label>
                    <input 
                      required
                      type="number"
                      step="1"
                      value={formData.harga}
                      onChange={(e) => setFormData({...formData, harga: e.target.value})}
                      placeholder="9500"
                      className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  {/* Fee Beli */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fee Beli (Rp)</label>
                    <input 
                      type="number"
                      value={formData.fee_beli}
                      onChange={(e) => setFormData({...formData, fee_beli: e.target.value})}
                      placeholder="0"
                      className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  {/* Fee Jual */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fee Jual (Rp)</label>
                    <input 
                      type="number"
                      value={formData.fee_jual}
                      onChange={(e) => setFormData({...formData, fee_jual: e.target.value})}
                      placeholder="0"
                      className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  {/* Catatan */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Catatan</label>
                    <input 
                      type="text"
                      value={formData.catatan}
                      onChange={(e) => setFormData({...formData, catatan: e.target.value})}
                      placeholder="Opsional"
                      className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                
                {/* Preview Total */}
                {formData.lot && formData.harga && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded border border-blue-200 dark:border-blue-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Preview Total:</strong> {formatRupiah(
                        (parseInt(formData.lot) || 0) * 100 * (parseFloat(formData.harga) || 0)
                      )}
                      {formData.tipe === 'BELI' && formData.fee_beli && ` + Fee ${formatRupiah(parseFloat(formData.fee_beli))}`}
                      {formData.tipe === 'JUAL' && formData.fee_jual && ` - Fee ${formatRupiah(parseFloat(formData.fee_jual))}`}
                    </p>
                  </div>
                )}
                
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