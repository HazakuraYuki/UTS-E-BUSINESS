import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Package,
  User,
  MapPin,
  Truck,
  CreditCard,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Printer,
  Search,
  AlertCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { INDONESIAN_CITIES, SERVICE_OPTIONS } from '../data/cities';
import {
  calculateTariff,
  createAutomaticShipment,
} from '../services/shipmentService';
import { useAuth } from '../context/AuthContext';
import { Shipment, PaymentMethod } from '../types';

interface SendPackageViewProps {
  initialData?: { origin?: string; dest?: string; weight?: number };
  onNavigate: (tab: string, param?: string) => void;
  onOpenPayment: (shipment: Shipment) => void;
  onOpenLabel: (shipment: Shipment) => void;
}

export const SendPackageView: React.FC<SendPackageViewProps> = ({
  initialData,
  onNavigate,
  onOpenPayment,
  onOpenLabel,
}) => {
  const { user, profile } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Sender & Receiver
  const [senderName, setSenderName] = useState(profile?.displayName || 'Andi Pratama');
  const [senderPhone, setSenderPhone] = useState(profile?.phone || '081234567890');
  const [senderCity, setSenderCity] = useState(initialData?.origin || 'DKI Jakarta');
  const [senderAddress, setSenderAddress] = useState('Jl. Jenderal Sudirman No. 28, RT 01 / RW 04');

  const [receiverName, setReceiverName] = useState('Siti Rahmawati');
  const [receiverPhone, setReceiverPhone] = useState('085711223344');
  const [receiverCity, setReceiverCity] = useState(initialData?.dest || 'Kota Bandung');
  const [receiverAddress, setReceiverAddress] = useState('Jl. Dago Asri No. 12, Coblong');
  const [receiverEmail, setReceiverEmail] = useState('siti.rahmawati@gmail.com');

  // Step 2: Package Info
  const [packageDescription, setPackageDescription] = useState('Pakaian & Aksesoris Fashion');
  const [weightKg, setWeightKg] = useState(initialData?.weight || 2);
  const [lengthCm, setLengthCm] = useState(25);
  const [widthCm, setWidthCm] = useState(20);
  const [heightCm, setHeightCm] = useState(10);

  // Step 3: Service & Payment Method
  const [serviceType, setServiceType] = useState<'REGULER' | 'EXPRESS' | 'CARGO'>('REGULER');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TRANSFER');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdShipment, setCreatedShipment] = useState<Shipment | null>(null);
  const [successQrUrl, setSuccessQrUrl] = useState<string>('');

  // Tariff calculation
  const tariff = calculateTariff(
    senderCity,
    receiverCity,
    weightKg,
    lengthCm,
    widthCm,
    heightCm,
    serviceType
  );

  useEffect(() => {
    if (createdShipment) {
      QRCode.toDataURL(
        `${window.location.origin}/?tab=lacak&resi=${createdShipment.trackingNumber}`,
        { width: 200, margin: 1 }
      ).then(setSuccessQrUrl);
    }
  }, [createdShipment]);

  // Validation
  const validateStep1 = () => {
    if (!senderName.trim() || !senderPhone.trim() || !senderAddress.trim()) {
      setErrorMsg('Mohon lengkapi seluruh data pengirim.');
      return false;
    }
    if (!receiverName.trim() || !receiverPhone.trim() || !receiverAddress.trim()) {
      setErrorMsg('Mohon lengkapi seluruh data penerima.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const validateStep2 = () => {
    if (!packageDescription.trim()) {
      setErrorMsg('Mohon isi deskripsi isi paket.');
      return false;
    }
    if (weightKg <= 0 || lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) {
      setErrorMsg('Berat dan dimensi harus lebih besar dari 0.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((prev) => Math.min(4, prev + 1) as any);
  };

  const handleBack = () => {
    setErrorMsg(null);
    setStep((prev) => Math.max(1, prev - 1) as any);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const senderUid = user?.uid || profile?.uid || 'guest_sender_' + Date.now();
      const res = await createAutomaticShipment({
        senderId: senderUid,
        senderName,
        senderPhone,
        senderAddress,
        senderCity,
        receiverName,
        receiverPhone,
        receiverAddress,
        receiverCity,
        receiverEmail,
        packageDescription,
        weightKg,
        lengthCm,
        widthCm,
        heightCm,
        serviceType,
        paymentMethod,
      });
      setCreatedShipment(res);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Gagal membuat pengiriman otomatis.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (createdShipment) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in duration-300">
        <div className="rounded-3xl border border-teal-500/40 bg-slate-900 p-8 shadow-2xl text-slate-100 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-500/20 text-teal-400 border-2 border-teal-500/40 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
            Send-Receive Automatic Berhasil
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Pengiriman Berhasil Terdaftar!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2">
            Nomor resi otomatis dan kode konfirmasi keamanan telah berhasil dibuat ke dalam basis data.
          </p>

          {/* Resi & QR Box */}
          <div className="my-6 rounded-2xl bg-slate-950 p-6 border border-slate-800 text-left grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="sm:col-span-2 space-y-2">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Nomor Resi Unik (AWB):</p>
                <p className="text-2xl font-mono font-black text-teal-300 tracking-wider">
                  {createdShipment.trackingNumber}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-500">Rute:</span>
                  <p className="font-semibold text-white">
                    {createdShipment.senderCity} &rarr; {createdShipment.receiverCity}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Layanan:</span>
                  <p className="font-semibold text-white">{createdShipment.serviceType}</p>
                </div>
                <div>
                  <span className="text-slate-500">Total Biaya:</span>
                  <p className="font-bold text-white">
                    Rp {createdShipment.shippingCost.toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Kode Konfirmasi:</span>
                  <p className="font-mono font-bold text-emerald-400">
                    {createdShipment.confirmationCode}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl">
              {successQrUrl ? (
                <img src={successQrUrl} alt="QR Resi" className="w-28 h-28" />
              ) : (
                <div className="w-28 h-28 bg-slate-100 flex items-center justify-center text-xs text-black">
                  QR Code
                </div>
              )}
              <span className="text-[9px] font-mono font-bold text-slate-700 mt-1">
                Label Digital
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {createdShipment.paymentStatus !== 'Lunas' && createdShipment.paymentMethod !== 'COD' ? (
              <button
                onClick={() => onOpenPayment(createdShipment)}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-md transition cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Bayar Sekarang (Simulasi)</span>
              </button>
            ) : (
              <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold py-3">
                <CheckCircle className="w-4 h-4" />
                <span>{createdShipment.paymentMethod === 'COD' ? 'Bayar di Tempat (COD)' : 'Sudah Lunas'}</span>
              </div>
            )}

            <button
              onClick={() => onOpenLabel(createdShipment)}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-3 text-xs font-bold text-slate-200 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-teal-400" />
              <span>Cetak Label Resi</span>
            </button>

            <button
              onClick={() => onNavigate('lacak', createdShipment.trackingNumber)}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-3 text-xs font-bold text-slate-200 transition cursor-pointer"
            >
              <Search className="w-4 h-4 text-teal-400" />
              <span>Lacak Paket</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Title */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400 border border-teal-500/20 mb-2">
          <Truck className="w-3.5 h-3.5" />
          <span>Formulir Send-Receive Automatic</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Kirim Paket Baru</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Lengkapi data pengiriman. Nomor resi, ongkos kirim, dan kode konfirmasi dibuat otomatis tanpa
          menunggu verifikasi admin manual.
        </p>
      </div>

      {/* Stepper Header */}
      <div className="grid grid-cols-4 gap-2 mb-8 text-center text-xs">
        {[
          { num: 1, title: 'Alamat' },
          { num: 2, title: 'Paket' },
          { num: 3, title: 'Layanan' },
          { num: 4, title: 'Ringkasan' },
        ].map((s) => (
          <div
            key={s.num}
            className={`p-2.5 rounded-xl border transition ${
              step === s.num
                ? 'border-teal-500 bg-teal-500/15 text-white font-bold'
                : step > s.num
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-800 bg-slate-900/60 text-slate-500'
            }`}
          >
            <span className="block text-[11px] font-mono">Langkah 0{s.num}</span>
            <span className="truncate">{s.title}</span>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs text-red-300 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 md:p-8 shadow-xl text-slate-100">
        {/* STEP 1: PENGIRIM & PENERIMA */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-400" />
              <span>Data Pengirim & Penerima</span>
            </h3>

            {/* Sender */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 block">
                1. Data Pengirim (Asal)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Nama Pengirim</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Nomor Telepon</label>
                  <input
                    type="tel"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Kota Asal</label>
                  <select
                    value={senderCity}
                    onChange={(e) => setSenderCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    {INDONESIAN_CITIES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Alamat Lengkap Penjemputan
                  </label>
                  <input
                    type="text"
                    value={senderAddress}
                    onChange={(e) => setSenderAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Receiver */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 block">
                2. Data Penerima (Tujuan)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Nama Penerima</label>
                  <input
                    type="text"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Nomor Telepon Penerima</label>
                  <input
                    type="tel"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Kota Tujuan</label>
                  <select
                    value={receiverCity}
                    onChange={(e) => setReceiverCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    {INDONESIAN_CITIES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-400 block mb-1">Alamat Lengkap Pengiriman</label>
                  <input
                    type="text"
                    value={receiverAddress}
                    onChange={(e) => setReceiverAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: DATA PAKET & DIMENSI */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-400" />
              <span>Detail Barang & Dimensi Paket</span>
            </h3>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Deskripsi / Isi Paket</label>
              <input
                type="text"
                placeholder="Contoh: Sepatu Olahraga, Pakaian, Sparepart Mesin"
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Berat Aktual (Kg)</label>
                <input
                  type="number"
                  min={1}
                  value={weightKg}
                  onChange={(e) => setWeightKg(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Panjang (cm)</label>
                <input
                  type="number"
                  min={1}
                  value={lengthCm}
                  onChange={(e) => setLengthCm(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Lebar (cm)</label>
                <input
                  type="number"
                  min={1}
                  value={widthCm}
                  onChange={(e) => setWidthCm(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tinggi (cm)</label>
                <input
                  type="number"
                  min={1}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Live volumetric formula display */}
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Formula Berat Volumetrik:</span>
                <span className="font-mono text-slate-300">
                  ({lengthCm} x {widthCm} x {heightCm}) / 5000 = {tariff.volumetricWeightKg} kg
                </span>
              </div>
              <div className="flex justify-between text-teal-400 font-bold border-t border-slate-800/80 pt-2">
                <span>Berat Tertagih (Chargeable Weight):</span>
                <span>{tariff.chargeableWeightKg} Kg</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: LAYANAN & METODE BAYAR */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-teal-400" />
              <span>Layanan Ekspedisi & Metode Pembayaran</span>
            </h3>

            {/* Services */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                Pilih Jenis Layanan Ekspedisi
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SERVICE_OPTIONS.map((srv) => (
                  <button
                    key={srv.type}
                    type="button"
                    onClick={() => setServiceType(srv.type as any)}
                    className={`p-4 rounded-xl border text-left transition ${
                      serviceType === srv.type
                        ? 'border-teal-500 bg-teal-500/10 text-white shadow-md'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-sm text-white">{srv.name}</p>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-teal-400 font-semibold">
                        {srv.eta}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{srv.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                Pilih Metode Pembayaran
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={`p-4 rounded-xl border text-left transition ${
                    paymentMethod === 'TRANSFER'
                      ? 'border-teal-500 bg-teal-500/10 text-white shadow-md'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold text-xs text-white">Virtual Account</p>
                  <p className="text-[10px] text-slate-400 mt-1">BCA, Mandiri, BNI (Simulasi)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`p-4 rounded-xl border text-left transition ${
                    paymentMethod === 'QRIS'
                      ? 'border-teal-500 bg-teal-500/10 text-white shadow-md'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold text-xs text-white">QRIS Instan</p>
                  <p className="text-[10px] text-slate-400 mt-1">GoPay, OVO, ShopeePay (Simulasi)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 rounded-xl border text-left transition ${
                    paymentMethod === 'COD'
                      ? 'border-teal-500 bg-teal-500/10 text-white shadow-md'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold text-xs text-white">Bayar di Tempat (COD)</p>
                  <p className="text-[10px] text-slate-400 mt-1">Tunai ke kurir saat penerimaan</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: RINGKASAN & KONFIRMASI */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              <span>Ringkasan Pengiriman & Konfirmasi Otomatis</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2">
                <span className="font-bold uppercase text-[10px] text-slate-400">Pengirim (Asal)</span>
                <p className="font-bold text-white text-sm">{senderName}</p>
                <p className="text-slate-400">{senderPhone}</p>
                <p className="text-slate-300">{senderAddress}, {senderCity}</p>
              </div>

              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2">
                <span className="font-bold uppercase text-[10px] text-slate-400">Penerima (Tujuan)</span>
                <p className="font-bold text-white text-sm">{receiverName}</p>
                <p className="text-slate-400">{receiverPhone}</p>
                <p className="text-slate-300">{receiverAddress}, {receiverCity}</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Deskripsi Barang:</span>
                <span className="font-semibold text-white">{packageDescription}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dimensi & Berat:</span>
                <span className="text-white">
                  {lengthCm}x{widthCm}x{heightCm} cm ({weightKg} kg aktual)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Berat Tertagih:</span>
                <span className="font-bold text-teal-400">{tariff.chargeableWeightKg} Kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Layanan Ekspedisi:</span>
                <span className="font-semibold text-white">
                  {serviceType} ({tariff.eta})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Metode Pembayaran:</span>
                <span className="font-semibold text-white">{paymentMethod}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 text-sm">
                <span className="font-bold text-white">Total Ongkos Kirim:</span>
                <span className="font-black text-xl text-teal-300">
                  Rp {tariff.shippingCost.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 p-3 text-xs text-teal-200">
              <span className="font-bold">Otomasi LogiTrack: </span>
              Setelah Anda menekan tombol di bawah, sistem otomatis membuat nomor resi resmi,
              menghasilkan label QR thermal, menetapkan status awal "Paket Terdaftar", dan menyiapkan
              antrean penjemputan armada kurir.
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 pt-5 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer"
            >
              <span>Lanjut ke Langkah {step + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 disabled:opacity-50 px-6 py-3 text-sm font-black text-white shadow-lg shadow-teal-500/25 transition cursor-pointer"
            >
              {isSubmitting ? (
                <span>Menerbitkan Resi Otomatis...</span>
              ) : (
                <>
                  <span>Kirim Paket Sekarang</span>
                  <CheckCircle className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
