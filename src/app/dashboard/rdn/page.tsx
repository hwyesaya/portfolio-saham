'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function RDNPage() {
  const [rdnList, setRdnList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    nama_sekuritas: '',
    nomor_rekening: '',
    kode_broker: '',
    cash_balance: ''
  })

  useEffect(() => {
    fetchRDN()
  }, [])

  const fetchRDN = async () => {
    setLoading(true)
    try {
      // Fetch dari API rdn-balance yang sudah menghitung otomatis
      const res = await fetch('/api/rdn-balance')
      const data = await res.json()
      setRdnList(data.rdn || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        nama_sekuritas: formData.nama_sekuritas,
        nomor_rekening: formData.nomor_rekening,
        kode_broker: formData.kode_broker,
        cash_balance: parseFloat(formData.cash_balance) || 0
      }

      let res
      if (editId) {
        res = await fetch('/api/rdn', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...payload })
        })
      } else {
        res = await fetch('/api/rdn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      if (res.ok) {
        setShowForm(false)
        setEditId(null)
        resetForm()
        await fetchRDN()
      } else {
        const err = await res.json()
        alert('Error: ' + err.error)
      }
    } catch (error) {
      alert('Terjadi kesalahan')
    }
  }

  const handleEdit = (rdn: any) => {
    setEditId(rdn.id)
    setFormData({
      nama_sekuritas: rdn.nama_sekuritas || '',
      nomor_rekening: rdn.nomor_rekening || '',
      kode_broker: rdn.kode_broker || '',
      cash_balance: String(rdn.breakdown?.initial_balance || 0)
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin hapus RDN ini?')) return
    try {
      const res = await fetch('/api/rdn', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) await fetchRDN()
    } catch (error) {
      alert('Gagal menghapus')
    }
  }

  const resetForm = () => {
    setFormData({
      nama_sekuritas: '',
      nomor_rekening: '',
      kode_broker: '',
      cash_balance: ''
    })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditId(null)
    resetForm()
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num)
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-900 dark:text-white">Memuat data...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8 transition-colors">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Link href="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block text-sm md:text-base">
              ← Kembali ke Dashboard
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Daftar RDN
            </h1>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              Total: {rdnList.length} RDN
            </p>
          </div>
          <button
            onClick={() => {
              handleCancel()
              setShowForm(true)
            }}
            className="rounded bg-blue-600 px-4 md:px-6 py-2 text-white hover:bg-blue-700 font-medium text-sm md:text-base"
          >
            + Tambah RDN
          </button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg bg-white dark:bg-gray-800 p-4 md:p-6 shadow border border-gray-200 dark:border-gray-700">
            <h2 className="mb-4 text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {editId ? 'Edit RDN' : 'Tambah RDN Baru'}
            </h2>
            <form onSubmit={handleSave} className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="mb-1 block text-xs md:text-sm font-bold text-gray-900 dark:text-gray-200">
                    Nama Sekuritas *
                  </label>
                  <input
                    type="text"
                    value={formData.nama_sekuritas}
                    onChange={(e) =>
                      setFormData({ ...formData, nama_sekuritas: e.target.value })
                    }
                    required
                    className="w-full rounded border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm md:text-base"
                    placeholder="Contoh: Mandiri Sekuritas"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs md:text-sm font-bold text-gray-900 dark:text-gray-200">
                    Kode Broker (2 Huruf) *
                  </label>
                  <input
                    type="text"
                    value={formData.kode_broker}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kode_broker: e.target.value.toUpperCase()
                      })
                    }
                    required
                    maxLength={2}
                    className="w-full rounded border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm md:text-base font-mono"
                    placeholder="Contoh: YB"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs md:text-sm font-bold text-gray-900 dark:text-gray-200">
                    Nomor Rekening
                  </label>
                  <input
                    type="text"
                    value={formData.nomor_rekening}
                    onChange={(e) =>
                      setFormData({ ...formData, nomor_rekening: e.target.value })
                    }
                    className="w-full rounded border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm md:text-base"
                    placeholder="Contoh: 1234567890"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs md:text-sm font-bold text-gray-900 dark:text-gray-200">
                    Initial Balance (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.cash_balance}
                    onChange={(e) =>
                      setFormData({ ...formData, cash_balance: e.target.value })
                    }
                    className="w-full rounded border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm md:text-base"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded bg-green-600 py-2 text-white hover:bg-green-700 font-medium text-sm md:text-base"
                >
                  {editId ? 'Simpan Perubahan' : 'Simpan RDN'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded bg-gray-500 px-4 md:px-6 py-2 text-white hover:bg-gray-600 font-medium text-sm md:text-base"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="rounded-lg bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="text-left py-3 px-3 text-gray-600 dark:text-gray-300 font-medium">
                    Nama Sekuritas
                  </th>
                  <th className="text-center py-3 px-3 text-gray-600 dark:text-gray-300 font-medium">
                    Kode Broker
                  </th>
                  <th className="text-left py-3 px-3 text-gray-600 dark:text-gray-300 font-medium">
                    Nomor Rekening
                  </th>
                  <th className="text-right py-3 px-3 text-gray-600 dark:text-gray-300 font-medium">
                    Cash Balance
                  </th>
                  <th className="text-center py-3 px-3 text-gray-600 dark:text-gray-300 font-medium">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {rdnList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Belum ada RDN.
                    </td>
                  </tr>
                ) : (
                  rdnList.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">
                        {r.nama_sekuritas}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {r.kode_broker ? (
                          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded font-mono">
                            {r.kode_broker}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-gray-900 dark:text-white font-mono text-xs">
                        {r.nomor_rekening || '-'}
                      </td>
                      <td className="py-3 px-3 text-right group relative">
                        <span className={`font-bold ${r.cash_balance_final >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatRupiah(r.cash_balance_final || 0)}
                        </span>
                        {/* Tooltip Breakdown */}
                        <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded p-3 z-10 shadow-lg border border-gray-700">
                          <p className="font-bold mb-2 text-gray-300">Breakdown:</p>
                          <div className="space-y-1">
                            <p className="flex justify-between">
                              <span className="text-gray-400">Initial:</span>
                              <span>{formatRupiah(r.breakdown?.initial_balance || 0)}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-gray-400">Deposit Baru:</span>
                              <span className="text-green-400">+{formatRupiah(r.breakdown?.deposit_baru || 0)}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-gray-400">Dividen:</span>
                              <span className="text-green-400">+{formatRupiah(r.breakdown?.dividen || 0)}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-gray-400">Total Jual:</span>
                              <span className="text-green-400">+{formatRupiah(r.breakdown?.total_jual || 0)}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-gray-400">Total Beli:</span>
                              <span className="text-red-400">-{formatRupiah(r.breakdown?.total_beli || 0)}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(r)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs font-medium"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}