'use client'

import { useState } from 'react'
import Link from 'next/link'

type Tab = 'compound' | 'dividend' | 'position' | 'breakeven' | 'target' | 'average'

export default function CalculatorPage() {
  const [activeTab, setActiveTab] = useState<Tab>('average') // Default ke Average Down

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'average', label: 'Average Down', icon: '📉' },
    { id: 'compound', label: 'Compound Interest', icon: '📈' },
    { id: 'dividend', label: 'Dividend Yield', icon: '💰' },
    { id: 'position', label: 'Position Sizing', icon: '🎯' },
    { id: 'breakeven', label: 'Break Even', icon: '⚖️' },
    { id: 'target', label: 'Target Price', icon: '🏆' },
  ]

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)

  const formatNumber = (num: number, decimals = 2) =>
    new Intl.NumberFormat('id-ID', { maximumFractionDigits: decimals }).format(num)

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:underline mb-2 block">
            ← Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Kalkulator Investasi
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            6 kalkulator untuk bantu keputusan investasi kamu
          </p>
        </div>

        {/* TAB NAVIGATION */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          {activeTab === 'average' && <AverageDown formatRupiah={formatRupiah} formatNumber={formatNumber} />}
          {activeTab === 'compound' && <CompoundInterest formatRupiah={formatRupiah} formatNumber={formatNumber} />}
          {activeTab === 'dividend' && <DividendYield formatRupiah={formatRupiah} formatNumber={formatNumber} />}
          {activeTab === 'position' && <PositionSizing formatRupiah={formatRupiah} formatNumber={formatNumber} />}
          {activeTab === 'breakeven' && <BreakEven formatRupiah={formatRupiah} formatNumber={formatNumber} />}
          {activeTab === 'target' && <TargetPrice formatRupiah={formatRupiah} formatNumber={formatNumber} />}
        </div>
      </div>
    </div>
  )
}

// ==================== 1. AVERAGE DOWN (BARU!) ====================
function AverageDown({ formatRupiah, formatNumber }: { formatRupiah: (n: number) => string; formatNumber: (n: number, d?: number) => string }) {
  const [currentLot, setCurrentLot] = useState('10')
  const [currentAvg, setCurrentAvg] = useState('5000')
  const [buyLot, setBuyLot] = useState('5')
  const [buyPrice, setBuyPrice] = useState('4500')

  const cLot = parseFloat(currentLot) || 0
  const cAvg = parseFloat(currentAvg) || 0
  const bLot = parseFloat(buyLot) || 0
  const bPrice = parseFloat(buyPrice) || 0

  const modalLama = cLot * 100 * cAvg
  const modalBaru = bLot * 100 * bPrice
  const totalModal = modalLama + modalBaru
  const totalLot = cLot + bLot
  const newAvg = totalLot > 0 ? totalModal / (totalLot * 100) : 0
  const perubahanAvg = cAvg > 0 ? ((newAvg - cAvg) / cAvg) * 100 : 0

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">📉 Average Down Calculator</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Hitung rata-rata harga baru setelah membeli saham tambahan untuk menurunkan harga rata-rata.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lot Saat Ini</label>
          <input type="number" value={currentLot} onChange={(e) => setCurrentLot(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Avg Price Saat Ini (Rp)</label>
          <input type="number" value={currentAvg} onChange={(e) => setCurrentAvg(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lot yang Mau Dibeli</label>
          <input type="number" value={buyLot} onChange={(e) => setBuyLot(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga Beli Baru (Rp)</label>
          <input type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Total Lot Baru</p>
          <p className="text-xl font-bold text-blue-900 dark:text-blue-200">{formatNumber(totalLot, 0)} lot</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-xs text-green-700 dark:text-green-300 mb-1">Avg Price Baru</p>
          <p className="text-xl font-bold text-green-900 dark:text-green-200">{formatRupiah(newAvg)}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-purple-700 dark:text-purple-300 mb-1">Total Modal</p>
          <p className="text-xl font-bold text-purple-900 dark:text-purple-200">{formatRupiah(totalModal)}</p>
        </div>
        <div className={`${perubahanAvg <= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} p-4 rounded-lg border`}>
          <p className={`text-xs mb-1 ${perubahanAvg <= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>Perubahan Avg Price</p>
          <p className={`text-xl font-bold ${perubahanAvg <= 0 ? 'text-green-900 dark:text-green-200' : 'text-red-900 dark:text-red-200'}`}>
            {perubahanAvg >= 0 ? '+' : ''}{formatNumber(perubahanAvg)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">{perubahanAvg <= 0 ? '✅ Avg turun (Bagus!)' : '⚠️ Avg naik'}</p>
        </div>
      </div>
    </div>
  )
}

// ==================== 2. COMPOUND INTEREST ====================
function CompoundInterest({ formatRupiah, formatNumber }: { formatRupiah: (n: number) => string; formatNumber: (n: number, d?: number) => string }) {
  const [modal, setModal] = useState('10000000')
  const [saham, setSaham] = useState('0')
  const [returnRate, setReturnRate] = useState('10')
  const [tahun, setTahun] = useState('5')

  const modalAwal = parseFloat(modal) || 0
  const tambahanPerBulan = parseFloat(saham) || 0
  const rate = parseFloat(returnRate) || 0
  const years = parseFloat(tahun) || 0

  const months = years * 12
  const monthlyRate = rate / 100 / 12

  let total = modalAwal
  for (let i = 0; i < months; i++) {
    total = total * (1 + monthlyRate) + tambahanPerBulan
  }

  const totalInvestasi = modalAwal + tambahanPerBulan * months
  const profit = total - totalInvestasi

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">📈 Compound Interest</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Hitung pertumbuhan investasi dengan bunga berbunga. Cocok untuk proyeksi jangka panjang.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modal Awal (Rp)</label>
          <input type="number" value={modal} onChange={(e) => setModal(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tambahan per Bulan (Rp)</label>
          <input type="number" value={saham} onChange={(e) => setSaham(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Return per Tahun (%)</label>
          <input type="number" step="0.1" value={returnRate} onChange={(e) => setReturnRate(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jangka Waktu (Tahun)</label>
          <input type="number" step="0.5" value={tahun} onChange={(e) => setTahun(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Total Investasi</p>
          <p className="text-xl font-bold text-blue-900 dark:text-blue-200">{formatRupiah(totalInvestasi)}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-xs text-green-700 dark:text-green-300 mb-1">Profit dari Compound</p>
          <p className="text-xl font-bold text-green-900 dark:text-green-200">{formatRupiah(profit)}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-purple-700 dark:text-purple-300 mb-1">Nilai Akhir</p>
          <p className="text-xl font-bold text-purple-900 dark:text-purple-200">{formatRupiah(total)}</p>
        </div>
      </div>
    </div>
  )
}

// ==================== 3. DIVIDEND YIELD ====================
function DividendYield({ formatRupiah, formatNumber }: { formatRupiah: (n: number) => string; formatNumber: (n: number, d?: number) => string }) {
  const [hargaBeli, setHargaBeli] = useState('9500')
  const [dividenPerLembar, setDividenPerLembar] = useState('500')
  const [jumlahLembar, setJumlahLembar] = useState('1000')

  const harga = parseFloat(hargaBeli) || 0
  const dividen = parseFloat(dividenPerLembar) || 0
  const lembar = parseFloat(jumlahLembar) || 0

  const yieldPct = harga > 0 ? (dividen / harga) * 100 : 0
  const totalDividen = dividen * lembar
  const modal = harga * lembar
  const paybackTahun = dividen > 0 ? harga / dividen : 0

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">💰 Dividend Yield Calculator</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Hitung yield dividen dan estimasi pendapatan pasif dari dividen.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga Beli per Lembar (Rp)</label>
          <input type="number" value={hargaBeli} onChange={(e) => setHargaBeli(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dividen per Lembar (Rp/tahun)</label>
          <input type="number" value={dividenPerLembar} onChange={(e) => setDividenPerLembar(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah Lembar</label>
          <input type="number" value={jumlahLembar} onChange={(e) => setJumlahLembar(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-1">Dividend Yield</p>
          <p className="text-xl font-bold text-yellow-900 dark:text-yellow-200">{formatNumber(yieldPct)}%</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-xs text-green-700 dark:text-green-300 mb-1">Total Dividen/Tahun</p>
          <p className="text-xl font-bold text-green-900 dark:text-green-200">{formatRupiah(totalDividen)}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Modal</p>
          <p className="text-xl font-bold text-blue-900 dark:text-blue-200">{formatRupiah(modal)}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-purple-700 dark:text-purple-300 mb-1">Payback Period</p>
          <p className="text-xl font-bold text-purple-900 dark:text-purple-200">{formatNumber(paybackTahun, 1)} tahun</p>
        </div>
      </div>
    </div>
  )
}

// ==================== 4. POSITION SIZING ====================
function PositionSizing({ formatRupiah, formatNumber }: { formatRupiah: (n: number) => string; formatNumber: (n: number, d?: number) => string }) {
  const [modal, setModal] = useState('10000000')
  const [hargaSaham, setHargaSaham] = useState('9500')
  const [maxRisk, setMaxRisk] = useState('2')
  const [stopLoss, setStopLoss] = useState('9000')

  const modalTotal = parseFloat(modal) || 0
  const harga = parseFloat(hargaSaham) || 0
  const riskPct = parseFloat(maxRisk) || 0
  const sl = parseFloat(stopLoss) || 0

  const maxLossRp = modalTotal * (riskPct / 100)
  const lossPerLembar = harga - sl
  const maxLembar = lossPerLembar > 0 ? Math.floor(maxLossRp / lossPerLembar) : 0
  const maxLot = Math.floor(maxLembar / 100)
  const modalDibutuhkan = maxLot * 100 * harga
  const sisaModal = modalTotal - modalDibutuhkan
  const persentasePortfolio = modalTotal > 0 ? (modalDibutuhkan / modalTotal) * 100 : 0

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">🎯 Position Sizing</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Hitung berapa lot yang aman dibeli berdasarkan risiko yang ingin kamu ambil.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Modal (Rp)</label>
          <input type="number" value={modal} onChange={(e) => setModal(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga Saham Saat Ini (Rp)</label>
          <input type="number" value={hargaSaham} onChange={(e) => setHargaSaham(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Risiko per Trade (%)</label>
          <input type="number" step="0.1" value={maxRisk} onChange={(e) => setMaxRisk(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga Stop Loss (Rp)</label>
          <input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Lot yang Bisa Dibeli</p>
          <p className="text-xl font-bold text-blue-900 dark:text-blue-200">{maxLot} lot</p>
          <p className="text-xs text-gray-500 mt-1">({maxLot * 100} lembar)</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-xs text-green-700 dark:text-green-300 mb-1">Modal Dibutuhkan</p>
          <p className="text-xl font-bold text-green-900 dark:text-green-200">{formatRupiah(modalDibutuhkan)}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-1">% dari Portfolio</p>
          <p className="text-xl font-bold text-yellow-900 dark:text-yellow-200">{formatNumber(persentasePortfolio)}%</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-700 dark:text-red-300 mb-1">Max Loss jika Kena SL</p>
          <p className="text-xl font-bold text-red-900 dark:text-red-200">{formatRupiah(maxLossRp)}</p>
        </div>
      </div>

      {sisaModal > 0 && (
        <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded border border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            💡 <strong>Sisa modal:</strong> {formatRupiah(sisaModal)} untuk trade lain atau cash reserve
          </p>
        </div>
      )}
    </div>
  )
}

// ==================== 5. BREAK EVEN ====================
function BreakEven({ formatRupiah, formatNumber }: { formatRupiah: (n: number) => string; formatNumber: (n: number, d?: number) => string }) {
  const [hargaBeli, setHargaBeli] = useState('9500')
  const [lot, setLot] = useState('10')
  const [feeBeliPct, setFeeBeliPct] = useState('0.15')
  const [feeJualPct, setFeeJualPct] = useState('0.25')

  const harga = parseFloat(hargaBeli) || 0
  const lotCount = parseFloat(lot) || 0
  const feeBeli = parseFloat(feeBeliPct) || 0
  const feeJual = parseFloat(feeJualPct) || 0

  const lembar = lotCount * 100
  const subtotal = lembar * harga
  const biayaBeli = subtotal * (feeBeli / 100)
  const totalBeli = subtotal + biayaBeli

  const hargaBE = feeJual < 100 ? totalBeli / (lembar * (1 - feeJual / 100)) : 0
  const kenaikanBE = harga > 0 ? ((hargaBE - harga) / harga) * 100 : 0

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">⚖️ Break Even Calculator</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Hitung harga jual minimum agar tidak rugi setelah memperhitungkan fee beli & jual.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga Beli per Lembar (Rp)</label>
          <input type="number" value={hargaBeli} onChange={(e) => setHargaBeli(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah Lot</label>
          <input type="number" value={lot} onChange={(e) => setLot(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fee Beli (%)</label>
          <input type="number" step="0.01" value={feeBeliPct} onChange={(e) => setFeeBeliPct(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fee Jual (%)</label>
          <input type="number" step="0.01" value={feeJualPct} onChange={(e) => setFeeJualPct(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Total Biaya Beli</p>
          <p className="text-xl font-bold text-blue-900 dark:text-blue-200">{formatRupiah(totalBeli)}</p>
          <p className="text-xs text-gray-500 mt-1">Termasuk fee {formatRupiah(biayaBeli)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-700 dark:text-red-300 mb-1">Harga Break Even</p>
          <p className="text-xl font-bold text-red-900 dark:text-red-200">{formatRupiah(hargaBE)}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-1">Kenaikan yang Dibutuhkan</p>
          <p className="text-xl font-bold text-yellow-900 dark:text-yellow-200">+{formatNumber(kenaikanBE)}%</p>
        </div>
      </div>

      <div className="mt-4 bg-orange-50 dark:bg-orange-900/20 p-3 rounded border border-orange-200 dark:border-orange-800">
        <p className="text-sm text-orange-900 dark:text-orange-200">
          💡 Kamu harus jual di atas <strong>{formatRupiah(hargaBE)}</strong> per lembar agar profit. Di bawah itu = rugi karena fee.
        </p>
      </div>
    </div>
  )
}

// ==================== 6. TARGET PRICE ====================
function TargetPrice({ formatRupiah, formatNumber }: { formatRupiah: (n: number) => string; formatNumber: (n: number, d?: number) => string }) {
  const [hargaSaatIni, setHargaSaatIni] = useState('9500')
  const [targetHarga, setTargetHarga] = useState('12000')
  const [lot, setLot] = useState('10')
  const [feeJualPct, setFeeJualPct] = useState('0.25')

  const harga = parseFloat(hargaSaatIni) || 0
  const target = parseFloat(targetHarga) || 0
  const lotCount = parseFloat(lot) || 0
  const feeJual = parseFloat(feeJualPct) || 0

  const lembar = lotCount * 100
  const kenaikan = target - harga
  const kenaikanPct = harga > 0 ? (kenaikan / harga) * 100 : 0
  const grossProfit = lembar * kenaikan
  const feeJualRp = lembar * target * (feeJual / 100)
  const netProfit = grossProfit - feeJualRp
  const netProfitPct = harga > 0 ? (netProfit / (lembar * harga)) * 100 : 0

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">🏆 Target Price Calculator</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Hitung estimasi profit jika saham mencapai harga target.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga Saat Ini (Rp)</label>
          <input type="number" value={hargaSaatIni} onChange={(e) => setHargaSaatIni(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga Target (Rp)</label>
          <input type="number" value={targetHarga} onChange={(e) => setTargetHarga(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah Lot</label>
          <input type="number" value={lot} onChange={(e) => setLot(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fee Jual (%)</label>
          <input type="number" step="0.01" value={feeJualPct} onChange={(e) => setFeeJualPct(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Kenaikan yang Dibutuhkan</p>
          <p className="text-xl font-bold text-blue-900 dark:text-blue-200">+{formatNumber(kenaikanPct)}%</p>
          <p className="text-xs text-gray-500 mt-1">{formatRupiah(kenaikan)}/lembar</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-xs text-green-700 dark:text-green-300 mb-1">Gross Profit</p>
          <p className="text-xl font-bold text-green-900 dark:text-green-200">{formatRupiah(grossProfit)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-700 dark:text-red-300 mb-1">Fee Jual</p>
          <p className="text-xl font-bold text-red-900 dark:text-red-200">{formatRupiah(feeJualRp)}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-purple-700 dark:text-purple-300 mb-1">Net Profit</p>
          <p className="text-xl font-bold text-purple-900 dark:text-purple-200">{formatRupiah(netProfit)}</p>
          <p className="text-xs text-gray-500 mt-1">{formatNumber(netProfitPct)}% dari modal</p>
        </div>
      </div>
    </div>
  )
}