import { NextRequest, NextResponse } from 'next/server'

const WMO_CODES: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Foggy', 51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
  61: 'Rain', 63: 'Rain', 65: 'Heavy rain',
  80: 'Rain showers', 81: 'Rain showers', 82: 'Heavy showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
}

const WMO_ICON: Record<number, string> = {
  0: 'sun', 1: 'sun', 2: 'cloud-sun', 3: 'cloud',
  45: 'cloud-fog', 48: 'cloud-fog',
  51: 'cloud-drizzle', 53: 'cloud-drizzle', 55: 'cloud-drizzle',
  61: 'cloud-rain', 63: 'cloud-rain', 65: 'cloud-rain',
  80: 'cloud-rain', 81: 'cloud-rain', 82: 'cloud-storm',
  95: 'cloud-storm', 96: 'cloud-storm', 99: 'cloud-storm',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// GET /api/weather?lat=-6.2088&lon=106.8456&location=Jakarta
// Defaults to Jakarta if no params
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat') || '-6.2088'
  const lon = searchParams.get('lon') || '106.8456'
  const location = searchParams.get('location') || 'Jakarta'

  try {
    const url = [
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`,
      'current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
      'daily=weather_code,temperature_2m_max,temperature_2m_min',
      'timezone=auto&forecast_days=6',
    ].join('&')

    const res = await fetch(url, { next: { revalidate: 1800 } }) // cache 30 min
    if (!res.ok) throw new Error('Open-Meteo failed')
    const d = await res.json()

    const curr = d.current
    const daily = d.daily

    const forecast = daily.time.slice(1, 6).map((date: string, i: number) => ({
      day: DAYS[new Date(date).getDay()],
      icon: WMO_ICON[daily.weather_code[i + 1]] || 'cloud',
      temp: Math.round(daily.temperature_2m_max[i + 1]),
    }))

    return NextResponse.json({
      location,
      temp: Math.round(curr.temperature_2m),
      feelsLike: Math.round(curr.apparent_temperature),
      description: WMO_CODES[curr.weather_code] || 'Clear',
      icon: WMO_ICON[curr.weather_code] || 'sun',
      humidity: curr.relative_humidity_2m,
      windSpeed: Math.round(curr.wind_speed_10m),
      high: Math.round(daily.temperature_2m_max[0]),
      low: Math.round(daily.temperature_2m_min[0]),
      forecast,
    })
  } catch (err) {
    console.error('Weather error:', err)
    return NextResponse.json({ error: 'Weather unavailable' }, { status: 500 })
  }
}
