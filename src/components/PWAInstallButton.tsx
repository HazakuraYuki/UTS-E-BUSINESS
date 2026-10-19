import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 font-medium text-white shadow-md hover:from-teal-600 hover:to-emerald-600 transition-all ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
        }`}
        title="Pasang LogiTrack di Ponsel Anda"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>Pasang Aplikasi (PWA)</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-2 rounded-xl border border-teal-500/40 bg-teal-500/10 text-teal-300 font-medium hover:bg-teal-500/20 transition-all ${
            compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
          }`}
          title="Pasang di iPhone / iPad"
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          <span>Pasang di iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-teal-400" />
                  <h3 className="font-semibold text-white">Pasang di iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-xs font-bold text-teal-400">
                    1
                  </span>
                  <span>
                    Buka halaman ini di browser <strong>Safari</strong> pada iPhone/iPad Anda.
                  </span>
                </p>
                <p className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-xs font-bold text-teal-400">
                    2
                  </span>
                  <span>
                    Ketuk tombol <strong>Bagikan (Share)</strong> di bilah bawah browser (ikon panah ke atas).
                  </span>
                </p>
                <p className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-xs font-bold text-teal-400">
                    3
                  </span>
                  <span>
                    Gulir ke bawah dan pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
                  </span>
                </p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-slate-800 py-2.5 text-sm font-medium text-white hover:bg-slate-700 transition"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback info button for desktop or other browsers
  return null;
};
