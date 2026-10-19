import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import {
  Shield,
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Download,
  Filter,
  Camera,
  MapPin,
  Clock,
  UserPlus,
  XCircle,
  FileSpreadsheet,
  Settings,
  ChevronDown,
  Database,
  RefreshCw,
} from 'lucide-react';
import { db } from '../lib/firebase';
import { Shipment, ShipmentStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { markShipmentException } from '../services/shipmentService';
import { seedDemoDataIfEmpty } from '../services/seedService';
import { TrackingMap } from '../components/TrackingMap';
import { INDONESIAN_CITIES, ZONE_BASE_RATES } from '../data/cities';

interface AdminDashboardViewProps {
  onOpenQRScanner: () => void;
  onNavigate: (tab: string, param?: string) => void;
  onOpenLabel: (shipment: Shipment) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onOpenQRScanner,
  onNavigate,
  onOpenLabel,
}) => {
  const { profile } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Detail modal
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  // Exception modal
  const [exceptionModalShipment, setExceptionModalShipment] = useState<Shipment | null>(null);
  const [exceptionType, setExceptionType] = useState<'Gagal Kirim' | 'Dibatalkan'>('Gagal Kirim');
  const [exceptionReason, setExceptionReason] = useState('');
  const [isSubmittingException, setIsSubmittingException] = useState(false);

  // Courier Assignment modal
  const [assignModalShipment, setAssignModalShipment] = useState<Shipment | null>(null);
  const [selectedCourierName, setSelectedCourierName] = useState('Budi Santoso');

  // Tariff settings view modal
  const [showTariffSettings, setShowTariffSettings] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedDemo = async () => {
    if (isSeeding) return;
    const confirmAction = window.confirm(
      'Apakah Anda ingin menginisialisasi / memperbarui akun demo, matriks tarif, dan paket contoh?'
    );
    if (!confirmAction) return;

    setIsSeeding(true);
    try {
      const ok = await seedDemoDataIfEmpty(true);
      if (ok) {
        alert('Data demo & matriks tarif berhasil diinisialisasi ke Firestore!');
      } else {
        alert('Data demo sudah ada atau tidak ada perubahan.');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal inisialisasi data demo');
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    try {
      const q = query(collection(db, 'shipments'));
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shipment));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setShipments(list);
          setLoading(false);
        },
        (err) => {
          console.warn('Admin shipments snapshot error:', err);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn(e);
      setLoading(false);
    }
  }, []);

  // Filtered List
  const filteredShipments = shipments.filter((shp) => {
    const matchesSearch =
      shp.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shp.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shp.receiverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shp.senderCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shp.receiverCity.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || shp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPI Statistics
  const totalShipments = shipments.length;
  const registeredCount = shipments.filter((s) => s.status === 'Paket Terdaftar').length;
  const inTransitCount = shipments.filter(
    (s) => s.status === 'Dijemput' || s.status === 'Di Gudang' || s.status === 'Dalam Perjalanan' || s.status === 'Sedang Diantar'
  ).length;
  const deliveredCount = shipments.filter((s) => s.status === 'Terkirim').length;
  const totalRevenue = shipments.reduce((sum, s) => sum + (s.shippingCost || 0), 0);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'No Resi',
      'Tanggal',
      'Pengirim',
      'Kota Asal',
      'Penerima',
      'Kota Tujuan',
      'Layanan',
      'Berat (Kg)',
      'Ongkir (IDR)',
      'Metode Bayar',
      'Status Bayar',
      'Status Pengiriman',
      'Kurir',
    ];

    const rows = filteredShipments.map((s) => [
      `"${s.trackingNumber}"`,
      `"${new Date(s.createdAt).toLocaleDateString('id-ID')}"`,
      `"${s.senderName}"`,
      `"${s.senderCity}"`,
      `"${s.receiverName}"`,
      `"${s.receiverCity}"`,
      `"${s.serviceType}"`,
      `"${s.chargeableWeightKg}"`,
      `"${s.shippingCost}"`,
      `"${s.paymentMethod}"`,
      `"${s.paymentStatus}"`,
      `"${s.status}"`,
      `"${s.assignedCourierName || 'Belum Ditugaskan'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LogiTrack_Laporan_Pengiriman_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit Exception (Gagal Kirim / Dibatalkan)
  const handleSubmitException = async () => {
    if (!exceptionModalShipment || !exceptionReason.trim()) {
      alert('Mohon masukkan alasan kendala pengiriman.');
      return;
    }
    setIsSubmittingException(true);
    try {
      await markShipmentException(
        exceptionModalShipment,
        exceptionType,
        exceptionReason.trim(),
        profile?.displayName || 'Admin Ekspedisi'
      );
      setExceptionModalShipment(null);
      setExceptionReason('');
      alert(`Status berhasil diperbarui menjadi ${exceptionType}`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Gagal memperbarui status kendala');
    } finally {
      setIsSubmittingException(false);
    }
  };

  // Assign Courier
  const handleAssignCourier = async () => {
    if (!assignModalShipment) return;
    try {
      await updateDoc(doc(db, 'shipments', assignModalShipment.id), {
        assignedCourierName: selectedCourierName,
        assignedCourierId: selectedCourierName.includes('Budi') ? 'demo_user_courier_01' : 'courier_general',
        updatedAt: new Date().toISOString(),
      });
      setAssignModalShipment(null);
      alert(`Kurir ${selectedCourierName} berhasil ditugaskan ke resi ${assignModalShipment.trackingNumber}`);
    } catch (e) {
      console.error(e);
      alert('Gagal menugaskan kurir');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400">
                Pusat Kontrol Ekspedisi Darat
              </span>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-bold">
                Admin
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Dashboard Operasional</h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={onOpenQRScanner}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2.5 text-xs font-semibold text-teal-400 transition cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Scan QR Resi</span>
          </button>
          <button
            onClick={handleSeedDemo}
            disabled={isSeeding}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-teal-500/30 px-3.5 py-2.5 text-xs font-semibold text-teal-300 transition cursor-pointer disabled:opacity-50"
            title="Muat data contoh pengiriman & tarif standar"
          >
            {isSeeding ? (
              <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
            ) : (
              <Database className="w-4 h-4 text-teal-400" />
            )}
            <span>{isSeeding ? 'Memproses...' : 'Seed Data Demo'}</span>
          </button>
          <button
            onClick={() => setShowTariffSettings(!showTariffSettings)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Matriks Tarif</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase">Total Paket</span>
            <Package className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{totalShipments}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Seluruh riwayat order</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase">Terdaftar</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-400">{registeredCount}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Antrean penjemputan</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase">Dalam Transit</span>
            <Truck className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-sky-400">{inTransitCount}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Armada jalan & antar</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase">Terkirim</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400">{deliveredCount}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Selesai terkonfirmasi</span>
        </div>

        <div className="col-span-2 lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase">Total Nilai</span>
            <FileSpreadsheet className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-lg sm:text-xl font-black text-white">
            Rp {(totalRevenue / 1000).toFixed(0)}k
          </p>
          <span className="text-[11px] text-teal-400 mt-1 block">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Tariff Settings Sub-panel if opened */}
      {showTariffSettings && (
        <div className="rounded-3xl border border-teal-500/40 bg-slate-900 p-6 space-y-4 animate-in fade-in duration-200 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Settings className="w-5 h-5 text-teal-400" />
              <span>Matriks Tarif & Penetapan Zona Ekspedisi Darat</span>
            </h3>
            <button
              onClick={() => setShowTariffSettings(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Tutup
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="font-bold text-white mb-2">Tarif Dasar Zona Terestrial (IDR / Kg):</p>
              <div className="grid grid-cols-4 gap-2 text-center font-mono">
                {['A', 'B', 'C', 'D'].map((z1) =>
                  ['A', 'B', 'C', 'D'].map((z2) => (
                    <div key={`${z1}-${z2}`} className="bg-slate-900 p-1.5 rounded border border-slate-800">
                      <span className="text-[9px] text-slate-500">{z1}&rarr;{z2}</span>
                      <p className="text-teal-300 font-bold">{ZONE_BASE_RATES[z1]?.[z2] / 1000}k</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <p className="font-bold text-white mb-1">Cakupan Wilayah Kota Bawaan:</p>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {INDONESIAN_CITIES.map((c) => (
                  <div key={c.id} className="flex justify-between text-slate-300 text-[11px]">
                    <span>{c.name} ({c.province})</span>
                    <span className="font-mono text-teal-400 font-bold">Zona {c.zone}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipments Table with Search & Filters */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari resi, nama pengirim, penerima, atau kota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="Paket Terdaftar">Paket Terdaftar</option>
              <option value="Dijemput">Dijemput</option>
              <option value="Di Gudang">Di Gudang</option>
              <option value="Dalam Perjalanan">Dalam Perjalanan</option>
              <option value="Sedang Diantar">Sedang Diantar</option>
              <option value="Terkirim">Terkirim</option>
              <option value="Gagal Kirim">Gagal Kirim</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Nomor Resi</th>
                <th className="py-3 px-3">Rute</th>
                <th className="py-3 px-3">Penerima</th>
                <th className="py-3 px-3">Layanan</th>
                <th className="py-3 px-3">Ongkir</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Kurir</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Tidak ditemukan data pengiriman yang cocok.
                  </td>
                </tr>
              ) : (
                filteredShipments.map((shp) => (
                  <tr key={shp.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-teal-300 whitespace-nowrap">
                      {shp.trackingNumber}
                      {shp.isDemo && (
                        <span className="ml-1.5 text-[9px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded">
                          Demo
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-white font-medium">{shp.senderCity}</span>
                      <span className="text-slate-500 mx-1">&rarr;</span>
                      <span className="text-white font-medium">{shp.receiverCity}</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-200">
                      {shp.receiverName}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-300">{shp.serviceType}</span>
                      <span className="text-slate-500 text-[10px] block">
                        {shp.chargeableWeightKg} Kg
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-white">
                      Rp {shp.shippingCost.toLocaleString('id-ID')}
                      <span className="text-[10px] text-slate-400 block">{shp.paymentStatus}</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          shp.status === 'Terkirim'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : shp.status === 'Gagal Kirim' || shp.status === 'Dibatalkan'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-teal-500/20 text-teal-300'
                        }`}
                      >
                        {shp.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {shp.assignedCourierName ? (
                        <span className="text-emerald-400 font-medium">
                          {shp.assignedCourierName}
                        </span>
                      ) : (
                        <button
                          onClick={() => setAssignModalShipment(shp)}
                          className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Tugaskan</span>
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedShipment(shp)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                          title="Lihat Detail & Peta"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => onOpenLabel(shp)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 transition"
                          title="Cetak Label Resi"
                        >
                          Label
                        </button>
                        {shp.status !== 'Terkirim' && shp.status !== 'Dibatalkan' && (
                          <button
                            onClick={() => {
                              setExceptionModalShipment(shp);
                              setExceptionType('Gagal Kirim');
                            }}
                            className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                            title="Tandai Kendala / Batal"
                          >
                            Kendala
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipment Detail & Map Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-400">
                  Detail Paket Operasional
                </span>
                <h3 className="font-mono font-bold text-lg text-white">
                  {selectedShipment.trackingNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedShipment(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <TrackingMap
                origin={selectedShipment.originCoords}
                destination={selectedShipment.destinationCoords}
                courierLocation={selectedShipment.currentCourierLocation}
                height="240px"
              />

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500">Pengirim:</span>
                  <p className="font-bold text-white">{selectedShipment.senderName}</p>
                  <p className="text-slate-400">{selectedShipment.senderAddress}, {selectedShipment.senderCity}</p>
                </div>
                <div>
                  <span className="text-slate-500">Penerima:</span>
                  <p className="font-bold text-white">{selectedShipment.receiverName}</p>
                  <p className="text-slate-400">{selectedShipment.receiverAddress}, {selectedShipment.receiverCity}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Kode Konfirmasi</span>
                  <span className="font-mono font-bold text-teal-400 text-sm">{selectedShipment.confirmationCode}</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Status Bayar</span>
                  <span className="font-bold text-emerald-400 text-xs">{selectedShipment.paymentStatus}</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Kurir Ditugaskan</span>
                  <span className="font-bold text-sky-400 text-xs">{selectedShipment.assignedCourierName || 'Belum Ada'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  onOpenLabel(selectedShipment);
                  setSelectedShipment(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
              >
                Cetak Label Resi
              </button>
              <button
                onClick={() => setSelectedShipment(null)}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-xs font-semibold text-white transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Courier Modal */}
      {assignModalShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100 space-y-4">
            <h3 className="font-bold text-base text-white">Tugaskan Kurir Armada</h3>
            <p className="text-xs text-slate-400">
              Resi: <strong className="font-mono text-teal-300">{assignModalShipment.trackingNumber}</strong>
            </p>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Pilih Kurir:</label>
              <select
                value={selectedCourierName}
                onChange={(e) => setSelectedCourierName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              >
                <option value="Budi Santoso">Budi Santoso (Kurir Demo)</option>
                <option value="Ahmad Dahlan">Ahmad Dahlan (Armada Darat Jawa)</option>
                <option value="Rian Hidayat">Rian Hidayat (Kurir Lokal)</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setAssignModalShipment(null)}
                className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs text-slate-300 transition"
              >
                Batal
              </button>
              <button
                onClick={handleAssignCourier}
                className="flex-1 rounded-xl bg-teal-500 hover:bg-teal-600 py-2.5 text-xs font-bold text-white transition"
              >
                Simpan Tugas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exception Modal (Gagal Kirim / Batal) */}
      {exceptionModalShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base text-white">Catat Kendala Pengiriman</h3>
            </div>
            <p className="text-xs text-slate-400">
              Menandai status khusus pada nomor resi{' '}
              <strong className="font-mono text-white">{exceptionModalShipment.trackingNumber}</strong>.
            </p>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Jenis Kendala:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExceptionType('Gagal Kirim')}
                  className={`py-2 text-xs font-bold rounded-lg border transition ${
                    exceptionType === 'Gagal Kirim'
                      ? 'border-red-500 bg-red-500/20 text-red-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  Gagal Kirim
                </button>
                <button
                  type="button"
                  onClick={() => setExceptionType('Dibatalkan')}
                  className={`py-2 text-xs font-bold rounded-lg border transition ${
                    exceptionType === 'Dibatalkan'
                      ? 'border-red-500 bg-red-500/20 text-red-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  Dibatalkan
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Alasan Kendala (Wajib Diisi):</label>
              <textarea
                rows={3}
                required
                placeholder="Contoh: Penerima tidak berada di tempat setelah 3x percobaan, alamat tidak lengkap, atau permintaan pembatalan pengirim."
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-100 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExceptionModalShipment(null)}
                className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs text-slate-300 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmittingException || !exceptionReason.trim()}
                onClick={handleSubmitException}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 py-2.5 text-xs font-bold text-white transition"
              >
                {isSubmittingException ? 'Menyimpan...' : 'Tandai Kendala'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
