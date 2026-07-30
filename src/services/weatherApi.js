/**
 * Weather API Service — Smart Rental Track
 * ==========================================
 * Checks weather conditions at a given location using OpenWeatherMap.
 * Falls back to mock data if VITE_OPENWEATHER_API_KEY is not set.
 */

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';
const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5/weather';

// Severe weather condition codes from OpenWeatherMap
// 2xx = Thunderstorm, 3xx = Drizzle (not severe), 5xx = Rain, 6xx = Snow, 7xx = Atmosphere (fog etc), 800 = Clear, 80x = Clouds
const SEVERE_CONDITION_IDS = new Set([
  // Thunderstorms (all)
  200, 201, 202, 210, 211, 212, 221, 230, 231, 232,
  // Heavy rain
  502, 503, 504, 511, 521, 522, 531,
  // Heavy snow / sleet
  602, 611, 612, 613, 615, 616, 620, 621, 622,
  // Extreme atmosphere
  762, 771, 781,
]);

/**
 * Check weather at a given location string.
 * @param {string} location - City name or "city,country" format
 * @returns {Promise<{isSevere: boolean, condition: string, description: string, temperature: number, windSpeed: number, conditionId: number, icon: string}>}
 */
export async function checkWeatherAtLocation(location) {
  if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === 'YOUR_OPENWEATHER_API_KEY') {
    console.info('No OpenWeather API key — using mock weather data.');
    return getMockWeather(location);
  }

  try {
    const url = `${OPENWEATHER_BASE}?q=${encodeURIComponent(location)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Weather API error (${res.status}) — falling back to mock data.`);
      return getMockWeather(location);
    }

    const data = await res.json();
    const weather = data.weather?.[0] || {};
    const conditionId = weather.id || 800;
    const isSevere = SEVERE_CONDITION_IDS.has(conditionId);

    return {
      isSevere,
      condition: weather.main || 'Clear',
      description: weather.description || 'clear sky',
      temperature: Math.round(data.main?.temp || 25),
      windSpeed: Math.round(data.wind?.speed || 5),
      humidity: data.main?.humidity || 50,
      conditionId,
      icon: weather.icon || '01d',
      location: data.name || location,
    };
  } catch (err) {
    console.warn('Weather API fetch failed:', err.message);
    return getMockWeather(location);
  }
}

/**
 * Mock weather data for development/fallback.
 */
function getMockWeather(location) {
  // Randomly return normal or severe weather for demo purposes
  const scenarios = [
    { isSevere: false, condition: 'Clear', description: 'clear sky', temperature: 32, windSpeed: 8, humidity: 45, conditionId: 800, icon: '01d' },
    { isSevere: false, condition: 'Clouds', description: 'scattered clouds', temperature: 28, windSpeed: 12, humidity: 55, conditionId: 802, icon: '03d' },
    { isSevere: true, condition: 'Thunderstorm', description: 'thunderstorm with heavy rain', temperature: 24, windSpeed: 35, humidity: 90, conditionId: 202, icon: '11d' },
    { isSevere: true, condition: 'Rain', description: 'heavy intensity rain', temperature: 22, windSpeed: 25, humidity: 85, conditionId: 502, icon: '10d' },
    { isSevere: false, condition: 'Rain', description: 'light rain', temperature: 26, windSpeed: 10, humidity: 70, conditionId: 500, icon: '10d' },
  ];

  // Use a hash of the location to get deterministic but varied results
  const hash = location.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const scenario = scenarios[hash % scenarios.length];

  return {
    ...scenario,
    location: location || 'Unknown',
  };
}

export default { checkWeatherAtLocation };
