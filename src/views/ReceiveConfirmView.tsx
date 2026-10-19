import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import { confirmReceiptByCode } from '../services/shipmentService';
import { Shipment } from '../types';

interface ReceiveConfirmViewProps {
  initialCode?: string;
  initialTracking?: string;
  onNavigate: (tab: string, param?: string) => void;
}

export const ReceiveConfirmView: React.FC<ReceiveConfirmViewProps> = ({
  initialCode = '',
  initialTracking = '',
  onNavigate,
}) => {
  // Support either separate props or combined param 'resi|code'
  let parsedResi = initialTracking;
  let parsedCode = initialCode;
  if (initialCode && initialCode.includes('|')) {
    const parts = initialCode.split('|');
    parsedResi = parts[0];
    parsedCode = parts[1];
  } else if (initialCode && initialCode.startsWith('LGT-')) {
    parsedResi = initialCode;
    parsedCode = '';
  }

  const [trackingNumber, setTrackingNumber] = useState(parsedResi);
  const [code, setCode] = useState(parsedCode);
  const [recipientName, setRecipientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successShipment, setSuccessShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    if (initialCode && initialCode.includes('|')) {
      const parts = initialCode.split('|');
      setTrackingNumber(parts[0]);
      setCode(parts[1]);
    } else if (initialCode && initialCode.startsWith('LGT-')) {
      setTrackingNumber(initialCode);
    } else if (initialCode) {
      setCode(initialCode);
    }
    if (initialTracking) {
      setTrackingNumber(initialTracking);
    }
  }, [initialCode, initialTracking]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setErrorMsg('Mohon masukkan nomor resi paket (misal: LGT-20261019-4409).');
      return;
    }
    if (!code.trim()) {
      setErrorMsg('Mohon masukkan kode konfirmasi rahasia penerima.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await confirmReceiptByCode(
        trackingNumber.trim().toUpperCase(),
        code.trim().toUpperCase(),
        recipientName.trim()
      );
      setSuccessShipment(res);
    } catch (err: unknown) {
      let message = 'Nomor resi atau kode konfirmasi tidak cocok, atau paket belum dalam pengantaran.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          message = parsed.error || err.message;
        } catch {
          message = err.message;
        }
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3.5 py-1.5 text-xs font-semibold text-teal-400 border border-teal-500/20 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Konfirmasi Penerimaan Paket Mandiri</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Konfirmasi Paket Diterima</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Penerima dapat menutup transaksi pengiriman secara langsung dengan memasukkan kode verifikasi 6-digit rahasia.
        </p>
      </div>

      {successShipment ? (
        <div className="rounded-3xl border border-emerald-500/40 bg-slate-900 p-8 shadow-2xl text-slate-100 text-center space-y-5 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">Terima Kasih! Paket Telah Dikonfirmasi</h2>
            <p className="text-xs text-slate-300 mt-1">
              Pengiriman dengan resi <strong className="font-mono text-teal-300">{successShipment.trackingNumber}</strong> telah resmi ditutup dengan status <strong>Terkirim</strong>.
            </p>
          </div>

          <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Penerima Terverifikasi:</span>
              <span className="font-bold text-white">{successShipment.receiverName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Kota Tujuan:</span>
              <span className="text-white">{successShipment.receiverCity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Waktu Penyelesaian:</span>
              <span className="text-white">
                {successShipment.deliveredAt
                  ? new Date(successShipment.deliveredAt).toLocaleString('id-ID')
                  : new Date().toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-teal-400 font-bold border-t border-slate-800 pt-2">
              <span>Status Transaksi:</span>
              <span>Otomatis Selesai (Closed)</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => onNavigate('lacak', successShipment.trackingNumber)}
              className="rounded-xl bg-teal-500 hover:bg-teal-600 px-5 py-2.5 text-xs font-bold text-white transition"
            >
              Lihat Timeline Pelacakan
            </button>
            <button
              onClick={() => {
                setSuccessShipment(null);
                setCode('');
              }}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 transition"
            >
              Konfirmasi Paket Lain
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-xl text-slate-100">
          {errorMsg && (
            <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs text-red-300 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleConfirm} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Nomor Resi Paket (AWB)
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: LGT-20261019-4409"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 uppercase"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Kode Konfirmasi Rahasia Penerima
              </label>
              <input
                type="text"
                required
                maxLength={16}
                placeholder="Kode Konfirmasi (Misal: KODE4409OK)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-center text-xl sm:text-2xl font-mono font-black tracking-widest text-teal-300 placeholder-slate-600 focus:outline-none focus:border-teal-500 shadow-inner uppercase"
              />
              <p className="text-[11px] text-slate-400 mt-2">
                * Kode rahasia diberikan oleh pengirim atau tertera pada akun pengirim saat paket dipesan.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Nama Penerima Paket (Opsional)
              </label>
              <input
                type="text"
                placeholder="Nama Anda yang menerima barang"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <span>
                Dengan menekan tombol di bawah, Anda mengonfirmasi bahwa paket fisik telah sampai dalam
                kondisi baik. Sistem otomatis mencatat konfirmasi penerimaan dan mengirimkan notifikasi
                ke pengirim.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || code.length < 4 || !trackingNumber.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 disabled:opacity-50 py-3.5 text-sm font-black text-white shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Memverifikasi Kode...</span>
              ) : (
                <>
                  <PackageCheck className="w-5 h-5" />
                  <span>Paket Sudah Saya Terima</span>
                </>
              )}
            </button>
          </form>

          {/* Quick test codes from demo data */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
            <span>Uji Coba Cepat Data Demo: </span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setTrackingNumber('LGT-20261019-4409');
                  setCode('KODE4409OK');
                }}
                className="font-mono text-teal-400 hover:underline bg-slate-950 px-2 py-0.5 rounded border border-slate-800"
              >
                LGT-20261019-4409 &bull; KODE4409OK (Sedang Diantar)
              </button>
              <button
                onClick={() => {
                  setTrackingNumber('LGT-20261019-2045');
                  setCode('KODE2045OK');
                }}
                className="font-mono text-teal-400 hover:underline bg-slate-950 px-2 py-0.5 rounded border border-slate-800"
              >
                LGT-20261019-2045 &bull; KODE2045OK (Dalam Perjalanan)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
