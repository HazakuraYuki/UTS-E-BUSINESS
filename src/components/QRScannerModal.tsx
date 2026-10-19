import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Pindai QR Resi Paket',
}) => {
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = 'html5qr-code-full-region';

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    let isMounted = true;
    setCameraError(null);

    const startScanner = async () => {
      try {
        // Small delay to ensure DOM element is mounted
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (!isMounted) return;

        const html5QrCode = new Html5Qrcode(elementId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Clean URL or tracking format
            let cleanResult = decodedText.trim();
            if (cleanResult.includes('/lacak/')) {
              cleanResult = cleanResult.split('/lacak/')[1] || cleanResult;
            } else if (cleanResult.includes('resi=')) {
              cleanResult = cleanResult.split('resi=')[1] || cleanResult;
            }
            onScanSuccess(cleanResult);
            stopScanner();
            onClose();
          },
          () => {
            // Scanning in progress, frame did not contain QR
          }
        );

        if (isMounted) {
          setIsScanning(true);
        }
      } catch (err: unknown) {
        console.warn('Camera error or permission denied:', err);
        if (isMounted) {
          setIsScanning(false);
          const errString = err instanceof Error ? err.message : String(err);
          if (errString.includes('Permission') || errString.includes('NotAllowedError')) {
            setCameraError(
              'Izin kamera ditolak oleh browser. Mohon izinkan akses kamera di pengaturan browser Anda, atau gunakan input resi manual di bawah.'
            );
          } else {
            setCameraError(
              'Kamera tidak dapat diakses atau perangkat tidak memiliki kamera aktif. Akses kamera membutuhkan koneksi aman (HTTPS).'
            );
          }
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      }
    } catch (e) {
      console.warn('Error stopping scanner:', e);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    onScanSuccess(manualInput.trim().toUpperCase());
    stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{title}</h3>
              <p className="text-xs text-slate-400">Arahkan kamera ke QR Code label resi</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video / Camera Viewport */}
        <div className="mt-4 flex flex-col items-center justify-center">
          <div
            id={elementId}
            className="w-full max-w-[280px] h-[280px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center relative"
          >
            {!isScanning && !cameraError && (
              <div className="text-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Menginisialisasi kamera...</p>
              </div>
            )}
          </div>

          {/* Camera Error Message & HTTPS Notice */}
          {cameraError && (
            <div className="mt-4 w-full rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300 mb-1">Peringatan Izin Kamera</p>
                <p>{cameraError}</p>
                <p className="mt-1 text-[11px] text-amber-300/80">
                  Tip: Anda tetap dapat melacak paket dengan memasukkan nomor resi pada kolom di bawah.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Manual Fallback Input */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Atau Ketik Nomor Resi Manual
          </p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Contoh: LGT-20261019-1001"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 uppercase"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition shadow-sm"
            >
              <span>Buka</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
