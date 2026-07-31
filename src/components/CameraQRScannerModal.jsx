import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QR_TIMEOUT_SECONDS = 250;

const CameraQRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [scanError, setScanError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('camera');
  const [timeLeft, setTimeLeft] = useState(QR_TIMEOUT_SECONDS);
  const [fileScanning, setFileScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scannedTag, setScannedTag] = useState('');

  const scannerRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Timer
  useEffect(() => {
    if (!isOpen) return;
    setScanSuccess(false);
    setScannedTag('');
    setTimeLeft(QR_TIMEOUT_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isOpen]);

  // Camera init
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') return;
    let html5Qr = null;

    async function initScanner() {
      try {
        setScanError(null);
        setIsScanning(true);
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          const backCam = devices.find(d =>
            d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')
          ) || devices[0];

          html5Qr = new Html5Qrcode('wa-qr-reader');
          scannerRef.current = html5Qr;

          await html5Qr.start(
            backCam.id,
            { fps: 15, qrbox: { width: 360, height: 360 }, aspectRatio: 1.0 },
            (decodedText) => {
              playBeep();
              setScannedTag(decodedText);
              setScanSuccess(true);
              setTimeout(() => {
                stopScanner();
                onScanSuccess(decodedText);
                onClose();
              }, 800);
            },
            () => {}
          );
        } else {
          setScanError('No camera found. Use Upload or Quick Tags.');
          setIsScanning(false);
        }
      } catch (err) {
        setScanError(`Camera blocked: ${err.message || 'Sandbox restriction'}`);
        setIsScanning(false);
      }
    }
    initScanner();
    return () => stopScanner();
  }, [isOpen, activeTab]);

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(() => {});
    }
  };

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileScanning(true);
    setScanError(null);
    try {
      const html5Qr = new Html5Qrcode('wa-qr-upload-hidden');
      const decoded = await html5Qr.scanFile(file, true);
      playBeep();
      setScannedTag(decoded);
      setScanSuccess(true);
      setTimeout(() => { onScanSuccess(decoded); onClose(); }, 800);
    } catch {
      setScanError('Could not read QR from image. Try another photo.');
    } finally {
      setFileScanning(false);
    }
  };

  const handleQuickTag = (tag) => {
    playBeep();
    setScannedTag(tag);
    setScanSuccess(true);
    setTimeout(() => { stopScanner(); onScanSuccess(tag); onClose(); }, 500);
  };

  const handleClose = () => { stopScanner(); onClose(); };

  if (!isOpen) return null;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col" style={{ background: '#0b141a' }}>
      <style>{`
        @keyframes waScanLine {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes waCornerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes waSuccessScale {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes waFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        #wa-qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 0 !important;
        }
        #wa-qr-reader {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
        }
        #wa-qr-reader img, #wa-qr-reader span { display: none !important; }
      `}</style>

      <div id="wa-qr-upload-hidden" className="hidden"></div>

      {/* WhatsApp-style Top Bar */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 z-20" style={{ background: '#1f2c34' }}>
        <button onClick={handleClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-white text-2xl">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="text-white text-base font-semibold tracking-tight">Scan QR Code</h1>
          <p className="text-[11px] font-medium" style={{ color: '#8696a0' }}>
            {scanSuccess ? 'QR code detected!' : 'Point your camera at a QR code'}
          </p>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold"
          style={{
            background: timeLeft > 30 ? 'rgba(0,168,132,0.15)' : 'rgba(239,68,68,0.15)',
            color: timeLeft > 30 ? '#00a884' : '#ef4444',
          }}
        >
          <span className="material-symbols-outlined text-sm">timer</span>
          {mins}:{secs.toString().padStart(2, '0')}
          {timeLeft === 0 && (
            <button
              onClick={() => setTimeLeft(QR_TIMEOUT_SECONDS)}
              className="ml-1 text-[9px] font-black px-1.5 py-0.5 rounded"
              style={{ background: '#00a884', color: '#fff' }}
            >
              RESET
            </button>
          )}
        </div>
      </div>

      {/* Scanner body */}
      <div className="flex-1 relative overflow-hidden">
        {/* Camera View */}
        {activeTab === 'camera' && (
          <>
            <div id="wa-qr-reader" className="absolute inset-0 bg-black"></div>

            {/* WhatsApp-style overlay with cut-out */}
            {isScanning && !scanError && (
              <div className="absolute inset-0 z-10 pointer-events-none">
                {/* Semi-transparent overlay with transparent center */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <mask id="wa-mask">
                      <rect width="100%" height="100%" fill="white" />
                      <rect x="50%" y="50%" width="360" height="360" rx="24" ry="24" fill="black"
                        transform="translate(-180, -180)" />
                    </mask>
                  </defs>
                  <rect width="100%" height="100%" fill="rgba(11, 20, 26, 0.65)" mask="url(#wa-mask)" />
                </svg>

                {/* Reticle Frame — WhatsApp-style rounded corners */}
                <div className="absolute top-1/2 left-1/2 w-[360px] h-[360px] max-w-[90vw] max-h-[90vw]" style={{ transform: 'translate(-50%, -50%)' }}>
                  {/* Corner brackets */}
                  <div className="absolute -top-0.5 -left-0.5 w-14 h-14" style={{ animation: 'waCornerPulse 2s ease-in-out infinite' }}>
                    <div className="absolute top-0 left-0 w-full h-1 rounded-full" style={{ background: '#00a884' }}></div>
                    <div className="absolute top-0 left-0 w-1 h-full rounded-full" style={{ background: '#00a884' }}></div>
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-14 h-14" style={{ animation: 'waCornerPulse 2s ease-in-out infinite 0.5s' }}>
                    <div className="absolute top-0 right-0 w-full h-1 rounded-full" style={{ background: '#00a884' }}></div>
                    <div className="absolute top-0 right-0 w-1 h-full rounded-full" style={{ background: '#00a884' }}></div>
                  </div>
                  <div className="absolute -bottom-0.5 -left-0.5 w-14 h-14" style={{ animation: 'waCornerPulse 2s ease-in-out infinite 1s' }}>
                    <div className="absolute bottom-0 left-0 w-full h-1 rounded-full" style={{ background: '#00a884' }}></div>
                    <div className="absolute bottom-0 left-0 w-1 h-full rounded-full" style={{ background: '#00a884' }}></div>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-14 h-14" style={{ animation: 'waCornerPulse 2s ease-in-out infinite 1.5s' }}>
                    <div className="absolute bottom-0 right-0 w-full h-1 rounded-full" style={{ background: '#00a884' }}></div>
                    <div className="absolute bottom-0 right-0 w-1 h-full rounded-full" style={{ background: '#00a884' }}></div>
                  </div>

                  {/* Scan line */}
                  <div
                    className="absolute left-3 right-3 h-0.5"
                    style={{
                      background: 'linear-gradient(90deg, transparent, #00a884, #00a884, transparent)',
                      boxShadow: '0 0 12px rgba(0, 168, 132, 0.6), 0 0 24px rgba(0, 168, 132, 0.3)',
                      animation: 'waScanLine 3s ease-in-out infinite',
                    }}
                  />
                </div>

                {/* Success flash */}
                {scanSuccess && (
                  <div className="absolute top-1/2 left-1/2 w-[360px] h-[360px] max-w-[90vw] max-h-[90vw] rounded-3xl flex items-center justify-center"
                    style={{ transform: 'translate(-50%, -50%)', background: 'rgba(0, 168, 132, 0.2)', animation: 'waSuccessScale 0.4s ease-out' }}>
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-5xl" style={{ color: '#00a884' }}>check_circle</span>
                      <span className="text-white text-sm font-bold">{scannedTag}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Camera Error */}
            {scanError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 gap-5 z-20" style={{ background: '#0b141a' }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,168,132,0.1)' }}>
                  <span className="material-symbols-outlined text-5xl" style={{ color: '#00a884' }}>no_photography</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold mb-1">Camera unavailable</p>
                  <p className="text-xs max-w-xs" style={{ color: '#8696a0' }}>{scanError}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setActiveTab('upload')}
                    className="px-5 py-2.5 rounded-full text-xs font-bold text-white flex items-center gap-2"
                    style={{ background: '#00a884' }}>
                    <span className="material-symbols-outlined text-base">add_a_photo</span>
                    Upload Photo
                  </button>
                  <button onClick={() => setActiveTab('quick')}
                    className="px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2"
                    style={{ background: '#1f2c34', color: '#e9edef', border: '1px solid #2a3942' }}>
                    <span className="material-symbols-outlined text-base">inventory_2</span>
                    Quick Tags
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 gap-6"
            style={{ background: '#0b141a', animation: 'waFadeIn 0.3s ease-out' }}>
            <div className="w-28 h-28 rounded-3xl flex items-center justify-center"
              style={{ background: '#1f2c34', border: '2px dashed #2a3942' }}>
              <span className="material-symbols-outlined text-6xl" style={{ color: '#00a884' }}>add_a_photo</span>
            </div>
            <div className="text-center">
              <p className="text-white text-base font-semibold mb-1">Upload QR Code</p>
              <p className="text-xs max-w-xs" style={{ color: '#8696a0' }}>
                Take a photo of the equipment QR tag or select an image from your gallery
              </p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
              onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={fileScanning}
              className="px-8 py-3.5 rounded-full text-sm font-bold text-white flex items-center gap-3 active:scale-95 transition-transform"
              style={{ background: '#00a884' }}>
              <span className="material-symbols-outlined text-xl">photo_camera</span>
              {fileScanning ? 'Reading QR...' : 'Choose Photo'}
            </button>
          </div>
        )}

        {/* Quick Tags Tab */}
        {activeTab === 'quick' && (
          <div className="absolute inset-0 flex flex-col items-center pt-12 px-6 gap-6 overflow-y-auto"
            style={{ background: '#0b141a', animation: 'waFadeIn 0.3s ease-out' }}>
            <div className="text-center">
              <p className="text-white text-base font-semibold mb-1">Quick Select Equipment</p>
              <p className="text-xs" style={{ color: '#8696a0' }}>Tap to simulate scanning an equipment QR tag</p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              {[
                { tag: 'EX-402', label: 'Excavator Heavy', icon: 'precision_manufacturing' },
                { tag: 'CR-110', label: 'Crawler Crane', icon: 'construction' },
                { tag: 'BD-088', label: 'Bulldozer D8', icon: 'front_loader' },
                { tag: 'LD-099', label: 'Front Loader', icon: 'agriculture' },
                { tag: 'BK-SAMPLE-01', label: 'Booking #1', icon: 'receipt_long' },
                { tag: 'BK-SAMPLE-02', label: 'Booking #2', icon: 'receipt_long' },
              ].map(({ tag, label, icon }) => (
                <button key={tag} onClick={() => handleQuickTag(tag)}
                  className="p-4 rounded-2xl flex items-center gap-3 text-left transition-all active:scale-95 group"
                  style={{ background: '#1f2c34', border: '1px solid #2a3942' }}>
                  <span className="material-symbols-outlined text-2xl" style={{ color: '#00a884' }}>{icon}</span>
                  <div>
                    <span className="font-bold text-sm text-white block">{tag}</span>
                    <span className="text-[10px] font-medium" style={{ color: '#8696a0' }}>{label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom instruction + tab bar */}
      <div className="shrink-0 z-20" style={{ background: '#1f2c34' }}>
        {/* Instruction text */}
        {activeTab === 'camera' && !scanError && !scanSuccess && (
          <div className="text-center py-3 px-4">
            <p className="text-xs font-medium" style={{ color: '#8696a0' }}>
              Point your camera at a QR code to scan equipment tags
            </p>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex items-center justify-center gap-1 px-4 py-2 pb-4">
          {[
            { key: 'camera', label: 'Camera', icon: 'photo_camera' },
            { key: 'upload', label: 'Gallery', icon: 'photo_library' },
            { key: 'quick', label: 'Quick Tags', icon: 'label' },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all"
              style={{
                background: activeTab === key ? 'rgba(0,168,132,0.15)' : 'transparent',
                color: activeTab === key ? '#00a884' : '#8696a0',
              }}
            >
              <span className="material-symbols-outlined text-xl">{icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CameraQRScannerModal;
