import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QR_TIMEOUT_SECONDS = 250;

const CameraQRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [scanError, setScanError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload' | 'quick'
  const [timeLeft, setTimeLeft] = useState(QR_TIMEOUT_SECONDS);
  const [fileScanning, setFileScanning] = useState(false);

  const scannerRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // 250-Second Timer
  useEffect(() => {
    if (!isOpen) return;

    setTimeLeft(QR_TIMEOUT_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  // Camera Initialization
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') return;

    let html5QrcodeScanner = null;

    async function initScanner() {
      try {
        setScanError(null);
        setIsScanning(true);

        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')) || devices[0];
          setSelectedCameraId(backCam.id);

          html5QrcodeScanner = new Html5Qrcode("reader");
          scannerRef.current = html5QrcodeScanner;

          await html5QrcodeScanner.start(
            backCam.id,
            {
              fps: 10,
              qrbox: { width: 240, height: 240 }
            },
            (decodedText, decodedResult) => {
              playBeep();
              stopScanner();
              onScanSuccess(decodedText, decodedResult);
              onClose();
            },
            () => {}
          );
        } else {
          setScanError('No camera devices detected or access restricted by browser sandbox.');
          setIsScanning(false);
        }
      } catch (err) {
        console.warn('QR Camera Access Notice:', err);
        setScanError(`Sandbox Restriction: ${err.message || 'Camera blocked in restricted mobile webview'}`);
        setIsScanning(false);
      }
    }

    initScanner();

    return () => {
      stopScanner();
    };
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
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  };

  const handleResetTimer = () => {
    setTimeLeft(QR_TIMEOUT_SECONDS);
  };

  // Mobile File Photo Scanner Fallback
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileScanning(true);
    setScanError(null);

    try {
      const html5Qrcode = new Html5Qrcode("reader-upload-tmp");
      const decodedText = await html5Qrcode.scanFile(file, true);
      playBeep();
      onScanSuccess(decodedText);
      onClose();
    } catch (err) {
      setScanError('Could not decode QR code from uploaded image. Try quick tag selection below.');
    } finally {
      setFileScanning(false);
    }
  };

  const handleManualSelect = (assetId) => {
    playBeep();
    stopScanner();
    onScanSuccess(assetId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-md animate-fade-in">
      <div className="bg-gray-950 border-2 border-[#FFCD00] text-white rounded-2xl p-lg max-w-lg w-full shadow-2xl flex flex-col gap-md">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FFCD00] text-2xl font-bold">
              qr_code_scanner
            </span>
            <div>
              <h3 className="text-sm font-black tracking-wide text-white uppercase">
                Employee Rapid QR Scanner
              </h3>
              <p className="text-[10px] text-gray-400">Mobile Sandbox & Hardware Camera Compatible</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-gray-400 hover:text-[#FFCD00] text-xl font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 250-Second Countdown Timer Banner */}
        <div className={`flex items-center justify-between p-sm rounded-lg border ${timeLeft > 30 ? 'bg-gray-900 border-gray-700 text-[#FFCD00]' : 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'}`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">timer</span>
            <span className="text-xs font-mono font-black">
              Session Time Remaining: {timeLeft}s / {QR_TIMEOUT_SECONDS}s
            </span>
          </div>
          {timeLeft === 0 ? (
            <button
              onClick={handleResetTimer}
              className="px-2 py-1 bg-[#FFCD00] text-gray-950 text-[10px] font-black rounded uppercase hover:bg-amber-400"
            >
              🔄 Reset Timer (250s)
            </button>
          ) : (
            <span className="text-[10px] font-bold text-gray-400 uppercase">250s Security Limit</span>
          )}
        </div>

        {/* Mode Selector Tabs (Camera vs File Photo vs Quick Tag) */}
        <div className="grid grid-cols-3 gap-1 bg-gray-900 p-1 rounded-lg border border-gray-800">
          <button
            onClick={() => setActiveTab('camera')}
            className={`py-1.5 text-[11px] font-black rounded uppercase transition-all ${activeTab === 'camera' ? 'bg-[#FFCD00] text-gray-950' : 'text-gray-400 hover:text-white'}`}
          >
            📷 Camera
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-1.5 text-[11px] font-black rounded uppercase transition-all ${activeTab === 'upload' ? 'bg-[#FFCD00] text-gray-950' : 'text-gray-400 hover:text-white'}`}
          >
            🖼️ Upload Photo
          </button>
          <button
            onClick={() => setActiveTab('quick')}
            className={`py-1.5 text-[11px] font-black rounded uppercase transition-all ${activeTab === 'quick' ? 'bg-[#FFCD00] text-gray-950' : 'text-gray-400 hover:text-white'}`}
          >
            🏷️ Quick Tags
          </button>
        </div>

        {/* Hidden Div for File Scanner */}
        <div id="reader-upload-tmp" className="hidden"></div>

        {/* TAB 1: Live Hardware Camera Viewfinder */}
        {activeTab === 'camera' && (
          <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden border-2 border-gray-800 flex items-center justify-center">
            <div id="reader" className="w-full h-full object-cover"></div>

            {isScanning && !scanError && (
              <div className="absolute inset-0 pointer-events-none border-4 border-dashed border-[#FFCD00]/50 rounded-xl flex items-center justify-center">
                <div className="w-40 h-40 border-2 border-[#FFCD00] rounded-lg relative flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#FFCD00] shadow-[0_0_15px_#FFCD00] animate-pulse" />
                </div>
              </div>
            )}

            {scanError && (
              <div className="absolute inset-0 bg-gray-950/95 p-md flex flex-col items-center justify-center text-center gap-2">
                <span className="material-symbols-outlined text-4xl text-amber-400">
                  mobile_off
                </span>
                <p className="text-xs text-amber-200 font-bold">Mobile Sandbox Camera Blocked</p>
                <p className="text-[10px] text-gray-400 max-w-xs">
                  Camera permission restricted by mobile sandbox environment. Switch tab above to Upload Photo or Quick Select Tag below:
                </p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="mt-1 px-3 py-1.5 bg-[#FFCD00] text-gray-950 text-xs font-black rounded-lg"
                >
                  🖼️ Upload / Snap Photo Instead
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Mobile File Photo Upload Fallback */}
        {activeTab === 'upload' && (
          <div className="w-full h-64 bg-gray-900 border-2 border-dashed border-gray-700 rounded-xl p-md flex flex-col items-center justify-center text-center gap-md">
            <span className="material-symbols-outlined text-5xl text-[#FFCD00]">
              add_a_photo
            </span>
            <div>
              <p className="text-xs font-bold text-white uppercase">Mobile Camera / File QR Picker</p>
              <p className="text-[10px] text-gray-400 max-w-xs">
                Snap a photo or upload an image file of a QR code tag from your mobile gallery.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={fileScanning}
              className="px-xl py-md bg-[#FFCD00] hover:bg-amber-400 text-gray-950 font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">photo_camera</span>
              {fileScanning ? 'Decoding Photo...' : 'CHOOSE PHOTO / TAKE SNAPSHOT'}
            </button>
          </div>
        )}

        {/* TAB 3: Quick Select Equipment QR Tags */}
        {(activeTab === 'quick' || scanError) && (
          <div className="flex flex-col gap-2 pt-xs">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Instant Equipment QR Tag Selection (Sandbox Testing):
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { tag: 'EX-402', label: 'EX-402 (Excavator Heavy)' },
                { tag: 'CR-110', label: 'CR-110 (Crawler Crane)' },
                { tag: 'BD-088', label: 'BD-088 (Bulldozer D8)' },
                { tag: 'LD-099', label: 'LD-099 (Front Loader)' },
                { tag: 'BK-SAMPLE-01', label: 'BK-SAMPLE-01 (Booking Ref)' },
                { tag: 'BK-SAMPLE-02', label: 'BK-SAMPLE-02 (Booking Ref)' },
              ].map(({ tag, label }) => (
                <button
                  key={tag}
                  onClick={() => handleManualSelect(tag)}
                  className="px-3 py-2 rounded-lg bg-gray-900 hover:bg-[#FFCD00] hover:text-gray-950 text-white text-xs font-bold border border-gray-800 text-left transition-all active:scale-95 flex items-center justify-between"
                >
                  <span>🏷️ {tag}</span>
                  <span className="text-[9px] text-gray-400 font-normal">Scan</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CameraQRScannerModal;
