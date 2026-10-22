import { NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code parameter is required' }, { status: 400 })
    }

    const ticker = `${code}.JK`
    
    console.log(`[Stock Price API] Fetching price for ${ticker} using yahoo-finance2`)

    // Pakai library yahoo-finance2 dengan type assertion
    const quote: any = await yahooFinance.quote(ticker)
    
    const price = quote.regularMarketPrice || 0
    const previousClose = quote.regularMarketPreviousClose || price

    if (!price || price <= 0) {
      console.warn(`[Stock Price API] No valid price for ${ticker}`)
      return NextResponse.json({ 
        price: 0, 
        previousClose: 0,
        error: 'No valid price found'
      })
    }

    console.log(`[Stock Price API] ✅ ${code} = Rp ${price}`)

    return NextResponse.json({
      price,
      previousClose,
      symbol: ticker
    })

  } catch (error: any) {
    console.error('[Stock Price API] ❌ Error:', error.message)
    return NextResponse.json({ 
      price: 0, 
      previousClose: 0,
      error: error.message 
    })
  }
}