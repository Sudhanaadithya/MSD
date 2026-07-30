import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const EquipmentDetail = () => {
  const { assetId } = useParams();
  const [asset, setAsset] = useState({
    id: assetId || 'EX-402',
    name: 'Caterpillar 336 Hydraulic Excavator',
    type: 'Heavy Asset',
    status: 'Active',
    location: 'Sector 7A - Mining',
    operator: 'Marcus V.',
    engineHours: 1240,
    idleHours: 120,
    fuelLevel: 85,
    nextService: 150
  });

  useEffect(() => {
    // fetch(`http://localhost:8000/api/fleet/assets/${assetId}`)
    //   .then(res => res.json())
    //   .then(data => setAsset(data));
  }, [assetId]);

  return (
    <div className="flex flex-col w-full gap-lg">
      {/* Asset Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
        <div className="flex flex-col gap-xs">
          <div className="flex items-center gap-sm">
            <span className="font-label-bold text-label-bold px-sm py-1 bg-primary text-on-primary-fixed rounded-full uppercase tracking-widest">{asset.type}</span>
            <span className="text-outline font-label-bold">•</span>
            <span className="text-outline font-label-bold uppercase">Serial: 99203-XJ</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface flex items-center gap-md">
            {asset.id}
            <span className={`font-headline-sm text-headline-sm px-md py-1 bg-status-success/15 text-status-success rounded-full border border-status-success/20 flex items-center gap-xs`}>
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>fiber_manual_record</span>
              {asset.status}
            </span>
          </h1>
          <p className="font-headline-md text-headline-md text-secondary">{asset.name}</p>
        </div>
        <div className="flex gap-sm">
          <button className="flex items-center gap-xs px-lg py-sm bg-surface-white border-2 border-on-surface font-label-bold text-on-surface hover:bg-surface-container transition-all rounded-lg">
            <span className="material-symbols-outlined">edit</span>
            EDIT ASSET
          </button>
          <button className="flex items-center gap-xs px-xl py-sm bg-primary text-on-primary-fixed font-label-bold hover:shadow-lg transition-all rounded-lg">
            <span className="material-symbols-outlined">bolt</span>
            INITIATE SERVICE
          </button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
        {/* Stat Card 1 */}
        <div className="bg-surface-white rounded-xl shadow-sm overflow-hidden relative group">
          <div className="h-1 w-full bg-primary absolute top-0 left-0"></div>
          <div className="p-lg flex flex-col gap-xs">
            <span className="text-outline font-label-bold uppercase tracking-tighter">Engine Hours</span>
            <div className="flex items-end gap-xs">
              <span className="font-stat-number text-stat-number text-on-surface">{(asset.engineHours || 1240).toLocaleString()}</span>
              <span className="text-secondary font-label-bold mb-2">HRS</span>
            </div>
            <div className="mt-md w-full bg-surface-container rounded-full h-1">
              <div className="bg-primary h-1 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <p className="text-[10px] text-outline font-bold mt-1">+12.4% FROM LAST MONTH</p>
          </div>
        </div>
        {/* Stat Card 2 */}
        <div className="bg-surface-white rounded-xl shadow-sm overflow-hidden relative group">
          <div className="h-1 w-full bg-primary absolute top-0 left-0"></div>
          <div className="p-lg flex flex-col gap-xs">
            <span className="text-outline font-label-bold uppercase tracking-tighter">Fuel Level</span>
            <div className="flex items-end gap-xs">
              <span className="font-stat-number text-stat-number text-on-surface">{asset.fuelLevel || 85}</span>
              <span className="text-secondary font-label-bold mb-2">%</span>
            </div>
            <div className="mt-md w-full bg-surface-container rounded-full h-1.5 overflow-hidden flex">
              <div className="bg-status-success h-full" style={{ width: `${asset.fuelLevel || 85}%` }}></div>
            </div>
            <p className="text-[10px] text-status-success font-bold mt-1">OPTIMAL RANGE</p>
          </div>
        </div>
        {/* Stat Card 3 */}
        <div className="bg-surface-white rounded-xl shadow-sm overflow-hidden relative group">
          <div className="h-1 w-full bg-primary absolute top-0 left-0"></div>
          <div className="p-lg flex flex-col gap-xs">
            <span className="text-outline font-label-bold uppercase tracking-tighter">Next Service</span>
            <div className="flex items-end gap-xs">
              <span className="font-stat-number text-stat-number text-on-surface">{asset.nextService || 150}</span>
              <span className="text-secondary font-label-bold mb-2">HRS</span>
            </div>
            <div className="mt-md flex gap-base">
              <div className="flex-1 bg-surface-container h-1 rounded-full"></div>
              <div className="flex-1 bg-surface-container h-1 rounded-full"></div>
              <div className="flex-1 bg-primary h-1 rounded-full shadow-[0_0_8px_rgba(255,205,17,0.5)]"></div>
              <div className="flex-1 bg-surface-container h-1 rounded-full"></div>
            </div>
            <p className="text-[10px] text-outline font-bold mt-1">DUE IN APPROX. 14 DAYS</p>
          </div>
        </div>
        {/* Live Telematics Image Card */}
        <div className="bg-surface-white rounded-xl shadow-sm overflow-hidden relative row-span-1">
          <img className="w-full h-full object-cover" alt="Telematics view" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAd4dWq0YDGdlDdA6ZgGZkKGa3BoGH5lyiugCQU87OX52A5VCaaDD-Fcom81EhqUs2iyB9IP5Zj-cSY2sSETT2m3VyTNZRRK_n04HiHhA2eyk1h_ogWmBLK4Lbm-69x7sgAsqw9SYCDCOQ-XEsrO9j5N0D1ms74a8vt1hR1dLHXGYuBgWm8hjmqE4aErzFanO1a4A_x7PPpH9EgnJk-VjuJc_8KxJVTIDxxWJbuMJbxL3qwJmqjrEL"/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-md flex flex-col justify-end">
            <span className="text-white/70 font-label-bold text-[10px] uppercase tracking-widest">Live View</span>
            <p className="text-white font-headline-sm">{asset.location || 'Sector 7A - Mining'}</p>
          </div>
        </div>
      </div>

      {/* Main Analysis Section (placeholder for brevity) */}
      <div className="bg-surface-white p-lg rounded-xl shadow-sm">
        <h3 className="font-headline-md text-on-surface">Equipment Analysis Section placeholder</h3>
      </div>
    </div>
  );
};

export default EquipmentDetail;
