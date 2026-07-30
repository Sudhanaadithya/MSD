import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getEquipmentList, createRentalRecord } from '../services/database';
import { exportEquipmentPDF, generateRentalVoucherPDF } from '../utils/pdfExport';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { publishKafkaEvent, KAFKA_TOPICS } from '../services/kafkaService';
import KafkaStreamTicker from '../components/KafkaStreamTicker';

const Dashboard = () => {
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const { addToast } = useToast();

  const isCustomer = role === 'Customer';

  const [summary, setSummary] = useState({
    totalAssets: 142,
    activeAssets: 98,
    maintenanceAssets: 7,
    idleAssets: 12,
  });

  const [assets, setAssets] = useState([
    { id: 'EX-402', type: 'Excavator', site: 'North Ridge Quarry', status: 'Active', rentalDays: '14 Days', operator: 'John D.', operatorInitials: 'JD' },
    { id: 'CR-110', type: 'Crane', site: 'Harbor Site', status: 'Overdue', rentalDays: '42 Days', operator: 'Marcus K.', operatorInitials: 'MK' },
    { id: 'BD-088', type: 'Bulldozer', site: 'East Mine', status: 'Idle', rentalDays: '--', operator: 'Unassigned', operatorInitials: 'NA' },
    { id: 'EX-405', type: 'Excavator', site: 'North Ridge Quarry', status: 'Active', rentalDays: '5 Days', operator: 'Sarah L.', operatorInitials: 'SL' },
    { id: 'LD-099', type: 'Loader', site: 'Sector 7 Expansion', status: 'Available', rentalDays: '--', operator: 'Unassigned', operatorInitials: 'NA' },
    { id: 'GR-201', type: 'Grader', site: 'Highway Zone A', status: 'Available', rentalDays: '--', operator: 'Unassigned', operatorInitials: 'NA' }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Assets');
  const [selectedSite, setSelectedSite] = useState('All Sites');

  // Customer Booking Modal state
  const [selectedAssetForBooking, setSelectedAssetForBooking] = useState(null);
  const [customerSite, setCustomerSite] = useState('S001');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const stats = await getDashboardStats();
        if (stats) {
          setSummary({
            totalAssets: stats.totalEquipment || 142,
            activeAssets: stats.activeRentals || 98,
            maintenanceAssets: stats.unresolvedAlerts || 7,
            idleAssets: 12,
          });
        }
        const fleetData = await getEquipmentList();
        if (fleetData && fleetData.length > 0) {
          const formatted = fleetData.map((e) => ({
            id: e.equipment_id || e.id,
            type: e.type || 'Excavator',
            site: e.sites?.name || e.site || 'North Ridge Quarry',
            status: e.status ? e.status.charAt(0).toUpperCase() + e.status.slice(1) : 'Available',
            rentalDays: e.rentalDays || '14 Days',
            operator: e.operator || 'John D.',
            operatorInitials: (e.operator || 'JD').split(' ').map((n) => n[0]).join(''),
          }));
          setAssets(formatted);
        }
      } catch (err) {
        console.warn('Dashboard data notice:', err.message);
      }
    }
    loadData();
  }, []);

  const handleExportFleetPDF = () => {
    exportEquipmentPDF(assets);
    addToast('Fleet Inventory PDF exported successfully!', 'success', 'PDF Downloaded');
  };

  const handleCustomerBookAsset = async (e) => {
    e.preventDefault();
    if (!selectedAssetForBooking) return;
    setIsSubmittingBooking(true);

    try {
      const rentalPayload = {
        equipment_id: selectedAssetForBooking.id,
        site_id: customerSite,
        operator_id: 'OP101',
        check_in_date: new Date().toISOString().split('T')[0],
        engine_hours_day: 8.0,
        idle_hours_day: 1.0,
        notes: `Customer booking by ${user?.email || 'Customer'}`,
      };

      const res = await createRentalRecord(rentalPayload);

      // Publish Kafka Event
      publishKafkaEvent(KAFKA_TOPICS.RENTAL_CHECKIN, {
        rental_id: res.id,
        equipment_id: selectedAssetForBooking.id,
        site_id: customerSite,
        customer_email: user?.email,
        status: 'BOOKED_VIA_CUSTOMER_PORTAL',
        msg: `Customer booked ${selectedAssetForBooking.type} (${selectedAssetForBooking.id})`,
      });

      // Generate Voucher PDF
      generateRentalVoucherPDF({
        id: res.id || 'RENT-' + Date.now(),
        equipment_id: selectedAssetForBooking.id,
        equipment: { type: selectedAssetForBooking.type },
        sites: { name: customerSite },
        operators: { name: 'Assigned Fleet Operator' },
        check_in_date: new Date().toISOString().split('T')[0],
      });

      addToast(`Booking confirmed for ${selectedAssetForBooking.id}! Voucher downloaded.`, 'success', 'Booking Complete');
      setSelectedAssetForBooking(null);
    } catch (err) {
      addToast(`Booking failed: ${err.message}`, 'error', 'Error');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.id.toLowerCase().includes(searchQuery.toLowerCase()) || asset.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All Assets' || asset.type.toLowerCase() === selectedType.toLowerCase();
    const matchesSite = selectedSite === 'All Sites' || asset.site.toLowerCase().includes(selectedSite.toLowerCase());
    return matchesSearch && matchesType && matchesSite;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30';
      case 'Overdue': return 'bg-rose-500/15 text-rose-700 border-rose-500/30';
      case 'Idle': return 'bg-amber-500/15 text-amber-800 border-amber-500/30';
      default: return 'bg-blue-500/15 text-blue-800 border-blue-500/30';
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-500';
      case 'Overdue': return 'bg-rose-500';
      case 'Idle': return 'bg-amber-500';
      default: return 'bg-blue-500';
    }
  };

  // ═════════════════════════════════════════════════════════════════
  // RENDER CUSTOMER DASHBOARD PORTAL
  // ═════════════════════════════════════════════════════════════════
  if (isCustomer) {
    const availableAssets = assets.filter(a => a.status === 'Available' || a.status === 'Idle');
    return (
      <div className="flex flex-col w-full gap-lg">
        {/* Customer Welcome Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-lg border-2 border-[#FFCD00] shadow-xl flex flex-col md:flex-row items-center justify-between gap-md">
          <div className="flex flex-col gap-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-[#FFCD00] text-gray-950 font-black text-[10px] uppercase tracking-widest self-start">
              CUSTOMER FLEET PORTAL
            </span>
            <h1 className="text-2xl font-bold">Welcome back, {user?.email?.split('@')[0]}!</h1>
            <p className="text-gray-300 text-sm">
              Browse available heavy machinery, book rental deployments, and download instant vouchers.
            </p>
          </div>
          <div className="flex items-center gap-md bg-white/10 p-md rounded-xl backdrop-blur-sm border border-white/10">
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-gray-400 font-bold uppercase">AVAILABLE TO BOOK</span>
              <span className="text-2xl font-black text-[#FFCD00]">{availableAssets.length} Units</span>
            </div>
            <span className="material-symbols-outlined text-4xl text-[#FFCD00]">precision_manufacturing</span>
          </div>
        </div>

        {/* Live Kafka Stream Preview */}
        <KafkaStreamTicker />

        {/* Available Catalog Grid */}
        <div className="flex flex-col gap-md">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="w-3 h-3 bg-[#FFCD00] rounded-sm" />
              Available Machinery Catalog
            </h2>
            <span className="text-xs text-gray-500 font-medium">Click any asset to book immediately</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            {availableAssets.map((asset) => (
              <div
                key={asset.id}
                className="bg-white rounded-xl p-md border-2 border-gray-200 hover:border-gray-900 transition-all shadow-sm hover:shadow-xl flex flex-col justify-between gap-md group"
              >
                <div className="flex flex-col gap-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold uppercase">
                      {asset.type}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {asset.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 group-hover:text-[#D9A700] transition-colors">
                    {asset.id}
                  </h3>
                  <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-gray-400">location_on</span>
                    {asset.site}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedAssetForBooking(asset)}
                  className="w-full py-2.5 rounded-lg bg-[#FFCD00] hover:bg-[#E5B800] text-gray-950 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-gray-900 shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-base font-bold">event_available</span>
                  BOOK THIS MACHINE
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Booking Modal */}
        {selectedAssetForBooking && (
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-md animate-fade-in">
            <div className="bg-white rounded-2xl border-2 border-gray-900 p-lg max-w-md w-full shadow-2xl flex flex-col gap-md">
              <div className="flex items-center justify-between border-b pb-sm border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FFCD00]">local_shipping</span>
                  Confirm Equipment Booking
                </h3>
                <button
                  onClick={() => setSelectedAssetForBooking(null)}
                  className="text-gray-400 hover:text-gray-900 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="bg-gray-50 p-md rounded-xl border border-gray-200 flex flex-col gap-xs text-xs text-gray-700">
                <p><strong>Asset ID:</strong> {selectedAssetForBooking.id}</p>
                <p><strong>Equipment Type:</strong> {selectedAssetForBooking.type}</p>
                <p><strong>Current Location:</strong> {selectedAssetForBooking.site}</p>
                <p><strong>Estimated Rate:</strong> $450 / day</p>
              </div>

              <form onSubmit={handleCustomerBookAsset} className="flex flex-col gap-md">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Select Target Site</label>
                  <select
                    value={customerSite}
                    onChange={(e) => setCustomerSite(e.target.value)}
                    className="w-full p-2.5 rounded-lg border-2 border-gray-300 text-xs font-bold outline-none focus:border-gray-900"
                  >
                    <option value="S001">S001 — Highway Zone A (Chennai)</option>
                    <option value="S002">S002 — Metro Rail Extension (Bangalore)</option>
                    <option value="S003">S003 — Industrial Park (Hyderabad)</option>
                    <option value="S004">S004 — River Dam Site (Pune)</option>
                    <option value="S005">S005 — Mining Operations (Ranchi)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-md pt-sm border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setSelectedAssetForBooking(null)}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingBooking}
                    className="px-5 py-2.5 rounded-lg bg-[#FFCD00] hover:bg-[#E5B800] text-gray-950 font-black text-xs border border-gray-900 shadow-md active:scale-95"
                  >
                    {isSubmittingBooking ? 'Booking & Emitting Event...' : 'Confirm & Download Voucher'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER EMPLOYEE / OPERATOR / MANAGER / ADMIN DASHBOARD
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col w-full gap-lg">
      {/* Live Kafka Event Stream Ticker */}
      <KafkaStreamTicker />

      {/* Top Summary Row: Tactical Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
        {/* Total Equipment */}
        <div className="animate-fade-up delay-1 bg-surface-white rounded-xl shadow-sm overflow-hidden relative group hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 border border-transparent transition-all duration-300">
          <div className="h-1 bg-primary w-full group-hover:h-2 transition-all"></div>
          <div className="p-md flex flex-col gap-xs">
            <span className="font-label-bold text-label-bold text-outline uppercase tracking-widest">Total Equipment</span>
            <div className="flex items-end justify-between">
              <span className="font-stat-number text-stat-number text-primary leading-none">{summary.totalAssets}</span>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors group-hover:scale-110">precision_manufacturing</span>
            </div>
          </div>
        </div>
        {/* Active Rentals */}
        <div className="animate-fade-up delay-2 bg-surface-white rounded-xl shadow-sm overflow-hidden relative group hover:shadow-xl hover:-translate-y-1 hover:border-status-success/20 border border-transparent transition-all duration-300">
          <div className="h-1 bg-status-success w-full group-hover:h-2 transition-all"></div>
          <div className="p-md flex flex-col gap-xs">
            <span className="font-label-bold text-label-bold text-outline uppercase tracking-widest">Active Rentals</span>
            <div className="flex items-end justify-between">
              <span className="font-stat-number text-stat-number text-primary leading-none">{summary.activeAssets}</span>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-status-success transition-colors group-hover:scale-110">check_circle</span>
            </div>
          </div>
        </div>
        {/* Overdue Alerts */}
        <div className="animate-fade-up delay-3 bg-surface-white rounded-xl shadow-sm overflow-hidden relative group hover:shadow-xl hover:-translate-y-1 hover:border-status-error/20 border border-transparent transition-all duration-300">
          <div className="h-1 bg-status-error w-full group-hover:h-2 transition-all"></div>
          <div className="p-md flex flex-col gap-xs">
            <span className="font-label-bold text-label-bold text-outline uppercase tracking-widest">Overdue Alerts</span>
            <div className="flex items-end justify-between">
              <span className="font-stat-number text-stat-number text-status-error leading-none">0{summary.maintenanceAssets}</span>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-status-error transition-colors group-hover:scale-110">error</span>
            </div>
          </div>
        </div>
        {/* Idle Equipment */}
        <div className="animate-fade-up delay-4 bg-surface-white rounded-xl shadow-sm overflow-hidden relative group hover:shadow-xl hover:-translate-y-1 hover:border-status-warning/20 border border-transparent transition-all duration-300">
          <div className="h-1 bg-status-warning w-full group-hover:h-2 transition-all"></div>
          <div className="p-md flex flex-col gap-xs">
            <span className="font-label-bold text-label-bold text-outline uppercase tracking-widest">Idle Equipment</span>
            <div className="flex items-end justify-between">
              <span className="font-stat-number text-stat-number text-status-warning leading-none">{summary.idleAssets}</span>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-status-warning transition-colors group-hover:scale-110">pause_circle</span>
            </div>
          </div>
        </div>
      </div>

      {/* Industrial Layout: Main Control Center */}
      <div className="grid grid-cols-12 gap-lg items-start">
        {/* Left Column: Table and Filters (9 Columns) */}
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-md">
          {/* Filter Bar */}
          <div className="animate-fade-up delay-4 bg-surface-container-low p-md rounded-xl flex flex-wrap items-end justify-between gap-md shadow-sm border border-outline-variant/30 transition-all hover:shadow-md">
            <div className="flex flex-wrap items-end gap-md flex-1">
              <div className="flex-1 min-w-[200px]">
                <label className="font-label-bold text-label-bold text-on-surface-variant block mb-xs uppercase">Asset ID Search</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                  <input
                    className="w-full bg-surface-white border-2 border-outline-variant focus:border-on-surface pl-xl pr-md py-xs rounded font-body-sm outline-none transition-all"
                    placeholder="e.g. EX-402"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-44">
                <label className="font-label-bold text-label-bold text-on-surface-variant block mb-xs uppercase">Type</label>
                <select
                  className="w-full bg-surface-white border-2 border-outline-variant focus:border-on-surface px-sm py-xs rounded font-body-sm outline-none cursor-pointer hover:border-outline transition-all"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="All Assets">All Assets</option>
                  <option value="Excavator">Excavator</option>
                  <option value="Crane">Crane</option>
                  <option value="Bulldozer">Bulldozer</option>
                  <option value="Loader">Loader</option>
                </select>
              </div>
              <div className="w-44">
                <label className="font-label-bold text-label-bold text-on-surface-variant block mb-xs uppercase">Site Location</label>
                <select
                  className="w-full bg-surface-white border-2 border-outline-variant focus:border-on-surface px-sm py-xs rounded font-body-sm outline-none cursor-pointer hover:border-outline transition-all"
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                >
                  <option value="All Sites">All Sites</option>
                  <option value="North Quarry">North Quarry</option>
                  <option value="Harbor Site">Harbor Site</option>
                  <option value="East Mine">East Mine</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleExportFleetPDF}
              className="bg-primary text-on-primary-fixed px-lg py-[10px] rounded font-label-bold flex items-center gap-xs hover:bg-[#574400] transition-all active:scale-95 shadow-sm hover:shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              EXPORT PDF
            </button>
          </div>

          {/* Equipment Table */}
          <div className="animate-fade-up delay-5 bg-surface-white rounded-xl shadow-md overflow-hidden border border-outline-variant transition-all hover:shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary text-on-primary">
                  <th className="px-md py-sm font-label-bold uppercase tracking-wider border-r border-primary-fixed-dim/20">Equipment ID</th>
                  <th className="px-md py-sm font-label-bold uppercase tracking-wider border-r border-primary-fixed-dim/20">Type</th>
                  <th className="px-md py-sm font-label-bold uppercase tracking-wider border-r border-primary-fixed-dim/20">Site</th>
                  <th className="px-md py-sm font-label-bold uppercase tracking-wider border-r border-primary-fixed-dim/20">Status</th>
                  <th className="px-md py-sm font-label-bold uppercase tracking-wider border-r border-primary-fixed-dim/20">Rental Days</th>
                  <th className="px-md py-sm font-label-bold uppercase tracking-wider">Last Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {filteredAssets.map((asset, index) => (
                  <tr 
                    key={asset.id}
                    className={`group ${index % 2 !== 0 ? 'bg-surface-container-low' : ''} hover:bg-surface-container-high transition-all duration-200 cursor-pointer relative`}
                    onClick={() => navigate(`/equipment/${asset.id}`)}
                  >
                    <td className="px-md py-md font-label-bold text-on-surface">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-all duration-200"></div>
                      <span className="hover:text-primary hover:underline underline-offset-4 decoration-2">{asset.id}</span>
                    </td>
                    <td className="px-md py-md font-body-sm text-on-surface-variant">{asset.type}</td>
                    <td className="px-md py-md font-body-sm text-on-surface-variant">{asset.site}</td>
                    <td className="px-md py-md">
                      <span className={`inline-flex items-center px-sm py-base rounded-full text-[11px] font-bold uppercase tracking-tighter border ${getStatusColor(asset.status)} transition-all`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDot(asset.status)}`}></span> {asset.status}
                      </span>
                    </td>
                    <td className={`px-md py-md font-body-sm text-on-surface ${asset.status === 'Overdue' ? 'text-status-error font-bold' : ''}`}>{asset.rentalDays}</td>
                    <td className="px-md py-md font-body-sm text-on-surface flex items-center gap-xs">
                      <div className={`w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold ${asset.status === 'Idle' ? 'text-outline' : ''} transition-transform group-hover:scale-110`}>
                        {asset.operatorInitials}
                      </div>
                      {asset.operator}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-md flex items-center justify-between border-t border-outline-variant bg-surface-white">
              <span className="font-body-sm text-on-surface-variant italic">Showing 1-{filteredAssets.length} of {summary.totalAssets} tracked assets</span>
              <div className="flex gap-xs">
                <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant hover:bg-primary hover:text-on-primary transition-all active:scale-90 group">
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded border border-on-surface bg-on-surface text-surface-white font-label-bold transition-all active:scale-90">1</button>
                <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant hover:bg-primary hover:text-on-primary transition-all active:scale-90 group">
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions & Live Feed (3 Columns) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-lg">
          {/* Quick Actions */}
          <section className="animate-fade-up delay-2 bg-surface-white rounded-xl p-md shadow-md border border-outline-variant flex flex-col gap-md transition-all hover:shadow-lg">
            <h3 className="font-headline-sm text-headline-sm uppercase tracking-tight border-b-4 border-primary pb-base inline-block self-start">Quick Actions</h3>
            <div className="flex flex-col gap-sm">
              <button 
                onClick={() => navigate('/check-in-out')}
                className="flex items-center justify-between w-full bg-primary-container p-md rounded-lg group hover:bg-primary transition-all duration-300 transform hover:-translate-y-1 active:scale-95 shadow-sm hover:shadow-md"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="font-label-bold text-on-primary-container group-hover:text-on-primary uppercase tracking-wider transition-colors">Rapid Camera QR Scan</span>
                  <span className="text-[10px] text-on-primary-container/70 group-hover:text-on-primary/70 transition-colors">Deploy / return asset via camera</span>
                </div>
                <span className="material-symbols-outlined text-on-primary-container group-hover:text-on-primary text-[28px] transition-all group-hover:scale-110">qr_code_scanner</span>
              </button>
              <button 
                onClick={() => navigate('/alerts')}
                className="flex items-center justify-between w-full border-2 border-on-surface p-md rounded-lg group hover:bg-error hover:border-error transition-all duration-300 transform hover:-translate-y-1 active:scale-95 shadow-sm hover:shadow-md"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="font-label-bold text-on-surface group-hover:text-on-error uppercase tracking-wider transition-colors">Flag Anomaly</span>
                  <span className="text-[10px] text-on-surface-variant group-hover:text-on-error/70 transition-colors">Report maintenance or safety issue</span>
                </div>
                <span className="material-symbols-outlined text-on-surface group-hover:text-on-error text-[28px] transition-all group-hover:scale-110">priority_high</span>
              </button>
            </div>
          </section>

          {/* Fleet Health Chart */}
          <section className="animate-fade-up delay-3 bg-surface-white rounded-xl p-md shadow-md border border-outline-variant flex flex-col gap-md transition-all hover:shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-label-bold text-on-surface-variant uppercase tracking-widest">Fleet Health</h3>
              <span className="text-status-success font-label-bold text-[10px] animate-pulse">92% OPERATIONAL</span>
            </div>
            <div className="relative h-32 w-full flex items-end justify-between gap-base px-sm overflow-hidden">
              <div className="w-full h-full absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none transition-transform hover:scale-110">
                <span className="material-symbols-outlined text-[80px] text-primary">analytics</span>
              </div>
              <div className="animate-scale-up delay-1 w-4 bg-primary/20 h-1/2 rounded-t-sm hover:bg-primary transition-colors"></div>
              <div className="animate-scale-up delay-2 w-4 bg-primary/40 h-2/3 rounded-t-sm hover:bg-primary transition-colors"></div>
              <div className="animate-scale-up delay-3 w-4 bg-primary/60 h-3/4 rounded-t-sm hover:bg-primary transition-colors"></div>
              <div className="animate-scale-up delay-4 w-4 bg-primary h-full rounded-t-sm hover:bg-primary-fixed-dim transition-colors"></div>
              <div className="animate-scale-up delay-5 w-4 bg-primary/80 h-4/5 rounded-t-sm hover:bg-primary transition-colors"></div>
              <div className="animate-scale-up delay-4 w-4 bg-primary/30 h-1/3 rounded-t-sm hover:bg-primary transition-colors"></div>
              <div className="animate-scale-up delay-3 w-4 bg-primary/50 h-3/5 rounded-t-sm hover:bg-primary transition-colors"></div>
              <div className="animate-scale-up delay-2 w-4 bg-primary/90 h-5/6 rounded-t-sm hover:bg-primary transition-colors"></div>
            </div>
            <p className="font-body-sm text-on-surface-variant text-center border-t border-outline-variant pt-sm">
              Fleet utilization is <span className="font-bold text-on-surface">up 12%</span> since last shift.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
