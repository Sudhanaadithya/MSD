import React, { useState, useEffect, useRef } from 'react';

const Weather = () => {
  const [showPrompt, setShowPrompt] = useState(true);
  const weatherContainerRef = useRef(null);

  useEffect(() => {
    const container = weatherContainerRef.current;
    if (container) {
      // Clean up previous particles if any
      container.innerHTML = '';
      for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '1px';
        particle.style.height = '15px';
        particle.style.background = 'white';
        particle.style.opacity = (Math.random() * 0.5).toString();
        particle.style.top = Math.random() * 100 + '%';
        particle.style.left = Math.random() * 100 + '%';
        
        particle.animate([
          { transform: 'translateY(0) rotate(20deg)', opacity: 0 },
          { transform: 'translateY(100vh) rotate(20deg)', opacity: 0.5 },
          { transform: 'translateY(120vh) rotate(20deg)', opacity: 0 }
        ], {
          duration: 1000 + Math.random() * 2000,
          iterations: Infinity,
          delay: Math.random() * 2000
        });
        
        container.appendChild(particle);
      }
    }
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section: Site Weather Status */}
      <section className="relative w-full h-[500px] overflow-hidden bg-inverse-surface -mt-lg -mx-lg w-[calc(100%+64px)]">
        <div className="absolute inset-0 opacity-40 mix-blend-overlay">
          <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDoT3keCTu97tw72bdyjs4cidJGFg_IcqJX_zL-5jHU2gIcF7NZmGFiFUYpjJwkrnnIxtuVpv0mbynS5bVIYL9nqOI8j61x_dz5YRDD0F7xtubirPtC2_pmoMIn8hKzkwXVjPgo6M77HSsHgqDZeuBagcWyqCvDnjSD8_Y9i4geNJTqg0CDS8RMGh52gTbedN792n7xzRjzyAYhhe5MdvvQN_1peDiZaf2jOnwYHwEdWVJXRHUjiLiw')" }}></div>
        </div>
        {/* Animated Rain/Mist Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 opacity-20" ref={weatherContainerRef}></div>
        </div>
        <div className="relative h-full flex flex-col justify-end p-xl bg-gradient-to-t from-inverse-surface via-inverse-surface/40 to-transparent">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg">
            <div className="space-y-sm">
              <div className="flex items-center gap-xs text-primary-container">
                <span className="material-symbols-outlined text-headline-sm">location_on</span>
                <span className="font-label-bold uppercase tracking-widest">North Quarry Primary Site</span>
              </div>
              <div className="flex items-center gap-md">
                <span className="font-display-lg text-[120px] leading-none text-surface-white">14°</span>
                <div className="flex flex-col">
                  <span className="font-headline-lg text-surface-white">Light Rain</span>
                  <span className="font-body-md text-surface-variant">Feels like 11° • Humidity 88%</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-md bg-surface-white/10 backdrop-blur-md p-lg rounded-xl border border-surface-white/20">
              <div className="flex flex-col border-r border-surface-white/10 pr-md">
                <span className="font-label-bold text-tertiary-fixed uppercase">Wind Speed</span>
                <span className="font-stat-number text-surface-white">24 <small className="text-body-sm font-normal">km/h</small></span>
                <span className="text-status-warning font-label-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span> Gusty
                </span>
              </div>
              <div className="flex flex-col border-r border-surface-white/10 pr-md">
                <span className="font-label-bold text-tertiary-fixed uppercase">Visibility</span>
                <span className="font-stat-number text-surface-white">1.2 <small className="text-body-sm font-normal">km</small></span>
                <span className="text-status-error font-label-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">visibility_off</span> Low
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-bold text-tertiary-fixed uppercase">Barometer</span>
                <span className="font-stat-number text-surface-white">1012 <small className="text-body-sm font-normal">hPa</small></span>
                <span className="text-status-success font-label-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">trending_flat</span> Steady
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="py-xl grid grid-cols-12 gap-lg relative z-10 -mt-16">
        {/* Left Column: Forecast & Suitability */}
        <div className="col-span-12 lg:col-span-8 space-y-lg">
          {/* Operational Suitability Card */}
          <div className="bg-surface-white rounded-xl shadow-xl overflow-hidden">
            <div className="bg-primary h-1 w-full"></div>
            <div className="p-lg flex items-center justify-between border-b border-border-subtle">
              <div>
                <h2 className="font-headline-md text-on-surface">Fleet Operational Suitability</h2>
                <p className="font-body-sm text-on-surface-variant">Machine safety thresholds based on predicted precipitation and wind load.</p>
              </div>
              <div className="flex items-center gap-sm">
                <div className="flex items-center gap-xs">
                  <div className="w-3 h-3 rounded-full bg-status-success"></div>
                  <span className="font-label-bold text-[10px]">OPTIMAL</span>
                </div>
                <div className="flex items-center gap-xs">
                  <div className="w-3 h-3 rounded-full bg-status-warning"></div>
                  <span className="font-label-bold text-[10px]">CAUTION</span>
                </div>
                <div className="flex items-center gap-xs">
                  <div className="w-3 h-3 rounded-full bg-status-error"></div>
                  <span className="font-label-bold text-[10px]">RESTRICTED</span>
                </div>
              </div>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="p-md font-label-bold text-on-surface-variant">DATE</th>
                    <th className="p-md font-label-bold text-on-surface-variant">CONDITIONS</th>
                    <th className="p-md font-label-bold text-on-surface-variant">MAX WIND</th>
                    <th className="p-md font-label-bold text-on-surface-variant">RAIN</th>
                    <th className="p-md font-label-bold text-on-surface-variant">SUITABILITY SCORE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {/* Day 1 */}
                  <tr className="hover:bg-primary-container/5 transition-colors group">
                    <td className="p-md font-label-bold border-l-4 border-status-error">TODAY</td>
                    <td className="p-md">
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-on-surface-variant">rainy</span>
                        <span className="font-body-md text-on-surface">Mod. Rain</span>
                      </div>
                    </td>
                    <td className="p-md font-body-md">28 km/h</td>
                    <td className="p-md font-body-md">12mm</td>
                    <td className="p-md">
                      <div className="flex items-center gap-md">
                        <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full bg-status-error w-[35%]"></div>
                        </div>
                        <span className="font-stat-number text-status-error !text-[18px]">35%</span>
                      </div>
                    </td>
                  </tr>
                  {/* Day 2 */}
                  <tr className="hover:bg-primary-container/5 transition-colors">
                    <td className="p-md font-label-bold border-l-4 border-status-warning">TUE 14</td>
                    <td className="p-md">
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-on-surface-variant">partly_cloudy_day</span>
                        <span className="font-body-md text-on-surface">P. Cloudy</span>
                      </div>
                    </td>
                    <td className="p-md font-body-md">15 km/h</td>
                    <td className="p-md font-body-md">1mm</td>
                    <td className="p-md">
                      <div className="flex items-center gap-md">
                        <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full bg-status-warning w-[72%]"></div>
                        </div>
                        <span className="font-stat-number text-status-warning !text-[18px]">72%</span>
                      </div>
                    </td>
                  </tr>
                  {/* Day 3 */}
                  <tr className="hover:bg-primary-container/5 transition-colors">
                    <td className="p-md font-label-bold border-l-4 border-status-success">WED 15</td>
                    <td className="p-md">
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-on-surface-variant">sunny</span>
                        <span className="font-body-md text-on-surface">Clear</span>
                      </div>
                    </td>
                    <td className="p-md font-body-md">8 km/h</td>
                    <td className="p-md font-body-md">0mm</td>
                    <td className="p-md">
                      <div className="flex items-center gap-md">
                        <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full bg-status-success w-[98%]"></div>
                        </div>
                        <span className="font-stat-number text-status-success !text-[18px]">98%</span>
                      </div>
                    </td>
                  </tr>
                  {/* Day 4 */}
                  <tr className="hover:bg-primary-container/5 transition-colors">
                    <td className="p-md font-label-bold border-l-4 border-status-success">THU 16</td>
                    <td className="p-md">
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-on-surface-variant">sunny</span>
                        <span className="font-body-md text-on-surface">Clear</span>
                      </div>
                    </td>
                    <td className="p-md font-body-md">10 km/h</td>
                    <td className="p-md font-body-md">0mm</td>
                    <td className="p-md">
                      <div className="flex items-center gap-md">
                        <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full bg-status-success w-[95%]"></div>
                        </div>
                        <span className="font-stat-number text-status-success !text-[18px]">95%</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Weather Map Widget */}
          <div className="bg-surface-white rounded-xl shadow-xl overflow-hidden h-[400px] flex flex-col">
            <div className="bg-primary h-1 w-full"></div>
            <div className="p-md border-b border-border-subtle flex items-center justify-between">
              <span className="font-label-bold text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">radar</span>
                LIVE PRECIPITATION RADAR
              </span>
              <div className="flex gap-xs">
                <button className="px-md py-1 bg-surface-container rounded-full text-label-bold hover:bg-secondary-container transition-colors">REFRESH</button>
                <button className="px-md py-1 bg-primary text-on-primary rounded-full text-label-bold hover:opacity-90">FULLSCREEN</button>
              </div>
            </div>
            <div className="flex-1 relative bg-surface-container">
              {/* Note: Map background image removed or replaced with a solid color/placeholder since original relied on a broken Google URL, or we can keep it without the image */}
              <div className="w-full h-full bg-cover bg-center grayscale contrast-125 brightness-75 bg-surface-container-high"></div>
              {/* Mock Radar Overlays */}
              <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 800 400">
                  <circle cx="400" cy="200" fill="rgba(34, 197, 94, 0.2)" r="100" stroke="rgba(34, 197, 94, 0.4)" strokeWidth="2">
                    <animate attributeName="r" dur="4s" repeatCount="indefinite" values="80;120;80"></animate>
                    <animate attributeName="opacity" dur="4s" repeatCount="indefinite" values="0.2;0.5;0.2"></animate>
                  </circle>
                  <path className="animate-pulse" d="M500,100 Q600,150 550,250 T700,300" fill="none" stroke="rgba(239, 68, 68, 0.5)" strokeLinecap="round" strokeWidth="40"></path>
                </svg>
              </div>
              {/* Legend */}
              <div className="absolute bottom-md left-md bg-inverse-surface/90 backdrop-blur p-sm rounded-lg border border-surface-white/10 flex flex-col gap-xs">
                <div className="flex items-center gap-xs">
                  <div className="w-3 h-3 bg-status-error rounded-sm"></div>
                  <span className="text-[10px] font-label-bold text-surface-white">SEVERE STORM</span>
                </div>
                <div className="flex items-center gap-xs">
                  <div className="w-3 h-3 bg-status-warning rounded-sm"></div>
                  <span className="text-[10px] font-label-bold text-surface-white">HEAVY RAIN</span>
                </div>
                <div className="flex items-center gap-xs">
                  <div className="w-3 h-3 bg-status-success rounded-sm"></div>
                  <span className="text-[10px] font-label-bold text-surface-white">LIGHT PRECIP</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar Alerts & Info */}
        <div className="col-span-12 lg:col-span-4 space-y-lg">
          {/* Severe Weather Alerts Widget */}
          <div className="bg-surface-white rounded-xl shadow-xl overflow-hidden">
            <div className="bg-status-error h-1 w-full"></div>
            <div className="p-lg bg-error-container/20 border-b border-error-container">
              <div className="flex items-center gap-md">
                <span className="material-symbols-outlined text-status-error text-[32px]">warning</span>
                <div>
                  <h3 className="font-headline-sm text-on-error-container">Severe Weather Warning</h3>
                  <p className="font-label-bold text-status-error uppercase text-[10px] tracking-widest">Active Level 3 Alert</p>
                </div>
              </div>
            </div>
            <div className="p-lg space-y-md">
              <div className="p-md bg-surface-container rounded-lg border-l-4 border-status-error">
                <p className="font-label-bold text-on-surface text-xs mb-1">GALE FORCE WINDS</p>
                <p className="font-body-sm text-on-surface-variant">Expect wind gusts up to 85 km/h between 14:00 and 19:00 today. All crane operations must cease by 13:30.</p>
              </div>
              <div className="p-md bg-surface-container rounded-lg border-l-4 border-status-warning">
                <p className="font-label-bold text-on-surface text-xs mb-1">FLASH FLOOD RISK</p>
                <p className="font-body-sm text-on-surface-variant">Low-lying transit zones in Sectors 4B and 9 are at high risk of saturation. Divert heavy haulers to high-grade paths.</p>
              </div>
              <button className="w-full py-md bg-inverse-surface text-surface-white font-label-bold rounded-lg hover:bg-on-surface transition-colors flex items-center justify-center gap-sm uppercase tracking-tighter">
                <span className="material-symbols-outlined text-sm">notifications_active</span>
                Manage Alert Protocol
              </button>
            </div>
          </div>

          {/* Historical Comparison */}
          <div className="bg-surface-white rounded-xl shadow-xl overflow-hidden">
            <div className="bg-primary h-1 w-full"></div>
            <div className="p-lg">
              <h3 className="font-label-bold text-on-surface-variant uppercase mb-md">30-Day Precipitation Trends</h3>
              <div className="h-32 w-full flex items-end gap-1">
                {/* Tiny Sparkline Bars */}
                <div className="flex-1 bg-surface-container h-8 rounded-t-sm"></div>
                <div className="flex-1 bg-surface-container h-12 rounded-t-sm"></div>
                <div className="flex-1 bg-surface-container h-6 rounded-t-sm"></div>
                <div className="flex-1 bg-primary/40 h-24 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-28 rounded-t-sm"></div>
                <div className="flex-1 bg-surface-container h-10 rounded-t-sm"></div>
                <div className="flex-1 bg-surface-container h-4 rounded-t-sm"></div>
                <div className="flex-1 bg-surface-container h-12 rounded-t-sm"></div>
                <div className="flex-1 bg-surface-container h-16 rounded-t-sm"></div>
                <div className="flex-1 bg-primary/40 h-20 rounded-t-sm"></div>
              </div>
              <div className="mt-md flex justify-between border-t border-border-subtle pt-md">
                <div className="text-center">
                  <span className="block font-stat-number !text-[20px] text-on-surface">42mm</span>
                  <span className="font-label-bold text-[10px] text-on-surface-variant">THIS MONTH</span>
                </div>
                <div className="text-center">
                  <span className="block font-stat-number !text-[20px] text-on-surface">+12%</span>
                  <span className="font-label-bold text-[10px] text-status-warning">VS AVERAGE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Equipment Checklist Section */}
          <div className="p-lg bg-primary-container rounded-xl shadow-lg border border-primary/20">
            <div className="flex items-center gap-md mb-md">
              <div className="w-10 h-10 rounded-lg bg-on-primary-container/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary-container">assignment_turned_in</span>
              </div>
              <div>
                <h4 className="font-label-bold text-on-primary-container uppercase">Wet Weather Protocol</h4>
                <p className="text-[10px] text-on-primary-fixed-variant">System-generated checklist</p>
              </div>
            </div>
            <ul className="space-y-sm">
              <li className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-status-success text-sm">check_circle</span>
                <span className="font-body-sm text-on-primary-container">Lock out tall-mast lighting towers</span>
              </li>
              <li className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-status-success text-sm">check_circle</span>
                <span className="font-body-sm text-on-primary-container">Drain site sump pits B1-B4</span>
              </li>
              <li className="flex items-center gap-sm opacity-50">
                <span className="material-symbols-outlined text-sm">radio_button_unchecked</span>
                <span className="font-body-sm text-on-primary-container">Apply anti-slip treatment to gantry</span>
              </li>
            </ul>
            <button className="mt-lg w-full py-md border-2 border-on-primary-container text-on-primary-container font-label-bold rounded-lg hover:bg-on-primary-container hover:text-primary-container transition-all uppercase text-xs">
              Sign Off Protocol
            </button>
          </div>
        </div>
      </div>

      {/* AI Chatbot Floating Prompt */}
      {showPrompt && (
        <div className="fixed bottom-32 right-lg max-w-xs bg-surface-white shadow-2xl rounded-xl border border-border-subtle p-md transform transition-transform hover:-translate-y-1 z-50">
          <div className="flex items-start gap-md">
            <div className="w-8 h-8 rounded-full bg-inverse-surface flex items-center justify-center text-tertiary-container flex-shrink-0">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
            </div>
            <div className="flex-1">
              <p className="font-label-bold text-on-surface text-[11px] mb-xs">CACHET INTELLIGENCE</p>
              <p className="font-body-sm text-on-surface-variant leading-tight">I recommend rescheduling the D11 Dozer maintenance to tomorrow. Heavy rain today will make site access difficult for the service truck.</p>
              <div className="mt-md flex gap-xs">
                <button className="text-[10px] font-label-bold px-sm py-1 bg-primary text-on-primary rounded-full uppercase" onClick={() => setShowPrompt(false)}>Update Schedule</button>
                <button className="text-[10px] font-label-bold px-sm py-1 border border-outline rounded-full uppercase" onClick={() => setShowPrompt(false)}>Dismiss</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Action Button (retained from original) */}
      <button className="fixed bottom-lg left-lg w-14 h-14 rounded-full bg-inverse-surface flex items-center justify-center text-tertiary-container transition-transform hover:scale-110 z-50 shadow-[0_0_15px_rgba(1,232,255,0.4)] border border-[rgba(1,232,255,0.5)]">
        <span className="material-symbols-outlined">smart_toy</span>
      </button>
    </div>
  );
};

export default Weather;
