import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import {
  Truck,
  MapPin,
  CheckCircle2,
  Camera,
  Navigation,
  ArrowRight,
  PackageCheck,
  AlertCircle,
  Phone,
  Clock,
  ShieldAlert,
  ChevronRight,
  DollarSign,
  UserCheck,
  Package,
  Sparkles,
} from 'lucide-react';
import { db } from '../lib/firebase';
import { Shipment, ShipmentStatus, PickupPoolItem } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  advanceShipmentStatus,
  updateCourierGPS,
  claimPickupPoolItem,
  STATUS_SEQUENCE,
} from '../services/shipmentService';
import { TrackingMap } from '../components/TrackingMap';

interface CourierDashboardViewProps {
  onOpenQRScanner: () => void;
  onNavigate: (tab: string, param?: string) => void;
}

export const CourierDashboardView: React.FC<CourierDashboardViewProps> = ({
  onOpenQRScanner,
  onNavigate,
}) => {
  const { profile, user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [pickupItems, setPickupItems] = useState<PickupPoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'aktif' | 'pool' | 'selesai' | 'semua'>('aktif');
  const [isClaiming, setIsClaiming] = useState<string | null>(null);

  // Selected shipment for mobile detail/action sheet
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  // Delivery modal state
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [receiverProofName, setReceiverProofName] = useState('');
  const [confirmationCodeInput, setConfirmationCodeInput] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [codCollected, setCodCollected] = useState(false);

  // Geolocation state
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const courierName = profile?.displayName || 'Budi Santoso (Kurir)';
  const courierUid = user?.uid || profile?.uid || 'demo_user_courier_01';

  // Listen to shipments and pickup pool
  useEffect(() => {
    let unsubs: (() => void)[] = [];
    try {
      // 1. Listen to shipments: if admin, all shipments; if courier, assigned to this courier
      const qShipments =
        profile?.role === 'admin'
          ? query(collection(db, 'shipments'))
          : query(collection(db, 'shipments'), where('assignedCourierId', '==', courierUid));

      const unsubShipments = onSnapshot(
        qShipments,
        (snapshot) => {
          const list: Shipment[] = snapshot.docs.map(
            (d) => ({ id: d.id, ...d.data() } as Shipment)
          );
          list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          setShipments(list);
          setLoading(false);
        },
        (error) => {
          console.warn('Courier query error:', error);
          setLoading(false);
        }
      );
      unsubs.push(unsubShipments);

      // 2. Listen to pickupPool
      const qPool = query(collection(db, 'pickupPool'));
      const unsubPool = onSnapshot(
        qPool,
        (snapshot) => {
          const poolList = snapshot.docs.map((d) => d.data() as PickupPoolItem);
          poolList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setPickupItems(poolList);
        },
        (err) => {
          console.warn('Pickup pool listener notice:', err);
        }
      );
      unsubs.push(unsubPool);

      return () => unsubs.forEach((u) => u());
    } catch (e) {
      console.warn(e);
      setLoading(false);
    }
  }, [profile?.role, courierUid]);

  const handleClaimPoolItem = async (item: PickupPoolItem) => {
    if (isClaiming) return;
    setIsClaiming(item.trackingNumber);
    try {
      await claimPickupPoolItem(item, courierUid, courierName);
      alert(`Paket ${item.trackingNumber} berhasil diambil dan berstatus Dijemput.`);
      setActiveFilter('aktif');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal mengambil paket dari pool.');
    } finally {
      setIsClaiming(null);
    }
  };

  // Browser Geolocation sharing with explicit user consent
  const handleShareLocation = (shp: Shipment) => {
    if (!navigator.geolocation) {
      setGeoError('Perangkat Anda tidak mendukung fitur Geolocation browser.');
      return;
    }

    setGeoError(null);
    setIsSharingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await updateCourierGPS(
            shp.id,
            shp.trackingNumber,
            pos.coords.latitude,
            pos.coords.longitude,
            'Koordinat Kurir Terkini'
          );
          alert(`Lokasi GPS berhasil dibagikan: (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        } catch (e) {
          console.error(e);
          setGeoError('Gagal menyimpan posisi ke basis data.');
        } finally {
          setIsSharingLocation(false);
        }
      },
      (err) => {
        setIsSharingLocation(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Izin akses lokasi GPS ditolak oleh pengguna browser.');
        } else {
          setGeoError(`Gagal memperoleh sinyal GPS: ${err.message}`);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Determine next status in sequential order
  const getNextStatus = (curr: ShipmentStatus): ShipmentStatus | null => {
    if (curr === 'Paket Terdaftar') return 'Dijemput';
    if (curr === 'Dijemput') return 'Di Gudang';
    if (curr === 'Di Gudang') return 'Dalam Perjalanan';
    if (curr === 'Dalam Perjalanan') return 'Sedang Diantar';
    if (curr === 'Sedang Diantar') return 'Terkirim';
    return null;
  };

  const handleAdvanceStatus = async (shp: Shipment) => {
    const next = getNextStatus(shp.status);
    if (!next) return;

    // If next is Terkirim, open completion modal
    if (next === 'Terkirim') {
      setSelectedShipment(shp);
      setReceiverProofName(shp.receiverName);
      setConfirmationCodeInput('');
      setDeliveryNotes('');
      setCodCollected(shp.paymentMethod === 'COD');
      setShowDeliveryModal(true);
      return;
    }

    setUpdatingStatus(true);
    try {
      await advanceShipmentStatus({
        shipment: shp,
        nextStatus: next,
        courierUid,
        courierName,
      });
      // Update local selected shipment view
      if (selectedShipment?.id === shp.id) {
        setSelectedShipment({ ...shp, status: next });
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal memperbarui status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!selectedShipment) return;

    // If confirmation code entered, check match
    if (confirmationCodeInput.trim()) {
      if (confirmationCodeInput.trim() !== selectedShipment.confirmationCode) {
        alert('Kode konfirmasi 6-digit salah! Silakan tanyakan kode rahasia pada penerima paket.');
        return;
      }
    }

    if (!receiverProofName.trim()) {
      alert('Mohon isi nama penerima fisik paket.');
      return;
    }

    setUpdatingStatus(true);
    try {
      await advanceShipmentStatus({
        shipment: selectedShipment,
        nextStatus: 'Terkirim',
        courierUid,
        courierName,
        proofRecipient: receiverProofName.trim(),
        notes: deliveryNotes,
      });

      setShowDeliveryModal(false);
      setSelectedShipment(null);
      alert('Pengiriman paket sukses dikonfirmasi! Transaksi ditutup otomatis.');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Gagal menyelesaikan pengiriman');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredShipments = shipments.filter((shp) => {
    if (activeFilter === 'aktif') return shp.status !== 'Terkirim' && shp.status !== 'Dibatalkan';
    if (activeFilter === 'selesai') return shp.status === 'Terkirim';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto py-4 px-3 space-y-6">
      {/* Mobile-first Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
              Portal Khusus Kurir Ekspedisi
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">{courierName}</h1>
          </div>
        </div>

        {/* Quick QR scanner for parcel pickups/drops */}
        <button
          onClick={onOpenQRScanner}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-4 py-3 text-xs font-bold text-white shadow-md transition cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          <span>Scan Barcode / QR Resi</span>
        </button>
      </div>

      {geoError && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold text-center gap-1">
        <button
          onClick={() => setActiveFilter('aktif')}
          className={`py-2.5 rounded-lg transition ${
            activeFilter === 'aktif' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Tugas Aktif ({shipments.filter((s) => s.status !== 'Terkirim' && s.status !== 'Dibatalkan').length})
        </button>
        <button
          onClick={() => setActiveFilter('pool')}
          className={`py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
            activeFilter === 'pool' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Antrean Jemput</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
            {pickupItems.length}
          </span>
        </button>
        <button
          onClick={() => setActiveFilter('selesai')}
          className={`py-2.5 rounded-lg transition ${
            activeFilter === 'selesai' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Selesai ({shipments.filter((s) => s.status === 'Terkirim').length})
        </button>
        <button
          onClick={() => setActiveFilter('semua')}
          className={`py-2.5 rounded-lg transition ${
            activeFilter === 'semua' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Semua ({shipments.length})
        </button>
      </div>

      {/* Shipment Cards List or Pickup Pool List */}
      <div className="space-y-4">
        {activeFilter === 'pool' ? (
          pickupItems.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400 space-y-2">
              <PackageCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">Belum Ada Antrean Jemput Tersedia</p>
              <p className="text-xs text-slate-500">
                Paket yang telah dibayar atau berstatus COD akan otomatis masuk ke antrean pool ini untuk diambil kurir.
              </p>
            </div>
          ) : (
            pickupItems.map((item) => (
              <div
                key={item.shipmentId}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg space-y-3 hover:border-teal-500/40 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-teal-300">
                      {item.trackingNumber}
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                      Siap Dijemput
                    </span>
                  </div>
                  <span className="text-xs font-bold text-white">
                    Rp {item.shippingCost.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Kota Penjemputan:</span>
                    <span className="font-semibold text-white">{item.senderCity}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Kota Tujuan:</span>
                    <span className="font-semibold text-white">{item.receiverCity}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Layanan:</span>
                    <span className="font-semibold">{item.serviceType} ({item.chargeableWeightKg} Kg)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Metode Pembayaran:</span>
                    <span className="font-semibold text-teal-400">
                      {item.paymentMethod === 'COD' ? 'COD (Bayar di Tempat)' : 'Lunas (Transfer/QRIS)'}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleClaimPoolItem(item)}
                    disabled={isClaiming === item.trackingNumber}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    <span>
                      {isClaiming === item.trackingNumber ? 'Mengambil...' : 'Ambil & Jemput Paket Ini'}
                    </span>
                  </button>
                </div>
              </div>
            ))
          )
        ) : loading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400 mx-auto mb-2" />
            <p className="text-xs">Memuat daftar tugas kurir...</p>
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400 space-y-2">
            <PackageCheck className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-white">Tidak Ada Paket pada Kategori Ini</p>
            <p className="text-xs text-slate-500">
              Paket yang ditugaskan atau diambil dari pool akan otomatis muncul di sini.
            </p>
          </div>
        ) : (
          filteredShipments.map((shp) => {
            const nextStatus = getNextStatus(shp.status);
            const isDelivered = shp.status === 'Terkirim';

            return (
              <div
                key={shp.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg space-y-4 hover:border-slate-700 transition"
              >
                {/* Top Info */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-teal-300">
                      {shp.trackingNumber}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-semibold uppercase">
                      {shp.serviceType}
                    </span>
                    {shp.paymentMethod === 'COD' && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-black">
                        COD
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      isDelivered
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-teal-500/20 text-teal-300'
                    }`}
                  >
                    {shp.status}
                  </span>
                </div>

                {/* Routing & Addresses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Ambil dari:</span>
                    <p className="font-bold text-white">{shp.senderName}</p>
                    <p className="text-slate-400">{shp.senderPhone}</p>
                    <p className="text-slate-300 text-[11px]">{shp.senderAddress}, {shp.senderCity}</p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Kirim kepada:</span>
                    <p className="font-bold text-white">{shp.receiverName}</p>
                    <p className="text-slate-400 font-mono">{shp.receiverPhone}</p>
                    <p className="text-slate-300 text-[11px]">{shp.receiverAddress}, {shp.receiverCity}</p>
                  </div>
                </div>

                {/* Package notes */}
                <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/50">
                  <span>Isi: <strong className="text-slate-200">{shp.packageDescription}</strong></span>
                  <span>Berat: <strong className="text-slate-200">{shp.chargeableWeightKg} Kg</strong></span>
                  <span>Ongkir: <strong className="text-teal-400">Rp {shp.shippingCost.toLocaleString('id-ID')}</strong></span>
                </div>

                {/* Courier Large Action Buttons */}
                <div className="pt-2 flex flex-wrap gap-2.5 items-center">
                  {/* Share GPS Location Button */}
                  {!isDelivered && (
                    <button
                      onClick={() => handleShareLocation(shp)}
                      disabled={isSharingLocation}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-3 px-4 text-xs font-semibold text-slate-200 transition cursor-pointer"
                      title="Kirim koordinat GPS lokasi kurir saat ini ke database"
                    >
                      <Navigation className="w-4 h-4 text-emerald-400" />
                      <span>{isSharingLocation ? 'Merekam GPS...' : 'Bagikan Posisi GPS'}</span>
                    </button>
                  )}

                  {/* Advance Status Button */}
                  {nextStatus && (
                    <button
                      onClick={() => handleAdvanceStatus(shp)}
                      disabled={updatingStatus}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 py-3 px-5 text-xs font-bold text-white shadow-md transition cursor-pointer"
                    >
                      <span>Perbarui Status &rarr; <strong>{nextStatus}</strong></span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {/* Open Map / Detail */}
                  <button
                    onClick={() => setSelectedShipment(selectedShipment?.id === shp.id ? null : shp)}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Buka Peta / Detail"
                  >
                    <MapPin className="w-4 h-4 text-teal-400" />
                  </button>
                </div>

                {/* Collapsible Leaflet Map inside card if tapped */}
                {selectedShipment?.id === shp.id && (
                  <div className="pt-4 border-t border-slate-800 space-y-2">
                    <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-teal-400" />
                      <span>Rute Lapangan Kurir:</span>
                    </p>
                    <TrackingMap
                      origin={shp.originCoords}
                      destination={shp.destinationCoords}
                      courierLocation={shp.currentCourierLocation}
                      height="260px"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Completion Modal for Proof / Confirmation Code / COD */}
      {showDeliveryModal && selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Serah Terima Paket (Terkirim)</h3>
                  <p className="text-[11px] text-slate-400">Resi: {selectedShipment.trackingNumber}</p>
                </div>
              </div>
            </div>

            {/* Confirmation code verification */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Kode Konfirmasi 6-Digit Penerima (Opsional namun Dianjurkan)
              </label>
              <input
                type="text"
                placeholder="6 Digit PIN Rahasia Penerima"
                value={confirmationCodeInput}
                onChange={(e) => setConfirmationCodeInput(e.target.value)}
                maxLength={6}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-center text-lg font-mono font-bold tracking-widest text-teal-300 focus:outline-none focus:border-teal-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                * Penerima memegang kode konfirmasi yang tercetak di resi/pesan otomatis mereka.
              </p>
            </div>

            {/* Recipient name claim */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Nama Penerima Fisik
              </label>
              <input
                type="text"
                value={receiverProofName}
                onChange={(e) => setReceiverProofName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Catatan Penerimaan / Lokasi Drop
              </label>
              <input
                type="text"
                placeholder="Misal: Diterima langsung oleh yang bersangkutan di teras"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* COD Checkbox if COD */}
            {selectedShipment.paymentMethod === 'COD' && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-200 space-y-2">
                <p className="font-bold text-amber-300">Penagihan COD (Bayar di Tempat)</p>
                <p>
                  Pastikan Anda telah menerima uang tunai sebesar{' '}
                  <strong className="text-white">
                    Rp {selectedShipment.shippingCost.toLocaleString('id-ID')}
                  </strong>{' '}
                  dari penerima sebelum menyerahkan paket.
                </p>
                <label className="flex items-center gap-2 pt-1 font-semibold text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={codCollected}
                    onChange={(e) => setCodCollected(e.target.checked)}
                    className="rounded text-teal-500 focus:ring-teal-500 h-4 w-4"
                  />
                  <span>Uang tunai COD sebesar tagihan telah diterima kurir</span>
                </label>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeliveryModal(false)}
                className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-3 text-xs font-semibold text-slate-300 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={updatingStatus || (selectedShipment.paymentMethod === 'COD' && !codCollected)}
                onClick={handleConfirmDelivery}
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 py-3 text-xs font-bold text-white shadow-md transition"
              >
                {updatingStatus ? 'Menyimpan...' : 'Konfirmasi Selesai'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
