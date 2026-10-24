import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code parameter is required' }, { status: 400 })
    }

    const ticker = code + '.JK'
    
    // Fetch 30 hari data dari Yahoo Finance
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/' + ticker + '?interval=1d&range=1mo',
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 3600 }
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    const data = await res.json()
    
    const timestamps = data.chart?.result?.[0]?.timestamp || []
    const quotes = data.chart?.result?.[0]?.indicators?.quote?.[0] || {}
    const closes = quotes.close || []
    const volumes = quotes.volume || []

    const chartData = timestamps.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      price: closes[i] || 0,
      volume: volumes[i] || 0
    })).filter(d => d.price > 0)

    return NextResponse.json({ chartData })
  } catch (error: any) {
    console.error('Stock history error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}