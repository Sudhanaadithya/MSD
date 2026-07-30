import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Leaderboard = () => {
  const [barWidth, setBarWidth] = useState('0%');

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => {
      setBarWidth('86%');
    }, 300);
  }, []);

  return (
    <div className="flex flex-col w-full gap-lg">
      {/* Header Section */}
      <div className="relative flex flex-col md:flex-row justify-between items-end gap-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-xs mb-base">
            <div className="w-12 h-1 bg-primary"></div>
            <span className="font-label-bold text-label-bold text-primary uppercase tracking-[0.2em]">Live Ranking</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface uppercase italic leading-none">
            Operator Performance <br /> <span className="text-primary">Leaderboard</span>
          </h1>
        </div>
        <div className="flex items-center gap-md bg-surface-container-high p-md rounded-xl shadow-sm border-l-4 border-primary">
          <div className="flex flex-col">
            <span className="font-label-bold text-[10px] text-outline-variant uppercase">Period</span>
            <span className="font-headline-sm text-headline-sm">Last 30 Days</span>
          </div>
          <span className="material-symbols-outlined text-primary text-3xl">calendar_today</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-lg items-start">
        {/* Main Leaderboard Area */}
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-xl">
          {/* Top 3 Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            {/* Second Place */}
            <div className="order-2 md:order-1 bg-surface-white rounded-xl shadow-md overflow-hidden flex flex-col border-t-4 border-secondary-fixed-dim mt-lg">
              <div className="relative h-48">
                <img className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQmph2JIQx8kveNAczxOASsbnYMvMNzZ9LNUjtSce6fuT5savRlPn5WOSGv0B7vEfGc8T6aNy0h1_7yeE41d4PhzPVAQOby-5GgdIfoO_mEM-83cb5AU273T8p8kL8A5ip1m5oMYSrOht32nJx6y72dE3bTrqBB0hSSzIiUi_1OJn4dsXNNfra43Og6nlcgjaR7Q21XjBmg8xmHdkeyjxR5BV69Sat5D0klv6Jn_hjrCW0rBLtMsLh" alt="Operator 2" />
                <div className="absolute top-0 right-0 bg-secondary-fixed-dim text-on-surface font-display-lg px-md py-xs italic">02</div>
              </div>
              <div className="p-md bg-surface-container-low flex-1 flex flex-col">
                <h3 className="font-headline-md text-headline-md uppercase truncate">Sarah Jenkins</h3>
                <div className="mt-auto flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="font-label-bold text-[10px] text-outline uppercase">Efficiency</span>
                    <span className="font-stat-number text-stat-number">94.2<span className="text-headline-sm">%</span></span>
                  </div>
                  <span className="material-symbols-outlined text-status-success mb-xs">trending_up</span>
                </div>
              </div>
            </div>

            {/* First Place */}
            <div className="order-1 md:order-2 bg-surface-white rounded-xl shadow-xl overflow-hidden flex flex-col border-t-8 border-primary transform md:-translate-y-6 scale-105 z-10">
              <div className="relative h-64">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0KyGOqbjmyeR7TTCLtShoRBI1j_CUrPbsfagawkcQ9v_ZnWLkJck-DbCdyglRysHDqw9FpKBHXA64P-Zi99GrS5kGdY4rM4a3ZC5LeKC_8yN5Q5cB5SqYwVjJi8hr9w4OtSMGv3uI9anrmdEeE4tBiwW2oq9TZ-ceMiDIAkDn_bMHCj6g5spH7urHmSCV2D1oPDrAhZhotglMHz1l-rMHwC9xJnvrJukaefhLA8WkzoHBy3VWd8R-" alt="Operator 1" />
                <div className="absolute top-0 right-0 bg-primary text-on-primary font-display-lg px-xl py-sm italic shadow-lg">01</div>
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-md">
                  <span className="font-label-bold text-primary-fixed uppercase tracking-widest">Master Operator</span>
                </div>
              </div>
              <div className="p-lg bg-surface-white flex-1 flex flex-col">
                <h3 className="font-display-lg text-headline-lg uppercase tracking-tight">Marcus V.</h3>
                <div className="mt-auto flex justify-between items-center bg-primary-container p-sm rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-label-bold text-on-primary-container text-[10px] uppercase">Efficiency Score</span>
                    <span className="font-stat-number text-stat-number text-on-primary-container">98.8<span className="text-headline-sm">%</span></span>
                  </div>
                  <div className="bg-on-primary-container p-xs rounded-full">
                    <span className="material-symbols-outlined text-primary-container text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Third Place */}
            <div className="order-3 bg-surface-white rounded-xl shadow-md overflow-hidden flex flex-col border-t-4 border-[#CD7F32] mt-lg">
              <div className="relative h-48">
                <img className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxFydw9v6B9vN7CwoiichPAQPPXsCCDv-klwe1uwy10kkULqU9qqFztaq6UdO2IywSxrLuwAxvHA8PX7pxiJc3rP1Cxk0tMfnXO2szyEcD6E6OF9hM0ZHQ5WqeFk7x2vl0QsFG-WEsyBEGgJC_GLYFokpj3CnZ8Vb9SzqKqRGIzQSX2qXbSBVNrz3q_pBWbgXDbRW73pK9NAZjbKqWbffpOoLMYbtjoqkxS8TEIzOW81OddApjpuCj" alt="Operator 3" />
                <div className="absolute top-0 right-0 bg-tertiary-fixed-dim text-on-tertiary-fixed font-display-lg px-md py-xs italic">03</div>
              </div>
              <div className="p-md bg-surface-container-low flex-1 flex flex-col">
                <h3 className="font-headline-md text-headline-md uppercase truncate">David Chen</h3>
                <div className="mt-auto flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="font-label-bold text-[10px] text-outline uppercase">Efficiency</span>
                    <span className="font-stat-number text-stat-number">91.5<span className="text-headline-sm">%</span></span>
                  </div>
                  <span className="material-symbols-outlined text-status-warning mb-xs">trending_flat</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fleet Performance Table */}
          <div className="bg-surface-white rounded-xl shadow-sm border border-outline-variant overflow-hidden">
            <div className="bg-primary px-lg py-md flex justify-between items-center">
              <h2 className="font-headline-sm text-on-primary uppercase tracking-tight">Fleet Performance Table</h2>
              <span className="font-label-bold text-on-primary-fixed-variant text-[10px] uppercase">Data Refreshed 2m ago</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container text-on-surface-variant font-label-bold text-[11px] uppercase tracking-widest border-b border-outline-variant">
                    <th className="px-lg py-md">Rank</th>
                    <th className="px-lg py-md">Operator Name</th>
                    <th className="px-lg py-md">Efficiency</th>
                    <th className="px-lg py-md">Total Assets</th>
                    <th className="px-lg py-md text-center">Safety Incidents</th>
                    <th className="px-lg py-md text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 font-body-sm">
                  <tr className="group hover:bg-surface-container-low transition-all hover:translate-x-1">
                    <td className="px-lg py-md font-label-bold text-on-surface-variant">#04</td>
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-8 h-8 rounded bg-surface-container-highest"></div>
                        <span className="font-headline-sm text-body-md">Elena Rodriguez</span>
                      </div>
                    </td>
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-xs">
                        <span className="font-label-bold">89.2%</span>
                        <span className="material-symbols-outlined text-status-success text-sm">arrow_upward</span>
                      </div>
                    </td>
                    <td className="px-lg py-md font-mono">14 Units</td>
                    <td className="px-lg py-md text-center">
                      <span className="px-sm py-1 bg-status-success/15 text-status-success rounded-full font-label-bold">0</span>
                    </td>
                    <td className="px-lg py-md text-right">
                      <span className="w-2 h-2 rounded-full bg-status-success inline-block"></span>
                    </td>
                  </tr>
                  <tr className="group bg-surface-container-low/30 hover:bg-surface-container-low transition-all hover:translate-x-1">
                    <td className="px-lg py-md font-label-bold text-on-surface-variant">#05</td>
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-8 h-8 rounded bg-surface-container-highest"></div>
                        <span className="font-headline-sm text-body-md">Thomas Wright</span>
                      </div>
                    </td>
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-xs">
                        <span className="font-label-bold">87.5%</span>
                        <span className="material-symbols-outlined text-status-error text-sm">arrow_downward</span>
                      </div>
                    </td>
                    <td className="px-lg py-md font-mono">11 Units</td>
                    <td className="px-lg py-md text-center">
                      <span className="px-sm py-1 bg-status-error/15 text-status-error rounded-full font-label-bold">1</span>
                    </td>
                    <td className="px-lg py-md text-right">
                      <span className="w-2 h-2 rounded-full bg-status-warning inline-block"></span>
                    </td>
                  </tr>
                  {/* Unassigned Row */}
                  <tr className="bg-error-container/10 border-l-4 border-status-error group transition-all hover:translate-x-1">
                    <td className="px-lg py-md font-label-bold text-status-error">FLAG</td>
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-8 h-8 rounded bg-status-error/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-status-error text-sm">no_accounts</span>
                        </div>
                        <span className="font-label-bold text-status-error uppercase">Unassigned / Unknown</span>
                      </div>
                    </td>
                    <td className="px-lg py-md text-status-error font-mono">N/A</td>
                    <td className="px-lg py-md text-status-error font-mono">03 Units</td>
                    <td className="px-lg py-md text-center">
                      <span className="px-sm py-1 bg-status-error text-on-error rounded-full font-label-bold animate-pulse">CRITICAL</span>
                    </td>
                    <td className="px-lg py-md text-right">
                      <button className="bg-status-error text-on-error px-md py-1 rounded text-[10px] font-label-bold hover:brightness-110 uppercase">Resolve</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-lg">
          {/* Fleet Avg Card */}
          <div className="bg-inverse-surface text-inverse-on-surface p-lg rounded-xl shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <span className="font-label-bold text-[10px] uppercase tracking-widest text-primary">System Health</span>
              <h4 className="font-headline-sm mt-xs">Fleet Avg Efficiency</h4>
              <div className="mt-lg flex items-baseline gap-xs">
                <span className="font-stat-number text-[56px] leading-none">86</span>
                <span className="font-headline-md text-primary">%</span>
              </div>
              <div className="mt-md w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full transition-all duration-1000 ease-out" style={{ width: barWidth }}></div>
              </div>
              <p className="mt-md text-body-sm text-inverse-on-surface/60">
                ↑ 2.4% from previous month. Maintaining steady performance across 42 active assets.
              </p>
            </div>
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
          </div>

          {/* Award Card */}
          <div className="bg-primary p-lg rounded-xl shadow-md border-t-8 border-on-primary">
            <span className="font-label-bold text-on-primary uppercase text-[10px] tracking-widest">Recognition</span>
            <h4 className="font-headline-sm text-on-primary mt-xs">Safety Award</h4>
            <div className="mt-lg flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full border-4 border-on-primary overflow-hidden mb-md shadow-lg">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6E3DFsiYN4h-k8KHKaS0B0Z7hca0K6lRzLbzXgi-MGlOodVm4PDM1-qupPD1mjYRcGloHBijZB-ett2hE4xsUcCqeC7h3iSjrzeMqDM8fWUvGXG0xlepIwFCRbz1f43wiUxKkk2bIHy-M3K8-jjBsd3hK0lSTKTqMcNXE63-rfituFv25T-wkhnXTjE3FNDtSgXqN1gY90xTcmrhrDp35uF18amuBSQMHLANVqHCUBUiBijzxlxpw" alt="Award Winner" />
              </div>
              <span className="font-headline-md text-on-primary uppercase">Marcus V.</span>
              <span className="font-label-bold text-on-primary-fixed-variant mt-xs">0 INCIDENTS • 420 HRS</span>
              <button className="mt-lg w-full bg-on-primary text-primary py-sm rounded font-label-bold uppercase hover:bg-surface-bright transition-colors">View Profile</button>
            </div>
          </div>

          {/* Trends Visualization */}
          <div className="bg-surface-white p-lg rounded-xl border border-outline-variant">
            <h4 className="font-label-bold text-on-surface-variant uppercase text-[10px] mb-lg">Efficiency Trend</h4>
            <div className="h-24 flex items-end gap-1">
              <div className="flex-1 bg-surface-container h-[60%] rounded-t-sm"></div>
              <div className="flex-1 bg-surface-container h-[65%] rounded-t-sm"></div>
              <div className="flex-1 bg-primary h-[80%] rounded-t-sm"></div>
              <div className="flex-1 bg-surface-container h-[70%] rounded-t-sm"></div>
              <div className="flex-1 bg-primary h-[85%] rounded-t-sm"></div>
              <div className="flex-1 bg-primary-container h-[95%] rounded-t-sm"></div>
              <div className="flex-1 bg-primary h-[90%] rounded-t-sm"></div>
            </div>
            <div className="flex justify-between mt-sm text-[10px] font-label-bold text-outline">
              <span>MON</span>
              <span>SUN</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
