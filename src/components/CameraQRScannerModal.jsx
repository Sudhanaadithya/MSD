import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const CameraQRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [scanError, setScanError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    let html5QrcodeScanner = null;

    async function initScanner() {
      try {
        setScanError(null);
        setIsScanning(true);

        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available
          const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')) || devices[0];
          setSelectedCameraId(backCam.id);

          html5QrcodeScanner = new Html5Qrcode("reader");
          scannerRef.current = html5QrcodeScanner;

          await html5QrcodeScanner.start(
            backCam.id,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText, decodedResult) => {
              // Play success audio beep
              try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                osc.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
              } catch (e) {}

              // Stop scanner & trigger success callback
              if (html5QrcodeScanner && html5QrcodeScanner.isScanning) {
                html5QrcodeScanner.stop().catch(() => {});
              }
              onScanSuccess(decodedText, decodedResult);
              onClose();
            },
            (errorMessage) => {
              // Frame decoding noise (ignored)
            }
          );
        } else {
          setScanError('No camera devices found on this hardware.');
          setIsScanning(false);
        }
      } catch (err) {
        console.warn('QR Camera Scanner initialization notice:', err);
        setScanError(`Camera Access Notice: ${err.message || 'Camera blocked or unsupported in sandbox'}`);
        setIsScanning(false);
      }
    }

    initScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isOpen]);

  const handleCameraChange = async (e) => {
    const newCamId = e.target.value;
    setSelectedCameraId(newCamId);

    if (scannerRef.current) {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      await scannerRef.current.start(
        newCamId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText, decodedResult) => {
          onScanSuccess(decodedText, decodedResult);
          onClose();
        },
        () => {}
      );
    }
  };

  const handleManualSelect = (assetId) => {
    onScanSuccess(assetId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-md animate-fade-in">
      <div className="bg-gray-900 border-2 border-[#FFCD00] text-white rounded-2xl p-lg max-w-lg w-full shadow-2xl flex flex-col gap-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FFCD00] text-2xl">
              qr_code_scanner
            </span>
            <h3 className="text-lg font-black tracking-wide text-white">
              Employee Rapid QR Scanner
            </h3>
          </div>
          <button
            onClick={() => {
              if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(() => {});
              }
              onClose();
            }}
            className="text-gray-400 hover:text-[#FFCD00] text-xl font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Live Camera Viewfinder Container */}
        <div className="relative w-full h-72 bg-black rounded-xl overflow-hidden border-2 border-gray-700 flex items-center justify-center">
          <div id="reader" className="w-full h-full object-cover"></div>

          {/* Fallback & Laser overlay */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none border-4 border-dashed border-[#FFCD00]/50 rounded-xl flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-[#FFCD00] rounded-lg relative flex items-center justify-center">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#FFCD00] shadow-[0_0_15px_#FFCD00] animate-pulse" />
              </div>
            </div>
          )}

          {scanError && (
            <div className="absolute inset-0 bg-gray-950/90 p-md flex flex-col items-center justify-center text-center gap-2">
              <span className="material-symbols-outlined text-4xl text-amber-400">
                no_photography
              </span>
              <p className="text-xs text-amber-200 font-semibold">{scanError}</p>
              <p className="text-[10px] text-gray-400">Select sample equipment tag below to continue logistics workflow:</p>
            </div>
          )}
        </div>

        {/* Camera Selector */}
        {cameras.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Camera:</label>
            <select
              value={selectedCameraId}
              onChange={handleCameraChange}
              className="bg-gray-800 text-white text-xs font-bold rounded p-1.5 border border-gray-700 outline-none flex-1"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label || `Camera ${c.id}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quick Tag Selector Buttons (Instant Fallback for testing) */}
        <div className="flex flex-col gap-1.5 pt-sm border-t border-gray-800">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Quick Test Equipment QR Tags:
          </span>
          <div className="flex flex-wrap gap-2">
            {['EX-402', 'CR-110', 'BD-088', 'LD-099', 'GR-201'].map((tag) => (
              <button
                key={tag}
                onClick={() => handleManualSelect(tag)}
                className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-[#FFCD00] hover:text-gray-950 text-white text-xs font-bold border border-gray-700 transition-all active:scale-95"
              >
                🏷️ {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraQRScannerModal;
