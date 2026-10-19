import React, { useState } from 'react';
import {
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle,
  AlertTriangle,
  Printer,
  ArrowRight,
  ShieldCheck,
  Building,
  Copy,
  Check,
} from 'lucide-react';
import { Shipment, PaymentMethod } from '../types';
import { simulatePayment } from '../services/shipmentService';

interface PaymentViewProps {
  shipment: Shipment;
  onPaymentCompleted: (updatedShipment: Shipment) => void;
  onClose?: () => void;
}

export const PaymentView: React.FC<PaymentViewProps> = ({
  shipment,
  onPaymentCompleted,
  onClose,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    shipment.paymentMethod || 'TRANSFER'
  );
  const [selectedBank, setSelectedBank] = useState<'bca' | 'mandiri' | 'bni'>('bca');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedVa, setCopiedVa] = useState(false);
  const [isSuccess, setIsSuccess] = useState(shipment.paymentStatus === 'Lunas');

  const virtualAccountNumbers = {
    bca: `88001${shipment.trackingNumber.replace(/\D/g, '').slice(-7)}`,
    mandiri: `89012${shipment.trackingNumber.replace(/\D/g, '').slice(-7)}`,
    bni: `82103${shipment.trackingNumber.replace(/\D/g, '').slice(-7)}`,
  };

  const handleCopyVa = () => {
    navigator.clipboard.writeText(virtualAccountNumbers[selectedBank]);
    setCopiedVa(true);
    setTimeout(() => setCopiedVa(false), 2000);
  };

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      await simulatePayment(shipment.id, selectedMethod);
      const updated: Shipment = {
        ...shipment,
        paymentStatus: 'Lunas',
        paymentMethod: selectedMethod,
        paidAt: new Date().toISOString(),
      };
      setIsSuccess(true);
      onPaymentCompleted(updated);
    } catch (err) {
      console.error(err);
      alert('Gagal memproses simulasi pembayaran');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-2">
      {/* Simulation Banner Notice */}
      <div className="mb-6 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 p-4 text-amber-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-amber-300 text-sm">
              SIMULASI PEMBAYARAN (Bukan Transaksi Uang Sungguhan)
            </p>
            <p className="mt-1 text-slate-300">
              Modul ini dibuat khusus untuk keperluan demonstrasi proyek UAS E-Business. Seluruh nomor
              rekening, QRIS, dan tombol konfirmasi di bawah beroperasi dalam mode simulasi pengujian.
            </p>
          </div>
        </div>
      </div>

      {/* Main Payment Card */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900 p-6 shadow-xl text-slate-100">
        {/* Bill Summary */}
        <div className="border-b border-slate-800 pb-5 mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider">Nomor Resi Paket</span>
            <p className="font-mono font-bold text-lg text-teal-400">{shipment.trackingNumber}</p>
            <p className="text-xs text-slate-400">
              {shipment.senderCity} &rarr; {shipment.receiverCity} ({shipment.serviceType})
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Total Tagihan</span>
            <p className="text-2xl font-black text-white">
              Rp {shipment.shippingCost.toLocaleString('id-ID')}
            </p>
            <span
              className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                shipment.paymentStatus === 'Lunas' || isSuccess
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {isSuccess ? 'Lunas' : shipment.paymentStatus}
            </span>
          </div>
        </div>

        {isSuccess ? (
          /* Receipt / Success State */
          <div id="printable-receipt" className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/40">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Pembayaran Telah Lunas</h3>
              <p className="text-sm text-slate-300 mt-1">
                Terima kasih! Bukti transaksi simulasi telah diterbitkan secara otomatis.
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Status Transaksi:</span>
                <span className="font-bold text-emerald-400">BERHASIL DIVERIFIKASI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nomor Resi:</span>
                <span className="text-white">{shipment.trackingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Metode Bayar:</span>
                <span className="text-white uppercase">{selectedMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Jumlah Lunas:</span>
                <span className="text-white font-bold">
                  Rp {shipment.shippingCost.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Waktu Bayar:</span>
                <span className="text-white">
                  {shipment.paidAt ? new Date(shipment.paidAt).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={handlePrintReceipt}
                className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Bukti Bayar</span>
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="rounded-xl bg-teal-500 hover:bg-teal-600 px-5 py-2 text-xs font-semibold text-white transition"
                >
                  Selesai
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Payment Method Selection & Instructions */
          <div className="space-y-6">
            {/* Method Tabs */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                Pilih Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('TRANSFER')}
                  className={`p-3.5 rounded-xl border text-left flex flex-col gap-2 transition ${
                    selectedMethod === 'TRANSFER'
                      ? 'border-teal-500 bg-teal-500/10 text-white shadow-md'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-teal-400" />
                  <div>
                    <p className="font-bold text-xs text-slate-200">Virtual Account</p>
                    <p className="text-[10px] text-slate-400">BCA, Mandiri, BNI</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('QRIS')}
                  className={`p-3.5 rounded-xl border text-left flex flex-col gap-2 transition ${
                    selectedMethod === 'QRIS'
                      ? 'border-teal-500 bg-teal-500/10 text-white shadow-md'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-teal-400" />
                  <div>
                    <p className="font-bold text-xs text-slate-200">QRIS Instan</p>
                    <p className="text-[10px] text-slate-400">Gopay, OVO, Dana</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('COD')}
                  className={`p-3.5 rounded-xl border text-left flex flex-col gap-2 transition ${
                    selectedMethod === 'COD'
                      ? 'border-teal-500 bg-teal-500/10 text-white shadow-md'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-teal-400" />
                  <div>
                    <p className="font-bold text-xs text-slate-200">Bayar di Tempat</p>
                    <p className="text-[10px] text-slate-400">Tunai saat kurir tiba</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Method Details */}
            {selectedMethod === 'TRANSFER' && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-4">
                <div className="flex gap-2">
                  {(['bca', 'mandiri', 'bni'] as const).map((b) => (
                    <button
                      key={b}
                      onClick={() => setSelectedBank(b)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                        selectedBank === b
                          ? 'bg-teal-500 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Bank {b}
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-slate-900 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-slate-400">Nomor Virtual Account Simulasi:</p>
                    <p className="text-lg font-mono font-bold text-teal-300">
                      {virtualAccountNumbers[selectedBank]}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyVa}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                  >
                    {copiedVa ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedVa ? 'Disalin' : 'Salin'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Pembayaran akan diverifikasi secara otomatis dalam beberapa detik setelah tombol simulasi ditekan.
                </p>
              </div>
            )}

            {selectedMethod === 'QRIS' && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center space-y-3">
                <p className="text-xs text-slate-300">
                  Pindai QRIS Simulasi menggunakan aplikasi e-wallet Anda:
                </p>
                <div className="inline-block p-3 bg-white rounded-xl shadow-md border-2 border-slate-700">
                  {/* Decorative QR visual */}
                  <div className="w-40 h-40 bg-slate-100 flex flex-col items-center justify-center border border-dashed border-slate-400 rounded">
                    <QrCode className="w-24 h-24 text-slate-800" />
                    <span className="text-[9px] font-mono font-bold text-slate-600 mt-1">
                      LOGITRACK QRIS DEMO
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Dukung semua aplikasi pembayaran berstandar QRIS (GoPay, OVO, ShopeePay, BCA, dll).
                </p>
              </div>
            )}

            {selectedMethod === 'COD' && (
              <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-4 space-y-2 text-xs text-teal-200">
                <p className="font-bold text-sm text-teal-300">Layanan Cash on Delivery (COD)</p>
                <p>
                  Anda memilih Bayar di Tempat. Kurir LogiTrack akan langsung dijadwalkan untuk penjemputan paket.
                  Penerima akan membayar uang tunai sebesar{' '}
                  <span className="font-bold text-white">
                    Rp {shipment.shippingCost.toLocaleString('id-ID')}
                  </span>{' '}
                  ketika kurir mengantarkan paket.
                </p>
              </div>
            )}

            {/* Action Button */}
            {selectedMethod === 'COD' ? (
              <button
                disabled={isProcessing}
                onClick={handleSimulatePayment}
                className="w-full rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-50 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <span>Menyimpan Konfirmasi COD...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Konfirmasi Pengiriman dengan COD</span>
                  </>
                )}
              </button>
            ) : (
              <button
                disabled={isProcessing}
                onClick={handleSimulatePayment}
                className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 disabled:opacity-50 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <span>Memproses Simulasi...</span>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Simulasikan Pembayaran Berhasil</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
