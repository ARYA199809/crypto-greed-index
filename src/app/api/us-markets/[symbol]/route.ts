import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

const SYMBOL_MAP = {
  'sp500': '^GSPC',
  'nasdaq': '^IXIC',
  'dow-jones': '^DJI',
  'russell2000': '^RUT',
  'dollar-index': 'DX-Y.NYB'
} as const;

type RouteParams = {
  symbol: keyof typeof SYMBOL_MAP;
};

interface HistoricalDataItem {
  date: Date;
  close: number;
}

const getTimeRangeDates = (timeRange: string) => {
  const now = new Date();
  let startDate = new Date();

  switch (timeRange) {
    case '1D':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);  // Start of today
      break;
    case '1W':
      startDate.setDate(now.getDate() - 7);
      break;
    case '1M':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case '3M':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case '6M':
      startDate.setMonth(now.getMonth() - 6);
      break;
    case '1Y':
    default:
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  return { startDate, endDate: now };
};

async function fetchIntradayData(symbol: string, timeRange: '1D' | '1W') {
  try {
    // Use v8 API for intraday data
    const response = await fetch(
      `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${timeRange === '1D' ? '5m' : '15m'}&range=${timeRange === '1D' ? '1d' : '7d'}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch intraday data');
    }

    const data = await response.json();
    const timestamps = data.chart.result[0].timestamp;
    const quotes = data.chart.result[0].indicators.quote[0];
    const { high, low, close } = quotes;

    return timestamps.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000),
      close: close[index] || close[index - 1], // Use previous close if current is null
      high: high[index] || high[index - 1],    // Use previous high if current is null
      low: low[index] || low[index - 1]        // Use previous low if current is null
    }));
  } catch (error) {
    console.error('Error fetching intraday data:', error);
    throw error;
  }
}

async function fetchIndexData(symbol: string, timeRange: string = '1Y') {
  try {
    const isIntraday = timeRange === '1D' || timeRange === '1W';
    const [quote, historical] = await Promise.all([
      yahooFinance.quote(symbol),
      isIntraday 
        ? fetchIntradayData(symbol, timeRange as '1D' | '1W')
        : yahooFinance.historical(symbol, {
            period1: getTimeRangeDates(timeRange).startDate,
            period2: getTimeRangeDates(timeRange).endDate,
            interval: '1d'
          })
    ]);

    if (!quote || !historical) {
      throw new Error(`Failed to fetch data for ${symbol}`);
    }

    // Get year start date for YTD calculations
    const yearStartDate = new Date(new Date().getFullYear(), 0, 1);
    const yearStartData = historical.find((data: HistoricalDataItem) => 
      new Date(data.date).getTime() >= yearStartDate.getTime()
    );

    const regularMarketPrice = quote.regularMarketPrice || 0;
    const yearStartClose = yearStartData?.close || regularMarketPrice;

    // Calculate YTD change
    const yearToDateChange = regularMarketPrice - yearStartClose;
    const yearToDatePercent = (yearToDateChange / yearStartClose) * 100;

    // Calculate week change (7 days)
    const weekAgoDate = new Date();
    weekAgoDate.setDate(weekAgoDate.getDate() - 7);
    const weekAgoData = historical.find((data: HistoricalDataItem) => 
      new Date(data.date).getTime() >= weekAgoDate.getTime()
    );
    const weekChange = regularMarketPrice - (weekAgoData?.close || regularMarketPrice);
    const weekChangePercent = (weekChange / (weekAgoData?.close || regularMarketPrice)) * 100;

    // Calculate month change (30 days)
    const monthAgoDate = new Date();
    monthAgoDate.setDate(monthAgoDate.getDate() - 30);
    const monthAgoData = historical.find((data: HistoricalDataItem) => 
      new Date(data.date).getTime() >= monthAgoDate.getTime()
    );
    const monthChange = regularMarketPrice - (monthAgoData?.close || regularMarketPrice);
    const monthChangePercent = (monthChange / (monthAgoData?.close || regularMarketPrice)) * 100;

    // Get daily range from quote data
    const dailyHigh = quote.regularMarketDayHigh || regularMarketPrice;
    const dailyLow = quote.regularMarketDayLow || regularMarketPrice;

    // Format historical data with appropriate date formatting based on time range
    const formattedHistorical = historical.map((item: HistoricalDataItem) => ({
      date: isIntraday
        ? new Date(item.date).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })
        : new Date(item.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
      value: item.close
    }));

    return {
      historicalData: formattedHistorical,
      currentStats: {
        price: regularMarketPrice,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        weekChange,
        weekChangePercent,
        monthChange,
        monthChangePercent,
        yearToDateChange,
        yearToDatePercent,
        high52Week: quote.fiftyTwoWeekHigh || regularMarketPrice,
        low52Week: quote.fiftyTwoWeekLow || regularMarketPrice,
        dailyHigh,
        dailyLow,
        volume: quote.regularMarketVolume || 0
      }
    };
  } catch (error) {
    console.error('Error fetching index data:', error);
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const resolvedParams = await params;
    const { symbol } = resolvedParams;
    const yahooSymbol = SYMBOL_MAP[symbol];
    const timeRange = request.nextUrl.searchParams.get('timeRange') || '1Y';

    if (!yahooSymbol) {
      return NextResponse.json(
        { success: false, error: 'Invalid market index symbol' },
        { status: 400 }
      );
    }

    const data = await fetchIndexData(yahooSymbol, timeRange);

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        lastUpdated: new Date().toLocaleTimeString()
      }
    });
  } catch (error) {
    console.error('Error in market index API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
} 