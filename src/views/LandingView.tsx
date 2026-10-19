import React, { useState } from 'react';
import {
  Truck,
  Search,
  Camera,
  ArrowRight,
  ShieldCheck,
  Zap,
  MapPin,
  Clock,
  QrCode,
  PackageCheck,
  Calculator,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { INDONESIAN_CITIES, SERVICE_OPTIONS } from '../data/cities';
import { calculateTariff, TariffCalculationResult } from '../services/shipmentService';

interface LandingViewProps {
  onNavigate: (tab: string, param?: string) => void;
  onOpenQRScanner: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate, onOpenQRScanner }) => {
  const [trackingInput, setTrackingInput] = useState('');

  // Tariff calculator state
  const [calcOrigin, setCalcOrigin] = useState('DKI Jakarta');
  const [calcDest, setCalcDest] = useState('Kota Bandung');
  const [calcWeight, setCalcWeight] = useState(2);
  const [calcLength, setCalcLength] = useState(20);
  const [calcWidth, setCalcWidth] = useState(15);
  const [calcHeight, setCalcHeight] = useState(10);
  const [calcService, setCalcService] = useState<'REGULER' | 'EXPRESS' | 'CARGO'>('REGULER');

  const tariffResult: TariffCalculationResult = calculateTariff(
    calcOrigin,
    calcDest,
    calcWeight,
    calcLength,
    calcWidth,
    calcHeight,
    calcService
  );

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    onNavigate('lacak', trackingInput.trim().toUpperCase());
  };

  const handleUseTariffToSend = () => {
    onNavigate('kirim', JSON.stringify({ origin: calcOrigin, dest: calcDest, weight: calcWeight }));
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 p-8 md:p-14 text-center lg:text-left shadow-2xl">
        {/* Decorative background glows */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 border border-teal-500/20 px-3.5 py-1.5 text-xs font-semibold text-teal-400">
              <Sparkles className="w-4 h-4" />
              <span>Sistem Ekspedisi Darat Indonesia &bull; Send-Receive Automatic</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Pengiriman Lebih Mudah, Pelacakan Lebih{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                Transparan
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Platform E-Shipment ekspedisi darat modern. Otomasi penerbitan nomor resi, label QR,
              perhitungan ongkos kirim transparan, pelacakan GPS Leaflet live, dan penutupan transaksi
              otomatis saat paket diterima.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={() => onNavigate('kirim')}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-500/25 transition cursor-pointer"
              >
                <span>Kirim Paket Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('lacak')}
                className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-6 py-3.5 text-sm font-bold text-slate-200 hover:text-white transition cursor-pointer"
              >
                <Search className="w-4 h-4 text-teal-400" />
                <span>Lacak Paket</span>
              </button>
              <button
                onClick={() => onNavigate('terima')}
                className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-teal-500/30 px-5 py-3.5 text-sm font-bold text-teal-300 transition cursor-pointer"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Konfirmasi Terima</span>
              </button>
            </div>
          </div>

          {/* Quick Tracking Card on Hero */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 backdrop-blur-md p-6 shadow-xl text-left">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base">Cek Status Resi</h3>
                </div>
                <button
                  onClick={onOpenQRScanner}
                  className="flex items-center gap-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 px-2.5 py-1 text-xs font-semibold text-teal-400 transition"
                  title="Pindai QR Resi"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Scan QR</span>
                </button>
              </div>

              <form onSubmit={handleTrackSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Nomor Resi / AWB
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Misal: LGT-20261019-1001"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 uppercase font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-teal-500 hover:bg-teal-600 py-3 text-sm font-bold text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Lacak Pengiriman</span>
                </button>
              </form>

              {/* Sample Demo Tracking quick click */}
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                <span>Resi Contoh Demo: </span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      setTrackingInput('LGT-20261019-1001');
                      onNavigate('lacak', 'LGT-20261019-1001');
                    }}
                    className="font-mono text-teal-400 hover:underline bg-slate-950 px-2 py-0.5 rounded border border-slate-800"
                  >
                    LGT-20261019-1001 (Baru)
                  </button>
                  <button
                    onClick={() => {
                      setTrackingInput('LGT-20261019-2045');
                      onNavigate('lacak', 'LGT-20261019-2045');
                    }}
                    className="font-mono text-teal-400 hover:underline bg-slate-950 px-2 py-0.5 rounded border border-slate-800"
                  >
                    LGT-20261019-2045 (Transit GPS)
                  </button>
                  <button
                    onClick={() => {
                      setTrackingInput('LGT-20261019-3312');
                      onNavigate('lacak', 'LGT-20261019-3312');
                    }}
                    className="font-mono text-teal-400 hover:underline bg-slate-950 px-2 py-0.5 rounded border border-slate-800"
                  >
                    LGT-20261019-3312 (Terkirim)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kalkulator Ongkir Terpadu */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-10 shadow-xl">
        <div className="max-w-2xl mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400 mb-1">
            <Calculator className="w-4 h-4" />
            <span>Kalkulator Transparan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Hitung Estimasi Ongkir Ekspedisi Darat
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Perhitungan berdasarkan zona tarif terestrial, berat aktual, dan berat volumetrik (P x L x T / 5000)
            yang adil dan transparan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Inputs */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Kota Asal
                </label>
                <select
                  value={calcOrigin}
                  onChange={(e) => setCalcOrigin(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  {INDONESIAN_CITIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.province})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Kota Tujuan
                </label>
                <select
                  value={calcDest}
                  onChange={(e) => setCalcDest(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  {INDONESIAN_CITIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.province})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Weight and Dimensions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Berat (Kg)
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  P (cm)
                </label>
                <input
                  type="number"
                  min={1}
                  value={calcLength}
                  onChange={(e) => setCalcLength(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  L (cm)
                </label>
                <input
                  type="number"
                  min={1}
                  value={calcWidth}
                  onChange={(e) => setCalcWidth(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  T (cm)
                </label>
                <input
                  type="number"
                  min={1}
                  value={calcHeight}
                  onChange={(e) => setCalcHeight(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Service types */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Pilih Jenis Layanan
              </label>
              <div className="grid grid-cols-3 gap-3">
                {SERVICE_OPTIONS.map((srv) => (
                  <button
                    key={srv.type}
                    type="button"
                    onClick={() => setCalcService(srv.type as any)}
                    className={`p-3 rounded-xl border text-left transition ${
                      calcService === srv.type
                        ? 'border-teal-500 bg-teal-500/10 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="font-bold text-xs text-white">{srv.name}</p>
                    <p className="text-[10px] text-teal-400 font-medium">{srv.eta}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rate Output Card */}
          <div className="lg:col-span-5 rounded-2xl border border-teal-500/30 bg-slate-950 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs text-slate-400">Rincian Perhitungan Tarif</span>
              <span className="text-xs font-mono text-teal-400 font-semibold">
                Zona {tariffResult.originZone} &rarr; Zona {tariffResult.destZone}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Berat Aktual:</span>
                <span className="font-semibold text-white">{tariffResult.actualWeightKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span>Berat Volumetrik ({calcLength}x{calcWidth}x{calcHeight}/5000):</span>
                <span className="font-semibold text-white">{tariffResult.volumetricWeightKg} kg</span>
              </div>
              <div className="flex justify-between text-teal-400 font-bold border-t border-slate-800/80 pt-2">
                <span>Berat Tertagih (Pembulatan ke Atas):</span>
                <span>{tariffResult.chargeableWeightKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span>Tarif Dasar per Kg:</span>
                <span className="font-mono text-white">
                  Rp {tariffResult.baseRate.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Faktor Pengali Layanan ({calcService}):</span>
                <span className="font-mono text-white">{tariffResult.multiplier}x</span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-900 p-4 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Total Estimasi Ongkir</p>
                <p className="text-2xl font-black text-white">
                  Rp {tariffResult.shippingCost.toLocaleString('id-ID')}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-teal-500/20 text-teal-300">
                {tariffResult.eta}
              </span>
            </div>

            <button
              onClick={handleUseTariffToSend}
              className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 py-3 text-sm font-bold text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Kirim Paket dengan Rute Ini</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Cara Kerja: Send-Receive Automatic in 3 Steps */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
            Alur Otomatis Tanpa Admin Manual
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Cara Kerja Fitur "Send-Receive Automatic"
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Sistem dirancang mengeliminasi hambatan verifikasi manual. Seluruh tahapan diproses langsung
            oleh logika sistem terdesentralisasi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 hover:border-slate-700 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400 font-black text-lg border border-teal-500/20">
              01
            </div>
            <h3 className="text-lg font-bold text-white">Input & Resi Otomatis</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pengirim mengisi data paket. Ongkir dihitung otomatis, nomor resi unik (LGT-YYYYMMDD-NNNN) dan
              label QR langsung terbit tanpa menunggu input admin.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 hover:border-slate-700 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400 font-black text-lg border border-teal-500/20">
              02
            </div>
            <h3 className="text-lg font-bold text-white">Tracking & Armada GPS</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Kurir memperbarui status secara berurutan. Posisi kurir terpantau via koordinat GPS Leaflet
              dan setiap mutasi status memicu notifikasi in-app otomatis.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 hover:border-slate-700 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400 font-black text-lg border border-teal-500/20">
              03
            </div>
            <h3 className="text-lg font-bold text-white">Konfirmasi & Penutupan Transaksi</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Penerima memvalidasi paket dengan kode konfirmasi 6-digit. Status menjadi Terkirim dan
              transaksi otomatis ditutup sempurna saat itu juga.
            </p>
          </div>
        </div>
      </section>

      {/* Keunggulan Ekspedisi LogiTrack */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 sm:p-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">QR Code & Thermal Label</h4>
              <p className="text-xs text-slate-400 mt-1">
                Format label resi siap cetak dengan QR Code pelacakan cepat via kamera kurir.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Peta Terestrial Leaflet</h4>
              <p className="text-xs text-slate-400 mt-1">
                Visualisasi rute antarkota dan posisi kurir gratis tanpa ketergantungan API berbayar.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Multi Metode Bayar (Simulasi)</h4>
              <p className="text-xs text-slate-400 mt-1">
                Mendukung Virtual Account, QRIS instan, dan Bayar di Tempat (COD) terintegrasi.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Privasi Data Terjamin</h4>
              <p className="text-xs text-slate-400 mt-1">
                Tracking publik memaskir nomor telepon dan alamat sensitif sesuai standar perlindungan data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 pt-8 text-center text-xs text-slate-500 space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
          <button onClick={() => onNavigate('beranda')} className="hover:text-white transition">
            Beranda
          </button>
          <button onClick={() => onNavigate('kirim')} className="hover:text-white transition">
            Kirim Paket
          </button>
          <button onClick={() => onNavigate('lacak')} className="hover:text-white transition">
            Lacak Resi
          </button>
          <button onClick={() => onNavigate('terima')} className="hover:text-white transition">
            Konfirmasi Terima
          </button>
        </div>
        <p className="text-slate-400">
          <strong>LogiTrack</strong> &mdash; Proyek UAS Mata Kuliah E-Business Mahasiswa Program Studi Sistem Informasi.
        </p>
        <p className="text-[11px] text-slate-500">
          Ditenagai oleh React, TypeScript, Tailwind CSS, Leaflet OpenStreetMap, dan Firebase Firestore & Auth.
        </p>
      </footer>
    </div>
  );
};
