import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    let code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Kode saham wajib diisi' }, { status: 400 })
    }

    // Tambahkan suffix .JK untuk saham Indonesia jika belum ada
    const ticker = code.toUpperCase().endsWith('.JK') ? code.toUpperCase() : `${code.toUpperCase()}.JK`
    
    // Fetch data dari Yahoo Finance API (On-demand)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error('Gagal mengambil data dari Yahoo Finance')
    }

    const data = await response.json()
    const result = data.chart.result[0]
    const meta = result.meta
    const currentPrice = meta.regularMarketPrice
    const previousClose = meta.chartPreviousClose || meta.previousClose

    if (!currentPrice) {
      return NextResponse.json({ error: 'Data harga tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      code: ticker,
      price: currentPrice,
      previousClose: previousClose,
      change: currentPrice - previousClose,
      changePercent: ((currentPrice - previousClose) / previousClose) * 100,
      currency: meta.currency || 'IDR'
    })

  } catch (error: any) {
    console.error('GET stock-price Error:', error)
    return NextResponse.json({ error: error.message || 'Gagal mengambil harga saham' }, { status: 500 })
  }
}