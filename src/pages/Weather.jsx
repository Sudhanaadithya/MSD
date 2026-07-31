import React, { useState, useEffect, useRef } from 'react';
import { checkWeatherAtLocation, get5DayWeatherForecast } from '../services/weatherApi';

const SITES = [
  { id: 'S001', name: 'Highway Construction Zone A', city: 'Chennai' },
  { id: 'S002', name: 'Metro Rail Extension', city: 'Bangalore' },
  { id: 'S003', name: 'Industrial Park Development', city: 'Hyderabad' },
  { id: 'S004', name: 'River Dam Construction', city: 'Pune' },
  { id: 'S005', name: 'Mining Operations East', city: 'Ranchi' },
];

const Weather = () => {
  const [selectedSiteId, setSelectedSiteId] = useState('S001');
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPrompt, setShowPrompt] = useState(true);
  const weatherContainerRef = useRef(null);

  const activeSite = SITES.find((s) => s.id === selectedSiteId) || SITES[0];

  useEffect(() => {
    async function loadWeatherData() {
      setLoading(true);
      try {
        const [weatherData, forecastData] = await Promise.all([
          checkWeatherAtLocation(selectedSiteId),
          get5DayWeatherForecast(selectedSiteId),
        ]);
        setCurrentWeather(weatherData);
        setForecast(forecastData);
      } catch (err) {
        console.error('Weather load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadWeatherData();
  }, [selectedSiteId]);

  useEffect(() => {
    const container = weatherContainerRef.current;
    if (container) {
      container.innerHTML = '';
      const isRainy = currentWeather?.condition === 'Rain' || currentWeather?.condition === 'Thunderstorm';
      const count = isRainy ? 60 : 15;
      for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '1px';
        particle.style.height = isRainy ? '15px' : '3px';
        particle.style.background = 'white';
        particle.style.opacity = (Math.random() * 0.5).toString();
        particle.style.top = Math.random() * 100 + '%';
        particle.style.left = Math.random() * 100 + '%';

        particle.animate(
          [
            { transform: 'translateY(0) rotate(20deg)', opacity: 0 },
            { transform: 'translateY(100vh) rotate(20deg)', opacity: 0.5 },
            { transform: 'translateY(120vh) rotate(20deg)', opacity: 0 },
          ],
          {
            duration: 1000 + Math.random() * 2000,
            iterations: Infinity,
            delay: Math.random() * 2000,
          }
        );

        container.appendChild(particle);
      }
    }
  }, [currentWeather]);

  return (
    <div className="flex flex-col w-full">
      {/* Site Selector Bar */}
      <div className="bg-surface-white p-md rounded-xl shadow-sm border border-outline-variant mb-md flex flex-col sm:flex-row items-center justify-between gap-md">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary text-2xl">thermostat</span>
          <div>
            <h2 className="font-label-bold text-xs uppercase tracking-widest text-secondary">
              OpenWeather Live Tracking + Upstash Redis Cache
            </h2>
            <span className="font-headline-sm text-on-surface">Active Construction Project Site</span>
          </div>
        </div>

        <div className="flex items-center gap-xs overflow-x-auto max-w-full pb-xs sm:pb-0">
          {SITES.map((site) => (
            <button
              key={site.id}
              onClick={() => setSelectedSiteId(site.id)}
              className={`px-3 py-1.5 rounded-lg font-label-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedSiteId === site.id
                  ? 'bg-[#FFCD00] text-gray-950 shadow-sm font-black'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {site.id} - {site.city}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Section: Site Weather Status */}
      <section className="relative w-full h-[460px] overflow-hidden bg-inverse-surface rounded-2xl shadow-xl">
        <div className="absolute inset-0 opacity-40 mix-blend-overlay">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1600&q=80')",
            }}
          ></div>
        </div>
        {/* Animated Particle Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 opacity-30" ref={weatherContainerRef}></div>
        </div>
        <div className="relative h-full flex flex-col justify-end p-xl bg-gradient-to-t from-inverse-surface via-inverse-surface/50 to-transparent">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg">
            <div className="space-y-sm">
              <div className="flex items-center gap-xs text-primary-container">
                <span className="material-symbols-outlined text-headline-sm">location_on</span>
                <span className="font-label-bold uppercase tracking-widest text-amber-300">
                  {activeSite.name} ({activeSite.city}, India)
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold border border-emerald-500/30">
                  ⚡ Redis Cached
                </span>
              </div>
              <div className="flex items-center gap-md">
                <span className="font-display-lg text-[100px] leading-none text-surface-white font-black">
                  {loading ? '--' : `${currentWeather?.temperature || 28}°`}
                </span>
                <div className="flex flex-col">
                  <span className="font-headline-lg text-surface-white capitalize text-2xl font-bold">
                    {loading ? 'Fetching Weather...' : currentWeather?.description || 'Clear sky'}
                  </span>
                  <span className="font-body-md text-surface-variant text-sm">
                    Feels like {currentWeather?.feelsLike || 29}° • Humidity {currentWeather?.humidity || 60}%
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-md bg-surface-white/10 backdrop-blur-md p-lg rounded-xl border border-surface-white/20">
              <div className="flex flex-col border-r border-surface-white/10 pr-md">
                <span className="font-label-bold text-amber-300 text-xs uppercase">Wind Load</span>
                <span className="font-stat-number text-surface-white text-2xl font-bold">
                  {currentWeather?.windSpeed || 14}{' '}
                  <small className="text-body-sm font-normal text-xs">km/h</small>
                </span>
                <span
                  className={`font-label-bold flex items-center gap-1 text-xs mt-1 ${
                    (currentWeather?.windSpeed || 0) > 20 ? 'text-status-warning' : 'text-status-success'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">air</span>
                  {(currentWeather?.windSpeed || 0) > 20 ? 'Gusty Load' : 'Normal Wind'}
                </span>
              </div>
              <div className="flex flex-col border-r border-surface-white/10 pr-md">
                <span className="font-label-bold text-amber-300 text-xs uppercase">Visibility</span>
                <span className="font-stat-number text-surface-white text-2xl font-bold">
                  {currentWeather?.visibility || '10.0'}{' '}
                  <small className="text-body-sm font-normal text-xs">km</small>
                </span>
                <span className="text-status-success font-label-bold flex items-center gap-1 text-xs mt-1">
                  <span className="material-symbols-outlined text-sm">visibility</span> High Clarity
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-bold text-amber-300 text-xs uppercase">Barometer</span>
                <span className="font-stat-number text-surface-white text-2xl font-bold">
                  {currentWeather?.pressure || 1012}{' '}
                  <small className="text-body-sm font-normal text-xs">hPa</small>
                </span>
                <span className="text-status-success font-label-bold flex items-center gap-1 text-xs mt-1">
                  <span className="material-symbols-outlined text-sm">trending_flat</span> Steady
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="py-xl grid grid-cols-12 gap-lg relative z-10">
        {/* Left Column: Forecast & Suitability */}
        <div className="col-span-12 lg:col-span-8 space-y-lg">
          {/* Operational Suitability Card */}
          <div className="bg-surface-white rounded-xl shadow-xl overflow-hidden border border-outline-variant">
            <div className="bg-primary h-1.5 w-full"></div>
            <div className="p-lg flex items-center justify-between border-b border-border-subtle">
              <div>
                <h2 className="font-headline-md text-on-surface font-bold text-lg">
                  Fleet Operational Suitability & Rain Forecast
                </h2>
                <p className="font-body-sm text-on-surface-variant text-xs">
                  Real-time machine safety thresholds derived from OpenWeather 5-Day forecast models.
                </p>
              </div>
              <div className="flex items-center gap-sm">
                <div className="flex items-center gap-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-status-success"></div>
                  <span className="font-label-bold text-[10px]">OPTIMAL</span>
                </div>
                <div className="flex items-center gap-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-status-warning"></div>
                  <span className="font-label-bold text-[10px]">CAUTION</span>
                </div>
                <div className="flex items-center gap-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-status-error"></div>
                  <span className="font-label-bold text-[10px]">RESTRICTED</span>
                </div>
              </div>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-xs font-bold uppercase text-on-surface-variant">
                    <th className="p-md">DATE</th>
                    <th className="p-md">CONDITIONS</th>
                    <th className="p-md">MAX WIND</th>
                    <th className="p-md">PRECIPITATION</th>
                    <th className="p-md">SUITABILITY SCORE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-sm">
                  {forecast.map((day, idx) => {
                    const isOptimal = day.suitabilityScore >= 80;
                    const isWarning = day.suitabilityScore >= 50 && day.suitabilityScore < 80;
                    const colorClass = isOptimal
                      ? 'border-status-success text-status-success'
                      : isWarning
                      ? 'border-status-warning text-status-warning'
                      : 'border-status-error text-status-error';

                    return (
                      <tr key={idx} className="hover:bg-primary-container/5 transition-colors">
                        <td className={`p-md font-label-bold border-l-4 ${colorClass}`}>
                          {day.dayName} <span className="text-xs text-secondary font-mono">({day.date})</span>
                        </td>
                        <td className="p-md">
                          <div className="flex items-center gap-sm">
                            <span className="material-symbols-outlined text-on-surface-variant">
                              {day.condition === 'Rain' ? 'rainy' : day.condition === 'Thunderstorm' ? 'thunderstorm' : 'sunny'}
                            </span>
                            <span className="font-body-md text-on-surface capitalize">{day.description}</span>
                          </div>
                        </td>
                        <td className="p-md font-body-md font-mono">{day.maxWind} km/h</td>
                        <td className="p-md font-body-md font-mono">{day.rainAmount} mm</td>
                        <td className="p-md">
                          <div className="flex items-center gap-md">
                            <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  isOptimal ? 'bg-status-success' : isWarning ? 'bg-status-warning' : 'bg-status-error'
                                }`}
                                style={{ width: `${day.suitabilityScore}%` }}
                              ></div>
                            </div>
                            <span className={`font-stat-number text-base font-bold ${colorClass.split(' ')[1]}`}>
                              {day.suitabilityScore}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Protocol */}
        <div className="col-span-12 lg:col-span-4 space-y-lg">
          {/* Weather Risk Card */}
          <div className="bg-surface-white rounded-xl shadow-xl overflow-hidden border border-outline-variant">
            <div className="bg-status-error h-1.5 w-full"></div>
            <div className="p-lg bg-error-container/20 border-b border-error-container">
              <div className="flex items-center gap-md">
                <span className="material-symbols-outlined text-status-error text-[32px]">warning</span>
                <div>
                  <h3 className="font-headline-sm text-on-error-container font-bold text-base">
                    Rental Weather Consistency Advisory
                  </h3>
                  <p className="font-label-bold text-status-error uppercase text-[10px] tracking-widest">
                    Automated Risk Engine
                  </p>
                </div>
              </div>
            </div>
            <div className="p-lg space-y-md">
              <div className="p-md bg-surface-container rounded-lg border-l-4 border-status-warning text-xs">
                <p className="font-label-bold text-on-surface mb-1">RAINFALL & WIND ADVISORY</p>
                <p className="font-body-sm text-on-surface-variant">
                  {currentWeather?.isSevere
                    ? `Severe conditions detected at ${activeSite.city}! Ground saturation warning active.`
                    : `Current conditions at ${activeSite.city} are stable (${currentWeather?.temperature}°C). Continuous monitoring enabled.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Weather;
