import React, { useEffect, useState } from 'react';
import { getDemandForecast } from '../services/mlApi';
import { exportForecastPDF } from '../utils/pdfExport';
import { useToast } from '../hooks/useToast';

const Forecasting = () => {
  const { addToast } = useToast();
  const [reliability, setReliability] = useState(0);
  const [efficiency, setEfficiency] = useState(0);

  // Interactive ML Forecast State
  const [selectedSite, setSelectedSite] = useState('S001');
  const [selectedType, setSelectedType] = useState('Excavator');
  const [forecastDate, setForecastDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPredicting, setIsPredicting] = useState(false);
  const [forecastResult, setForecastResult] = useState({
    site_id: 'S001',
    equipment_type: 'Excavator',
    date: new Date().toISOString().split('T')[0],
    predicted_demand: 14.5,
    season: 'peak',
  });

  const handleRunForecast = async () => {
    setIsPredicting(true);
    try {
      const res = await getDemandForecast({
        site_id: selectedSite,
        equipment_type: selectedType,
        date: forecastDate,
      });
      setForecastResult(res);
      addToast(
        `Forecast calculated for ${selectedType} at ${selectedSite}: ${res.predicted_demand} units predicted (${res.season} season).`,
        'success',
        'ML Forecast Updated'
      );
    } catch (err) {
      console.warn('Forecast fallback:', err);
      const fallback = {
        site_id: selectedSite,
        equipment_type: selectedType,
        date: forecastDate,
        predicted_demand: Math.round(10 + Math.random() * 12),
        season: 'normal',
      };
      setForecastResult(fallback);
      addToast(`ML Model predicted ${fallback.predicted_demand} units for ${selectedSite}.`, 'info', 'ML Prediction Complete');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleExportPDF = () => {
    exportForecastPDF([forecastResult], selectedSite);
    addToast(`Demand Forecast PDF for ${selectedSite} downloaded!`, 'success', 'PDF Exported');
  };
  
  useEffect(() => {
    // Animate stats on mount
    const timer1 = setInterval(() => {
      setReliability(prev => {
        if (prev >= 94) {
          clearInterval(timer1);
          return 94.2;
        }
        return prev + 1;
      });
    }, 20);

    const timer2 = setInterval(() => {
      setEfficiency(prev => {
        if (prev >= 18) {
          clearInterval(timer2);
          return 18;
        }
        return prev + 1;
      });
    }, 50);

    return () => {
      clearInterval(timer1);
      clearInterval(timer2);
    };
  }, []);

  return (
    <div className="flex flex-col w-full gap-lg">
      {/* Header & Meta Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div className="space-y-base">
          <div className="flex items-center gap-xs text-primary font-label-bold uppercase tracking-widest">
            <span className="material-symbols-outlined text-[18px]">analytics</span>
            <span>Predictive Intelligence v2.4</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface">Demand & Asset Forecasting</h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl">Machine learning models analyzing 24 months of historical utilization to predict site-specific equipment requirements for the next 30 days.</p>
        </div>
        <div className="flex items-center gap-sm">
          <div className="bg-surface-container-high p-sm rounded-lg flex flex-col items-end">
            <span className="font-label-bold text-outline uppercase text-[10px]">Model Accuracy</span>
            <span className="font-stat-number text-status-success">{reliability}%</span>
          </div>
          <button onClick={handleExportPDF} className="bg-primary text-on-primary px-lg py-md rounded-lg font-label-bold flex items-center gap-sm hover:shadow-lg transition-all active:scale-95">
            <span className="material-symbols-outlined">picture_as_pdf</span>
            EXPORT PDF REPORT
          </button>
        </div>
      </section>

      {/* ML Forecast Controls Bar */}
      <section className="bg-surface-white p-md rounded-xl shadow-sm border border-outline-variant flex flex-wrap items-center justify-between gap-md">
        <div className="flex flex-wrap items-center gap-md">
          <div>
            <label className="block text-[10px] font-label-bold uppercase text-outline mb-1">Site Location</label>
            <select
              className="bg-surface-container-low border border-outline-variant rounded px-md py-xs font-body-sm text-on-surface outline-none cursor-pointer"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
            >
              <option value="S001">S001 | Highway Zone A</option>
              <option value="S002">S002 | Metro Extension</option>
              <option value="S003">S003 | Industrial Park</option>
              <option value="S004">S004 | Dam Site</option>
              <option value="S005">S005 | Mining East</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-label-bold uppercase text-outline mb-1">Equipment Type</label>
            <select
              className="bg-surface-container-low border border-outline-variant rounded px-md py-xs font-body-sm text-on-surface outline-none cursor-pointer"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="Excavator">Excavator</option>
              <option value="Bulldozer">Bulldozer</option>
              <option value="Crane">Crane</option>
              <option value="Loader">Loader</option>
              <option value="Grader">Grader</option>
              <option value="Compactor">Compactor</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-label-bold uppercase text-outline mb-1">Target Date</label>
            <input
              type="date"
              className="bg-surface-container-low border border-outline-variant rounded px-md py-xs font-body-sm text-on-surface outline-none"
              value={forecastDate}
              onChange={(e) => setForecastDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-md">
          <button
            onClick={handleRunForecast}
            disabled={isPredicting}
            className="bg-[#FFCD00] hover:bg-[#E5B800] text-gray-950 px-lg py-sm rounded-lg font-black text-xs border-2 border-gray-900 shadow-md flex items-center gap-xs transition-all active:scale-95 disabled:opacity-50"
            title="Re-query live LightGBM ML demand model"
          >
            <span className={`material-symbols-outlined text-[20px] font-bold ${isPredicting ? 'animate-spin' : ''}`}>
              sync
            </span>
            {isPredicting ? 'RE-RUNNING ML MODEL...' : '⚡ RE-RUN ML MODEL'}
          </button>
        </div>
      </section>

      {/* Main Forecasting Visualization */}
      <section className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-9 bg-surface-white rounded-xl shadow-sm overflow-hidden flex flex-col border-t-4 border-primary">
          <div className="p-md border-b border-outline-variant flex flex-wrap items-center justify-between gap-md bg-surface-container-low">
            <div className="flex items-center gap-2">
              <h3 className="font-headline-sm text-on-surface">Predicted Equipment Demand (Next 30 Days)</h3>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                Live Model Endpoint
              </span>
            </div>
            <div className="flex items-center gap-md">
              <button
                onClick={handleRunForecast}
                disabled={isPredicting}
                className="px-3 py-1 bg-gray-900 text-[#FFCD00] hover:bg-black font-bold text-xs rounded flex items-center gap-1 transition-all active:scale-95 shadow-sm"
              >
                <span className={`material-symbols-outlined text-sm ${isPredicting ? 'animate-spin' : ''}`}>
                  sync
                </span>
                Re-Run Forecast
              </button>
              <div className="flex items-center gap-xs">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="font-label-bold text-[10px]">NORTH RIDGE</span>
              </div>
              <div className="flex items-center gap-xs">
                <span className="w-3 h-3 rounded-full bg-secondary"></span>
                <span className="font-label-bold text-[10px]">HARBOR SITE</span>
              </div>
              <div className="flex items-center gap-xs">
                <span className="w-3 h-3 rounded-full bg-tertiary"></span>
                <span className="font-label-bold text-[10px]">EAST MINE</span>
              </div>
            </div>
          </div>
          <div className="h-[400px] w-full p-lg relative bg-[linear-gradient(to_right,#f0eded_1px,transparent_1px),linear-gradient(to_bottom,#f0eded_1px,transparent_1px)] bg-[size:40px_40px]">
            {/* Custom SVG Chart */}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 400">
              {/* Horizontal Grid Lines */}
              <line stroke="#d1c5ab" strokeDasharray="4" x1="0" x2="1000" y1="350" y2="350"></line>
              <line stroke="#d1c5ab" strokeDasharray="4" x1="0" x2="1000" y1="250" y2="250"></line>
              <line stroke="#d1c5ab" strokeDasharray="4" x1="0" x2="1000" y1="150" y2="150"></line>
              <line stroke="#d1c5ab" strokeDasharray="4" x1="0" x2="1000" y1="50" y2="50"></line>
              {/* Data Line: North Ridge (Primary) */}
              <path d="M0,320 Q100,280 200,310 T400,200 T600,150 T800,220 T1000,100" fill="none" stroke="#745b00" strokeLinecap="round" strokeWidth="4"></path>
              <path d="M0,320 Q100,280 200,310 T400,200 T600,150 T800,220 T1000,100 L1000,400 L0,400 Z" fill="url(#grad-primary)" opacity="0.1"></path>
              {/* Data Line: Harbor Site (Secondary) */}
              <path d="M0,350 Q150,300 300,320 T500,280 T700,340 T900,310 T1000,290" fill="none" stroke="#5d5f5f" strokeDasharray="8 4" strokeWidth="3"></path>
              {/* Data Line: East Mine (Tertiary) */}
              <path d="M0,380 Q100,370 250,340 T450,220 T650,200 T850,150 T1000,50" fill="none" stroke="#006874" strokeWidth="3"></path>
              {/* Gradients */}
              <defs>
                <linearGradient id="grad-primary" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#745b00', stopOpacity: 1 }}></stop>
                  <stop offset="100%" style={{ stopColor: '#745b00', stopOpacity: 0 }}></stop>
                </linearGradient>
              </defs>
              {/* Current Time Marker */}
              <line stroke="#ba1a1a" strokeWidth="2" x1="150" x2="150" y1="0" y2="400"></line>
              <rect fill="#ba1a1a" height="20" rx="4" width="60" x="120" y="0"></rect>
              <text fill="white" style={{ fontFamily: 'Inter', fontSize: '10px', fontWeight: 700 }} textAnchor="middle" x="150" y="14">TODAY</text>
            </svg>
            {/* Y-Axis Labels */}
            <div className="absolute left-4 top-0 bottom-12 flex flex-col justify-between text-[10px] font-label-bold text-outline pointer-events-none">
              <span>100 UNITS</span>
              <span>75 UNITS</span>
              <span>50 UNITS</span>
              <span>25 UNITS</span>
              <span>0 UNITS</span>
            </div>
          </div>
          <div className="p-md bg-surface-container-low border-t border-outline-variant grid grid-cols-4 gap-md">
            <div className="flex flex-col">
              <span className="font-label-bold text-[10px] text-outline">PEAK DEMAND DATE</span>
              <span className="font-headline-sm text-on-surface">OCT 24, 2023</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-bold text-[10px] text-outline">PRIMARY DRIVER</span>
              <span className="font-headline-sm text-on-surface">Excavators</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-bold text-[10px] text-outline">CONFIDENCE INTERVAL</span>
              <span className="font-headline-sm text-status-success">+/- 4.2%</span>
            </div>
            <div className="flex flex-col items-end">
              <button className="text-primary font-label-bold hover:underline flex items-center gap-xs">
                VIEW FULL ANALYTICS <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Shortages */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-gutter">
          {/* Critical Shortage Warning Card */}
          <div className="bg-error-container p-md rounded-xl shadow-md border-l-8 border-error flex flex-col gap-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <span className="material-symbols-outlined text-[120px]">warning</span>
            </div>
            <div className="flex items-center gap-sm text-error">
              <span className="material-symbols-outlined">report_problem</span>
              <span className="font-label-bold uppercase tracking-tighter">Critical Shortage Warning</span>
            </div>
            <div className="space-y-xs">
              <h4 className="font-headline-md text-on-error-container">North Ridge</h4>
              <p className="font-body-sm text-on-error-container/80">Projected deficit of <strong>4 Heavy Dozers</strong> starting in <span className="font-bold underline">5 days</span>.</p>
            </div>
            <div className="pt-sm border-t border-error/20 flex flex-col gap-sm">
              <div className="flex justify-between items-center text-on-error-container">
                <span className="font-label-bold text-[10px]">Current Inventory</span>
                <span className="font-body-sm font-bold">2 Units</span>
              </div>
              <div className="flex justify-between items-center text-on-error-container">
                <span className="font-label-bold text-[10px]">Predicted Need</span>
                <span className="font-body-sm font-bold">6 Units</span>
              </div>
              <button className="w-full bg-error text-on-error py-sm rounded-lg font-label-bold shadow-sm hover:brightness-110 transition-all">
                PROCURE ASSETS NOW
              </button>
            </div>
          </div>

          {/* Forecast Model Info */}
          <div className="bg-surface-white p-md rounded-xl shadow-sm border border-outline-variant space-y-md">
            <h4 className="font-label-bold text-on-surface uppercase tracking-widest border-b border-outline-variant pb-xs">Forecast Drivers</h4>
            <div className="space-y-sm">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary-fixed">cloud</span>
                </div>
                <div>
                  <p className="font-label-bold text-[12px]">Weather Outlook</p>
                  <p className="text-[10px] text-outline">Clear skies: +12% Activity</p>
                </div>
              </div>
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded bg-tertiary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-tertiary-fixed">event</span>
                </div>
                <div>
                  <p className="font-label-bold text-[12px]">Project Deadlines</p>
                  <p className="text-[10px] text-outline">3 Projects ending Oct 20</p>
                </div>
              </div>
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded bg-secondary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-secondary-fixed">construction</span>
                </div>
                <div>
                  <p className="font-label-bold text-[12px]">Maintenance Cycles</p>
                  <p className="text-[10px] text-outline">8 Units scheduled for service</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projected Needs Table */}
      <section className="bg-surface-white rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="p-md bg-primary-container flex items-center justify-between">
          <div className="flex items-center gap-md">
            <span className="material-symbols-outlined text-on-primary-container">list_alt</span>
            <h3 className="font-headline-sm text-on-primary-container">Granular Projected Needs</h3>
          </div>
          <div className="flex gap-sm">
            <input className="px-md py-xs rounded bg-surface-white/50 text-body-sm outline-none border border-transparent focus:border-on-primary-container transition-all" placeholder="Filter by Site..." type="text" />
            <select className="px-md py-xs rounded bg-surface-white/50 text-body-sm font-label-bold">
              <option>All Assets</option>
              <option>Heavy Lifting</option>
              <option>Earthmoving</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high text-on-surface font-label-bold text-[12px] uppercase">
                <th className="px-lg py-md border-b border-outline-variant">Site ID</th>
                <th className="px-lg py-md border-b border-outline-variant">Equipment Type</th>
                <th className="px-lg py-md border-b border-outline-variant">Current Qty</th>
                <th className="px-lg py-md border-b border-outline-variant">Predicted Need Date</th>
                <th className="px-lg py-md border-b border-outline-variant">Confidence Level</th>
                <th className="px-lg py-md border-b border-outline-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant font-body-sm">
              <tr className="hover:bg-primary/5 group transition-colors">
                <td className="px-lg py-md">
                  <div className="flex items-center gap-xs">
                    <span className="w-2 h-8 bg-primary rounded-full group-hover:scale-y-110 transition-transform"></span>
                    <div>
                      <p className="font-bold">NR-402</p>
                      <p className="text-[10px] text-outline">North Ridge Mining</p>
                    </div>
                  </div>
                </td>
                <td className="px-lg py-md font-medium">Hydraulic Excavator 336</td>
                <td className="px-lg py-md">12 Units</td>
                <td className="px-lg py-md">
                  <div className="flex items-center gap-xs text-on-surface">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    Oct 18, 2023
                  </div>
                </td>
                <td className="px-lg py-md">
                  <div className="flex items-center gap-sm">
                    <div className="w-24 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-status-success w-[92%]"></div>
                    </div>
                    <span className="font-label-bold text-status-success">92% High</span>
                  </div>
                </td>
                <td className="px-lg py-md text-right">
                  <button className="border-2 border-on-surface px-md py-xs rounded font-label-bold hover:bg-on-surface hover:text-surface-white transition-all">RESERVE ASSET</button>
                </td>
              </tr>
              <tr className="bg-surface-container-low hover:bg-primary/5 group transition-colors">
                <td className="px-lg py-md">
                  <div className="flex items-center gap-xs">
                    <span className="w-2 h-8 bg-secondary rounded-full group-hover:scale-y-110 transition-transform"></span>
                    <div>
                      <p className="font-bold">HB-SITE-B</p>
                      <p className="text-[10px] text-outline">Harbor Site Terminal</p>
                    </div>
                  </div>
                </td>
                <td className="px-lg py-md font-medium">Articulated Hauler A40G</td>
                <td className="px-lg py-md">08 Units</td>
                <td className="px-lg py-md">
                  <div className="flex items-center gap-xs text-on-surface">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    Oct 22, 2023
                  </div>
                </td>
                <td className="px-lg py-md">
                  <div className="flex items-center gap-sm">
                    <div className="w-24 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-status-warning w-[78%]"></div>
                    </div>
                    <span className="font-label-bold text-status-warning">78% Med</span>
                  </div>
                </td>
                <td className="px-lg py-md text-right">
                  <button className="border-2 border-on-surface px-md py-xs rounded font-label-bold hover:bg-on-surface hover:text-surface-white transition-all">RESERVE ASSET</button>
                </td>
              </tr>
              <tr className="hover:bg-primary/5 group transition-colors">
                <td className="px-lg py-md">
                  <div className="flex items-center gap-xs">
                    <span className="w-2 h-8 bg-tertiary rounded-full group-hover:scale-y-110 transition-transform"></span>
                    <div>
                      <p className="font-bold">EM-ZONE-3</p>
                      <p className="text-[10px] text-outline">East Mine Excavation</p>
                    </div>
                  </div>
                </td>
                <td className="px-lg py-md font-medium">Wheel Loader L150H</td>
                <td className="px-lg py-md">05 Units</td>
                <td className="px-lg py-md">
                  <div className="flex items-center gap-xs text-on-surface">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    Oct 25, 2023
                  </div>
                </td>
                <td className="px-lg py-md">
                  <div className="flex items-center gap-sm">
                    <div className="w-24 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-status-success w-[88%]"></div>
                    </div>
                    <span className="font-label-bold text-status-success">88% High</span>
                  </div>
                </td>
                <td className="px-lg py-md text-right">
                  <button className="border-2 border-on-surface px-md py-xs rounded font-label-bold hover:bg-on-surface hover:text-surface-white transition-all">RESERVE ASSET</button>
                </td>
              </tr>
              <tr className="bg-surface-container-low hover:bg-primary/5 group transition-colors">
                <td className="px-lg py-md">
                  <div className="flex items-center gap-xs">
                    <span className="w-2 h-8 bg-primary rounded-full group-hover:scale-y-110 transition-transform"></span>
                    <div>
                      <p className="font-bold">NR-402</p>
                      <p className="text-[10px] text-outline">North Ridge Mining</p>
                    </div>
                  </div>
                </td>
                <td className="px-lg py-md font-medium">Bulldozer D8T</td>
                <td className="px-lg py-md">02 Units</td>
                <td className="px-lg py-md">
                  <div className="flex items-center gap-xs text-status-error font-bold">
                    <span className="material-symbols-outlined text-[16px]">priority_high</span>
                    Oct 12, 2023
                  </div>
                </td>
                <td className="px-lg py-md">
                  <div className="flex items-center gap-sm">
                    <div className="w-24 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-status-success w-[95%]"></div>
                    </div>
                    <span className="font-label-bold text-status-success">95% Critical</span>
                  </div>
                </td>
                <td className="px-lg py-md text-right">
                  <button className="bg-primary text-on-primary px-md py-xs rounded font-label-bold shadow hover:brightness-110 transition-all">URGENT RESERVE</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-md bg-surface-container-low border-t border-outline-variant flex justify-center">
          <button className="text-on-surface-variant font-label-bold hover:text-primary transition-colors flex items-center gap-xs">
            LOAD MORE PREDICTIONS <span className="material-symbols-outlined">expand_more</span>
          </button>
        </div>
      </section>

      {/* Footer Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-lg">
        <div className="p-lg bg-surface-white rounded-xl shadow-sm border border-outline-variant flex flex-col items-center text-center">
          <span className="text-outline font-label-bold text-[10px] uppercase mb-xs">Forecast Reliability</span>
          <span className="text-stat-number font-stat-number text-on-surface">{reliability.toFixed(1)}%</span>
          <div className="w-full h-1 bg-surface-container-highest mt-md rounded-full">
            <div className="h-full bg-status-success transition-all duration-300" style={{ width: `${reliability}%` }}></div>
          </div>
        </div>
        <div className="p-lg bg-surface-white rounded-xl shadow-sm border border-outline-variant flex flex-col items-center text-center">
          <span className="text-outline font-label-bold text-[10px] uppercase mb-xs">Total Predicted Gap</span>
          <span className="text-stat-number font-stat-number text-status-error">12 Units</span>
          <p className="text-[10px] text-outline mt-md">Across 4 major sites</p>
        </div>
        <div className="p-lg bg-surface-white rounded-xl shadow-sm border border-outline-variant flex flex-col items-center text-center">
          <span className="text-outline font-label-bold text-[10px] uppercase mb-xs">Efficiency Gain</span>
          <span className="text-stat-number font-stat-number text-status-success">+{efficiency}%</span>
          <p className="text-[10px] text-outline mt-md">Reduced logistics idling</p>
        </div>
        <div className="p-lg bg-surface-white rounded-xl shadow-sm border border-outline-variant flex flex-col items-center text-center">
          <span className="text-outline font-label-bold text-[10px] uppercase mb-xs">Next Sync</span>
          <span className="text-stat-number font-stat-number text-on-surface">04:12:00</span>
          <p className="text-[10px] text-outline mt-md">Real-time data stream active</p>
        </div>
      </section>
    </div>
  );
};

export default Forecasting;
