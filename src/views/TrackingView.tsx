import React, { useState, useEffect } from 'react';
import {
  Search,
  Camera,
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  Package,
  Calendar,
  Lock,
} from 'lucide-react';
import { fetchShipmentByTrackingNumber, STATUS_SEQUENCE } from '../services/shipmentService';
import { Shipment, ShipmentEvent } from '../types';
import { TrackingMap } from '../components/TrackingMap';

interface TrackingViewProps {
  initialTrackingNumber?: string;
  onOpenQRScanner: () => void;
  onNavigate: (tab: string, param?: string) => void;
}

export const TrackingView: React.FC<TrackingViewProps> = ({
  initialTrackingNumber = '',
  onOpenQRScanner,
  onNavigate,
}) => {
  const [searchInput, setSearchInput] = useState(initialTrackingNumber);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [events, setEvents] = useState<ShipmentEvent[]>([]);

  useEffect(() => {
    if (initialTrackingNumber) {
      setSearchInput(initialTrackingNumber);
      handleTrack(initialTrackingNumber);
    }
  }, [initialTrackingNumber]);

  const handleTrack = async (resi: string) => {
    if (!resi.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetchShipmentByTrackingNumber(resi);
      setShipment(res.shipment);
      setEvents(res.events);
    } catch (err) {
      console.error(err);
      setShipment(null);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTrack(searchInput);
  };

  // Helper to mask sensitive PII for public tracking
  const maskPhone = (phone?: string) => {
    if (!phone) return '08**********';
    if (phone.length <= 6) return phone.slice(0, 2) + '****';
    return phone.slice(0, 4) + '****' + phone.slice(-3);
  };

  const maskAddress = (address?: string) => {
    if (!address) return 'Alamat Terlindungi';
    const parts = address.split(',');
    if (parts.length > 1) {
      return `${parts[0].slice(0, 10)}... (Alamat detail terlindungi privasi)`;
    }
    return `${address.slice(0, 8)}... (Alamat detail terlindungi)`;
  };

  const getStatusStepIndex = (status: string) => {
    return STATUS_SEQUENCE.indexOf(status as any);
  };

  const currentStepIdx = shipment ? getStatusStepIndex(shipment.status) : 0;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8">
      {/* Search Header */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <h1 className="text-2xl sm:text-4xl font-black text-white">Lacak Pengiriman Real-Time</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Masukkan nomor resi atau pindai kode QR label untuk memantau perjalanan paket darat Anda secara transparan.
        </p>

        <form onSubmit={handleFormSubmit} className="flex gap-2 pt-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Masukkan Nomor Resi (misal: LGT-20261019-1001)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 uppercase font-mono shadow-inner"
            />
          </div>
          <button
            type="button"
            onClick={onOpenQRScanner}
            className="flex items-center gap-1 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-3 text-xs font-semibold text-teal-400 transition"
            title="Scan QR dari Kamera"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Pindai QR</span>
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl bg-teal-500 hover:bg-teal-600 disabled:opacity-50 px-5 py-3 text-xs font-bold text-white shadow-md transition cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Lacak</span>
          </button>
        </form>

        {/* Quick demo tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 pt-1">
          <span>Contoh resi pengujian:</span>
          <button
            onClick={() => {
              setSearchInput('LGT-20261019-1001');
              handleTrack('LGT-20261019-1001');
            }}
            className="font-mono text-teal-400 hover:underline bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800"
          >
            LGT-20261019-1001
          </button>
          <button
            onClick={() => {
              setSearchInput('LGT-20261019-2045');
              handleTrack('LGT-20261019-2045');
            }}
            className="font-mono text-teal-400 hover:underline bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800"
          >
            LGT-20261019-2045 (GPS Aktif)
          </button>
          <button
            onClick={() => {
              setSearchInput('LGT-20261019-3312');
              handleTrack('LGT-20261019-3312');
            }}
            className="font-mono text-teal-400 hover:underline bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800"
          >
            LGT-20261019-3312 (Terkirim)
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-16 text-center text-slate-400">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-400 mx-auto mb-3" />
          <p className="text-sm font-semibold">Mengambil data pelacakan dari Firestore...</p>
        </div>
      )}

      {/* Not Found State */}
      {!loading && searched && !shipment && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400 max-w-md mx-auto space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Resi Tidak Ditemukan</h3>
          <p className="text-xs text-slate-400">
            Nomor resi <strong className="text-slate-200">{searchInput}</strong> belum terdaftar dalam sistem.
            Pastikan format resi benar (misal: LGT-YYYYMMDD-XXXX) atau coba klik tombol resi contoh di atas.
          </p>
        </div>
      )}

      {/* Shipment Found: Details & Map */}
      {!loading && shipment && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Status Header Banner */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 md:p-8 shadow-xl text-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Nomor Resi / AWB
                </span>
                <p className="text-2xl sm:text-3xl font-black font-mono text-teal-300">
                  {shipment.trackingNumber}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Layanan: <strong className="text-white">{shipment.serviceType}</strong> &bull; Berat:{' '}
                  <strong className="text-white">{shipment.chargeableWeightKg} Kg</strong>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                  Status Terkini
                </span>
                <span
                  className={`inline-block px-4 py-1.5 rounded-full text-xs font-black tracking-wide ${
                    shipment.status === 'Terkirim'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : shipment.status === 'Gagal Kirim' || shipment.status === 'Dibatalkan'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'bg-teal-500/20 text-teal-300 border border-teal-500/40 animate-pulse'
                  }`}
                >
                  {shipment.status}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pembaruan terakhir: {new Date(shipment.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </p>
              </div>
            </div>

            {/* Visual Step Progress Bar */}
            <div className="pt-6">
              <div className="hidden md:grid grid-cols-6 gap-2 text-center text-xs">
                {STATUS_SEQUENCE.map((s, idx) => {
                  const isDone = currentStepIdx >= idx && currentStepIdx !== -1;
                  const isCurrent = currentStepIdx === idx;
                  return (
                    <div key={s} className="relative">
                      <div
                        className={`h-2 rounded-full mb-2 transition-all ${
                          isDone
                            ? 'bg-gradient-to-r from-teal-500 to-emerald-500'
                            : 'bg-slate-800'
                        }`}
                      />
                      <span
                        className={`block text-[11px] font-semibold truncate ${
                          isCurrent
                            ? 'text-teal-300 font-bold'
                            : isDone
                            ? 'text-slate-300'
                            : 'text-slate-600'
                        }`}
                      >
                        {s}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Safe masked routing information */}
            <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500">Asal Pengiriman</span>
                <p className="font-bold text-white text-base mt-0.5">{shipment.senderCity}</p>
                <p className="text-slate-400 mt-1">{maskAddress(shipment.senderAddress)}</p>
                <div className="mt-2 flex items-center gap-1.5 text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pengirim: {shipment.senderName} ({maskPhone(shipment.senderPhone)})</span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500">Tujuan Pengiriman</span>
                <p className="font-bold text-white text-base mt-0.5">{shipment.receiverCity}</p>
                <p className="text-slate-400 mt-1">{maskAddress(shipment.receiverAddress)}</p>
                <div className="mt-2 flex items-center gap-1.5 text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Penerima: {shipment.receiverName} ({maskPhone(shipment.receiverPhone)})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Leaflet Interactive Map */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-base">Peta Perjalanan Darat Real-Time</h3>
              </div>
              {shipment.currentCourierLocation?.cityName && (
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  Posisi Kurir: {shipment.currentCourierLocation.cityName}
                </span>
              )}
            </div>

            <TrackingMap
              origin={shipment.originCoords}
              destination={shipment.destinationCoords}
              courierLocation={shipment.currentCourierLocation}
              height="380px"
            />
          </div>

          {/* Timeline of events from database */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 md:p-8 shadow-xl text-slate-100">
            <h3 className="text-base font-bold text-white pb-4 border-b border-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-400" />
              <span>Riwayat Perjalanan Paket (Audit Log)</span>
            </h3>

            <div className="mt-6 space-y-6 pl-4 border-l-2 border-slate-800 relative">
              {events.length === 0 ? (
                <p className="text-xs text-slate-400">Belum ada catatan riwayat peristiwa.</p>
              ) : (
                events.map((evt, idx) => (
                  <div key={evt.id || idx} className="relative group">
                    {/* Bullet */}
                    <div className="absolute -left-[25px] top-1 h-4 w-4 rounded-full bg-slate-900 border-2 border-teal-400 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-white text-sm">{evt.title}</span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(evt.timestamp).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })} WIB
                        </span>
                      </div>

                      <p className="text-slate-300 leading-relaxed">{evt.description}</p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                        <span>Lokasi: <strong className="text-slate-400">{evt.location}</strong></span>
                        {evt.updatedByName && (
                          <span>Oleh: <strong className="text-slate-400">{evt.updatedByName}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
