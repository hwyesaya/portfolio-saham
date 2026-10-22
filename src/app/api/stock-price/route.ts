import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code parameter is required' }, { status: 400 })
    }

    const ticker = `${code}.JK`
    
    console.log(`[Stock Price API] Fetching price for ${ticker}`)

    // Retry mechanism: coba 3 kali dengan delay
    let lastError = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[Stock Price API] Attempt ${attempt}/3 for ${ticker}`)
        
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            },
            next: { revalidate: 300 }
          }
        )

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        const data = await res.json()
        
        const price = data.chart?.result?.[0]?.meta?.regularMarketPrice
        const previousClose = data.chart?.result?.[0]?.meta?.previousClose || price

        if (!price || price <= 0) {
          throw new Error('No valid price in response')
        }

        console.log(`[Stock Price API] ✅ ${code} = Rp ${price}`)

        return NextResponse.json({
          price,
          previousClose,
          symbol: ticker
        })

      } catch (error: any) {
        lastError = error
        console.warn(`[Stock Price API] Attempt ${attempt} failed: ${error.message}`)
        
        // Wait before retry (1 second, 2 seconds, 3 seconds)
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000))
        }
      }
    }

    // Semua retry gagal
    console.error(`[Stock Price API] ❌ All attempts failed for ${ticker}:`, lastError)
    return NextResponse.json({ 
      price: 0, 
      previousClose: 0,
      error: lastError?.message || 'All retry attempts failed'
    })

  } catch (error: any) {
    console.error('[Stock Price API] ❌ Fatal error:', error)
    return NextResponse.json({ 
      price: 0, 
      previousClose: 0,
      error: error.message 
    })
  }
}