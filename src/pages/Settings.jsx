import React, { useState } from 'react';

const Settings = () => {
  const [personality, setPersonality] = useState(2);
  const [predictiveAlerts, setPredictiveAlerts] = useState(false);
  const [smartConcierge, setSmartConcierge] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);

  const getPersonalityLabel = (val) => {
    if (val === 1) return 'Concise';
    if (val === 2) return 'Operational';
    return 'Proactive';
  };

  const handleDeploy = () => {
    if (isDeploying || deploySuccess) return;
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      setDeploySuccess(true);
      setTimeout(() => {
        setDeploySuccess(false);
      }, 2000);
    }, 1500);
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-80px)] relative">
      {/* Header Section with Industrial Texture */}
      <div className="relative overflow-hidden bg-surface-container px-lg py-xl -mt-lg -mx-lg w-[calc(100%+64px)]">
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
          <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="100%">
            <defs>
              <pattern height="10" id="grid" patternUnits="userSpaceOnUse" width="10">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"></path>
              </pattern>
            </defs>
            <rect fill="url(#grid)" height="100%" width="100%"></rect>
          </svg>
        </div>
        <div className="relative z-10">
          <span className="font-label-bold text-primary uppercase tracking-widest">System Configuration</span>
          <h1 className="font-display-lg text-on-surface mt-xs">Fleet Command Center</h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl mt-sm">
            Configure operational parameters, manage site boundaries, and fine-tune the Cachet AI engine to align with your fleet's specific mission requirements.
          </p>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-12 gap-gutter py-lg flex-1">
        {/* Left Column: Navigation & Profile */}
        <div className="col-span-12 lg:col-span-4 space-y-gutter">
          {/* Profile Management Card */}
          <div className="bg-surface-white rounded-xl shadow-sm overflow-hidden group transition-all hover:shadow-md">
            <div className="h-1 bg-primary-container w-full"></div>
            <div className="p-md">
              <div className="flex items-center gap-md mb-lg">
                <div className="relative">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-container">
                    <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAxr8uDUZRU6LIEhWhUDRavj126t5-ATZ_9fwNZcfGNsn48NfSkE74s3Bo_CZD2MsK25n1bjeYbA4KhilrJRJ4TG0l_HsGK_HMzYbSsSXIZYJJgRXZ6pGadHzW8b6OwZprYEpRvlC8uYb1tUTJCoiiGaTB5ZPPo3NfzqQwqHX-1i9WDkKn4iMXpXknOV5wDwJ0UPT_5rek5IS5_tH2CAHs7x1f_cOwiTva1LnxKsP6IZXb3f_klgMp" alt="James Dalton" />
                  </div>
                  <button className="absolute -bottom-2 -right-2 bg-inverse-surface text-tertiary-container p-2 rounded-lg shadow-lg hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                  </button>
                </div>
                <div>
                  <h3 className="font-headline-sm text-on-surface">James Dalton</h3>
                  <p className="font-body-sm text-on-surface-variant">Fleet Operations Director</p>
                  <span className="inline-block mt-xs px-2 py-0.5 bg-status-success/15 text-status-success rounded font-label-bold text-[10px] uppercase">Admin Access</span>
                </div>
              </div>

              <div className="space-y-md">
                <div className="space-y-xs">
                  <label className="font-label-bold text-on-surface-variant">Email Address</label>
                  <input className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary-container rounded-lg px-md py-sm font-body-md transition-all outline-none" type="email" defaultValue="j.dalton@cachet-fleet.io" />
                </div>
                <div className="space-y-xs">
                  <label className="font-label-bold text-on-surface-variant">Timezone</label>
                  <select className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary-container rounded-lg px-md py-sm font-body-md transition-all outline-none appearance-none">
                    <option>Central Standard Time (GMT-6)</option>
                    <option>Eastern Standard Time (GMT-5)</option>
                    <option>Pacific Standard Time (GMT-8)</option>
                  </select>
                </div>
              </div>
              
              <button className="mt-lg w-full py-md bg-primary-container text-on-primary-container font-label-bold rounded-lg hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-sm">
                <span className="material-symbols-outlined">save</span>
                SAVE PROFILE
              </button>
            </div>
          </div>

          {/* Cachet AI Settings */}
          <div className="bg-inverse-surface text-surface-white rounded-xl shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-md opacity-20">
              <span className="material-symbols-outlined text-6xl">auto_awesome</span>
            </div>
            <div className="p-md relative z-10">
              <div className="flex items-center gap-sm mb-md">
                <span className="material-symbols-outlined text-tertiary-container">psychology</span>
                <h3 className="font-headline-sm">Cachet AI Engine</h3>
              </div>
              <div className="space-y-lg">
                <div className="space-y-sm">
                  <div className="flex justify-between items-end">
                    <label className="font-label-bold text-tertiary-fixed">Personality Matrix</label>
                    <span className="font-body-sm text-tertiary-container">{getPersonalityLabel(personality)}</span>
                  </div>
                  <input
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary-container"
                    max="3"
                    min="1"
                    type="range"
                    value={personality}
                    onChange={(e) => setPersonality(parseInt(e.target.value))}
                  />
                  <div className="flex justify-between text-[10px] font-label-bold text-secondary-fixed-dim uppercase">
                    <span>Concise</span>
                    <span>Proactive</span>
                  </div>
                </div>

                <div className="space-y-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-body-md font-bold">Predictive Alerts</p>
                      <p className="font-body-sm text-secondary-fixed-dim">AI forecasts maintenance issues</p>
                    </div>
                    <button
                      className={`w-12 h-6 rounded-full p-1 transition-colors relative ${predictiveAlerts ? 'bg-primary-container' : 'bg-secondary'}`}
                      onClick={() => setPredictiveAlerts(!predictiveAlerts)}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${predictiveAlerts ? 'translate-x-6' : ''}`}></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-body-md font-bold">Smart Concierge</p>
                      <p className="font-body-sm text-secondary-fixed-dim">Voice-enabled terminal access</p>
                    </div>
                    <button
                      className={`w-12 h-6 rounded-full p-1 transition-colors relative ${smartConcierge ? 'bg-primary-container' : 'bg-secondary'}`}
                      onClick={() => setSmartConcierge(!smartConcierge)}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${smartConcierge ? 'translate-x-6' : ''}`}></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Site Mgmt & Notifications */}
        <div className="col-span-12 lg:col-span-8 space-y-gutter flex flex-col">
          {/* Site Management Section */}
          <div className="bg-surface-white rounded-xl shadow-sm overflow-hidden">
            <div className="h-1 bg-primary-container w-full"></div>
            <div className="p-md flex items-center justify-between border-b border-surface-variant">
              <div>
                <h3 className="font-headline-sm text-on-surface">Site Management</h3>
                <p className="font-body-sm text-on-surface-variant">Active geofences and operational zones</p>
              </div>
              <button className="px-md py-sm border-2 border-on-surface font-label-bold rounded-lg hover:bg-surface-container transition-colors flex items-center gap-xs">
                <span className="material-symbols-outlined">add_location</span>
                ADD NEW SITE
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-surface-variant">
              {/* Site 1 */}
              <div className="bg-surface-white p-md group hover:bg-surface-container-low transition-colors">
                <div className="w-full h-32 rounded-lg bg-surface-container mb-md relative overflow-hidden bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1541888086925-9c6e090a1760?q=80&w=2672&auto=format&fit=crop')"}}>
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-white px-md py-xs rounded-full font-label-bold text-on-surface text-xs shadow-lg">VIEW MAP</span>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-label-bold text-on-surface">PHX-MAIN-01</p>
                    <p className="font-body-sm text-on-surface-variant">240 Assets Active</p>
                  </div>
                  <span className="material-symbols-outlined text-outline cursor-pointer hover:text-on-surface">more_vert</span>
                </div>
              </div>
              {/* Site 2 */}
              <div className="bg-surface-white p-md group hover:bg-surface-container-low transition-colors">
                <div className="w-full h-32 rounded-lg bg-surface-container mb-md relative overflow-hidden bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1579975096649-e773152b04cb?q=80&w=2574&auto=format&fit=crop')"}}>
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-white px-md py-xs rounded-full font-label-bold text-on-surface text-xs shadow-lg">VIEW MAP</span>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-label-bold text-on-surface">DEN-MINE-EX</p>
                    <p className="font-body-sm text-on-surface-variant">12 Heavy Units</p>
                  </div>
                  <span className="material-symbols-outlined text-outline cursor-pointer hover:text-on-surface">more_vert</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Matrix */}
          <div className="bg-surface-white rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="h-1 bg-primary-container w-full"></div>
            <div className="p-md flex-1 flex flex-col">
              <h3 className="font-headline-sm text-on-surface mb-lg">Alert Preferences</h3>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-primary-container text-on-primary-container font-label-bold">
                      <th className="px-md py-sm first:rounded-tl-lg">Event Type</th>
                      <th className="px-md py-sm text-center">SMS</th>
                      <th className="px-md py-sm text-center">Email</th>
                      <th className="px-md py-sm text-center last:rounded-tr-lg">Push</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md">
                    <tr className="border-b border-surface-variant hover:bg-surface-container-lowest transition-colors">
                      <td className="px-md py-md">
                        <span className="font-bold">Critical Engine Fault</span>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Instant Response Required</p>
                      </td>
                      <td className="px-md py-md text-center"><input defaultChecked className="w-5 h-5 accent-primary cursor-pointer" type="checkbox" /></td>
                      <td className="px-md py-md text-center"><input defaultChecked className="w-5 h-5 accent-primary cursor-pointer" type="checkbox" /></td>
                      <td className="px-md py-md text-center"><input defaultChecked className="w-5 h-5 accent-primary cursor-pointer" type="checkbox" /></td>
                    </tr>
                    <tr className="border-b border-surface-variant bg-surface-container-low hover:bg-surface-container transition-colors">
                      <td className="px-md py-md">
                        <span className="font-bold">Geofence Breach</span>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Asset movement alerts</p>
                      </td>
                      <td className="px-md py-md text-center"><input className="w-5 h-5 accent-primary cursor-pointer" type="checkbox" /></td>
                      <td className="px-md py-md text-center"><input defaultChecked className="w-5 h-5 accent-primary cursor-pointer" type="checkbox" /></td>
                      <td className="px-md py-md text-center"><input defaultChecked className="w-5 h-5 accent-primary cursor-pointer" type="checkbox" /></td>
                    </tr>
                    <tr className="border-b border-surface-variant hover:bg-surface-container-lowest transition-colors">
                      <td className="px-md py-md">
                        <span className="font-bold">Weekly Fleet Summary</span>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Monday 08:00 AM CST</p>
                      </td>
                      <td className="px-md py-md text-center"><input className="w-5 h-5 accent-primary cursor-pointer" type="checkbox" /></td>
                      <td className="px-md py-md text-center"><input defaultChecked className="w-5 h-5 accent-primary cursor-pointer" type="checkbox" /></td>
                      <td className="px-md py-md text-center"><input className="w-5 h-5 accent-primary cursor-pointer" type="checkbox" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* API & Integrations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter mt-auto pb-24 md:pb-0">
            <div className="bg-surface-white p-md rounded-xl shadow-sm flex items-center gap-md border-l-4 border-primary">
              <div className="bg-surface-container p-sm rounded-lg">
                <span className="material-symbols-outlined text-on-surface">api</span>
              </div>
              <div className="flex-1">
                <p className="font-label-bold text-on-surface">API Access Key</p>
                <p className="font-body-sm text-on-surface-variant truncate">ch_live_49f92...2k81</p>
              </div>
              <button className="material-symbols-outlined text-outline hover:text-on-surface">content_copy</button>
            </div>
            <div className="bg-surface-white p-md rounded-xl shadow-sm flex items-center gap-md hover:bg-surface-container-low transition-colors cursor-pointer">
              <div className="bg-[#0061FF]/10 p-sm rounded-lg">
                <span className="material-symbols-outlined text-[#0061FF]">cloud_sync</span>
              </div>
              <div className="flex-1">
                <p className="font-label-bold text-on-surface">ERP Integration</p>
                <p className="font-body-sm text-status-success flex items-center gap-1">
                  <span className="w-2 h-2 bg-status-success rounded-full animate-pulse"></span>
                  Connected
                </p>
              </div>
              <span className="material-symbols-outlined text-outline">chevron_right</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed md:absolute bottom-0 left-0 md:left-auto md:-bottom-lg w-full bg-surface-white border-t border-surface-variant px-lg py-md flex items-center justify-between z-30 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] -mx-lg w-[calc(100%+64px)]">
        <div className="hidden md:block">
          <p className="font-body-sm text-on-surface-variant">Last synchronized: 2 mins ago</p>
        </div>
        <div className="flex items-center gap-md w-full md:w-auto">
          <button className="flex-1 md:flex-none px-xl py-md border-2 border-on-surface text-on-surface font-label-bold rounded-lg hover:bg-surface-container transition-all">
            DISCARD CHANGES
          </button>
          <button 
            className={`flex-1 md:flex-none px-xl py-md font-label-bold rounded-lg transition-all shadow-lg ${
              deploySuccess 
                ? 'bg-status-success text-white' 
                : isDeploying 
                  ? 'bg-primary-container text-on-primary-container opacity-80' 
                  : 'bg-primary-container text-on-primary-container hover:translate-y-[-2px] active:translate-y-0'
            }`}
            onClick={handleDeploy}
          >
            {deploySuccess ? 'SUCCESSFULLY DEPLOYED' : isDeploying ? 'DEPLOYING...' : 'DEPLOY CONFIGURATION'}
          </button>
        </div>
      </div>
      
      {/* Floating AI Action Button */}
      <button className="fixed bottom-32 md:bottom-lg left-lg w-14 h-14 rounded-full bg-inverse-surface flex items-center justify-center text-tertiary-container transition-transform hover:scale-110 z-50 shadow-[0_0_15px_rgba(1,232,255,0.4)] border border-[rgba(1,232,255,0.5)]">
        <span className="material-symbols-outlined">smart_toy</span>
      </button>
    </div>
  );
};

export default Settings;
