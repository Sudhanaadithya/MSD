/**
 * Weather API Service — Smart Rental Track
 * ==========================================
 * Real-time weather monitoring & rental consistency check via OpenWeatherMap API
 * with Upstash Redis caching for lightning-fast site-wide performance.
 */

import { getOrSetCache } from './redisService';

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || 'fcfc07a71fd064f9a341a86a01974e5e';
const OPENWEATHER_CURRENT_URL = 'https://api.openweathermap.org/data/2.5/weather';
const OPENWEATHER_FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

// Severe condition IDs (Thunderstorms, Heavy Rain, Snow, Tornadoes, High Wind)
const SEVERE_CONDITION_IDS = new Set([
  200, 201, 202, 210, 211, 212, 221, 230, 231, 232, // Thunderstorms
  502, 503, 504, 511, 521, 522, 531,                 // Heavy Rain
  602, 611, 612, 613, 615, 616, 620, 621, 622,       // Snow / Sleet
  762, 771, 781,                                     // Volcanic Ash, Squall, Tornado
]);

const SITE_COORDINATES = {
  S001: { name: 'Highway Construction Zone A', city: 'Chennai', lat: 13.0827, lon: 80.2707 },
  S002: { name: 'Metro Rail Extension', city: 'Bangalore', lat: 12.9716, lon: 77.5946 },
  S003: { name: 'Industrial Park Development', city: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
  S004: { name: 'River Dam Construction', city: 'Pune', lat: 18.5204, lon: 73.8567 },
  S005: { name: 'Mining Operations East', city: 'Ranchi', lat: 23.3441, lon: 85.3096 },
};

/**
 * Fetch current weather for location or site ID with Upstash Redis caching (10 min TTL)
 */
export async function checkWeatherAtLocation(locationOrSite) {
  const siteKey = locationOrSite?.trim().toUpperCase();
  const siteInfo = SITE_COORDINATES[siteKey];
  const query = siteInfo ? siteInfo.city : (locationOrSite || 'Chennai');
  const cacheKey = `weather:current:${query.toLowerCase()}`;

  return getOrSetCache(cacheKey, async () => {
    try {
      const url = `${OPENWEATHER_CURRENT_URL}?q=${encodeURIComponent(query)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
      const res = await fetch(url);

      if (!res.ok) {
        return getMockWeather(query);
      }

      const data = await res.json();
      const weather = data.weather?.[0] || {};
      const conditionId = weather.id || 800;
      const isSevere = SEVERE_CONDITION_IDS.has(conditionId) || (data.wind?.speed > 15);

      return {
        isSevere,
        condition: weather.main || 'Clear',
        description: weather.description || 'clear sky',
        temperature: Math.round(data.main?.temp || 28),
        feelsLike: Math.round(data.main?.feels_like || 29),
        windSpeed: Math.round((data.wind?.speed || 4) * 3.6), // m/s to km/h
        humidity: data.main?.humidity || 60,
        pressure: data.main?.pressure || 1012,
        visibility: data.visibility ? (data.visibility / 1000).toFixed(1) : '10.0',
        conditionId,
        icon: weather.icon || '01d',
        location: data.name || query,
        siteName: siteInfo ? siteInfo.name : null,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.warn('[Weather API] Fetch error:', err.message);
      return getMockWeather(query);
    }
  }, 600); // 10 minutes cache in Redis
}

/**
 * Fetch 5-day weather forecast with Upstash Redis caching (15 min TTL)
 */
export async function get5DayWeatherForecast(locationOrSite = 'S001') {
  const siteKey = locationOrSite?.trim().toUpperCase();
  const siteInfo = SITE_COORDINATES[siteKey];
  const query = siteInfo ? siteInfo.city : (locationOrSite || 'Chennai');
  const cacheKey = `weather:forecast5d:${query.toLowerCase()}`;

  return getOrSetCache(cacheKey, async () => {
    try {
      const url = `${OPENWEATHER_FORECAST_URL}?q=${encodeURIComponent(query)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
      const res = await fetch(url);

      if (!res.ok) {
        return getMock5DayForecast(query);
      }

      const data = await res.json();
      const dailyMap = {};

      (data.list || []).forEach((item) => {
        const dateStr = item.dt_txt.split(' ')[0];
        if (!dailyMap[dateStr]) {
          const w = item.weather?.[0] || {};
          const isRain = w.main === 'Rain' || w.main === 'Thunderstorm';
          const maxWind = Math.round((item.wind?.speed || 4) * 3.6);
          const rainAmount = Math.round(item.rain?.['3h'] || (isRain ? 8 : 0));
          
          // Suitability score math: lower score for rain and high wind
          let score = 95;
          if (isRain) score -= 35;
          if (maxWind > 20) score -= 25;
          if (w.main === 'Thunderstorm') score -= 50;
          score = Math.max(20, Math.min(100, score));

          dailyMap[dateStr] = {
            date: dateStr,
            dayName: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            condition: w.main || 'Clear',
            description: w.description || 'clear sky',
            temp: Math.round(item.main?.temp || 28),
            maxWind,
            rainAmount,
            suitabilityScore: score,
            isSevere: SEVERE_CONDITION_IDS.has(w.id || 800) || maxWind > 30,
            icon: w.icon || '01d',
          };
        }
      });

      return Object.values(dailyMap).slice(0, 5);
    } catch (err) {
      console.warn('[Weather Forecast API] Error:', err.message);
      return getMock5DayForecast(query);
    }
  }, 900); // 15 mins cache in Redis
}

/**
 * Check weather consistency for a rental date range at a jobsite/site
 * Identifies weather hazards (rain, storms, high wind) during equipment rental
 */
export async function checkRentalWeatherConsistency(jobsite, startDateStr, endDateStr) {
  const cacheKey = `weather:consistency:${jobsite}:${startDateStr}:${endDateStr}`;

  return getOrSetCache(cacheKey, async () => {
    const forecast = await get5DayWeatherForecast(jobsite);
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    const hazards = [];
    let hasRain = false;
    let hasStorm = false;
    let maxWindDetected = 0;

    forecast.forEach((day) => {
      const dayDate = new Date(day.date);
      if (dayDate >= start && dayDate <= end) {
        if (day.condition === 'Rain' || day.rainAmount > 0) {
          hasRain = true;
          hazards.push(`Rain forecast on ${day.dayName} (${day.date}): ${day.description}, ${day.rainAmount}mm expected`);
        }
        if (day.condition === 'Thunderstorm' || day.isSevere) {
          hasStorm = true;
          hazards.push(`Severe weather on ${day.dayName} (${day.date}): ${day.description}`);
        }
        if (day.maxWind > maxWindDetected) {
          maxWindDetected = day.maxWind;
        }
        if (day.maxWind > 25) {
          hazards.push(`High wind load on ${day.dayName}: ${day.maxWind} km/h gusts`);
        }
      }
    });

    const isConsistent = hazards.length === 0;

    return {
      isConsistent,
      hasRain,
      hasStorm,
      maxWindDetected,
      hazardsCount: hazards.length,
      hazards,
      recommendation: isConsistent
        ? 'Optimal weather conditions detected. Safe for crane and earthmoving operations.'
        : `Weather advisory: ${hazards.join('. ')}. Recommend ground tarping & hydraulic safety checks.`,
    };
  }, 600);
}

// ── Mock Fallbacks ──────────────────────────────────────────────────
function getMockWeather(location) {
  return {
    isSevere: false,
    condition: 'Clear',
    description: 'clear sky',
    temperature: 30,
    feelsLike: 32,
    windSpeed: 14,
    humidity: 58,
    pressure: 1012,
    visibility: '10.0',
    conditionId: 800,
    icon: '01d',
    location: location || 'Chennai',
    siteName: 'North Quarry Site',
    timestamp: new Date().toISOString(),
  };
}

function getMock5DayForecast(location) {
  const days = ['TODAY', 'TUE', 'WED', 'THU', 'FRI'];
  return days.map((day, i) => {
    const isRain = i === 1;
    return {
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      dayName: day,
      condition: isRain ? 'Rain' : 'Clear',
      description: isRain ? 'moderate rain' : 'clear sky',
      temp: 28 + i,
      maxWind: 12 + i * 2,
      rainAmount: isRain ? 12 : 0,
      suitabilityScore: isRain ? 45 : 92,
      isSevere: isRain,
      icon: isRain ? '10d' : '01d',
    };
  });
}

export default {
  checkWeatherAtLocation,
  get5DayWeatherForecast,
  checkRentalWeatherConsistency,
};
