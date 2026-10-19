import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, Download, ArrowLeft, Package, CheckCircle2 } from 'lucide-react';
import { Shipment } from '../types';

interface ShippingLabelProps {
  shipment: Shipment;
  onBack?: () => void;
}

export const ShippingLabel: React.FC<ShippingLabelProps> = ({ shipment, onBack }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const trackingUrl = `${window.location.origin}/?tab=lacak&resi=${shipment.trackingNumber}`;
    QRCode.toDataURL(trackingUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [shipment.trackingNumber]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Control bar */}
      <div className="no-print flex items-center justify-between mb-6">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Label Resi</span>
          </button>
        </div>
      </div>

      {/* Printable Shipping Label (Thermal 10x15cm style) */}
      <div
        id="printable-label"
        className="bg-white text-black p-6 rounded-2xl shadow-xl border-2 border-slate-300 font-sans print:shadow-none print:border-black print:rounded-none"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <div className="bg-black text-white px-2.5 py-1 text-base font-black rounded tracking-wider">
              LogiTrack
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-700">
              Ekspedisi Darat
            </span>
          </div>
          <div className="text-right">
            <span className="inline-block bg-black text-white text-xs font-bold px-3 py-1 rounded-sm uppercase">
              {shipment.serviceType}
            </span>
          </div>
        </div>

        {/* Tracking Barcode & QR Hero */}
        <div className="grid grid-cols-3 gap-4 border-b-2 border-black py-4 items-center">
          <div className="col-span-2 space-y-1">
            <p className="text-[11px] font-bold uppercase text-slate-600">Nomor Resi / AWB:</p>
            <p className="text-2xl font-black font-mono tracking-wider">{shipment.trackingNumber}</p>
            <div className="pt-2 flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-500">Berat Tertagih: </span>
                <span className="font-bold">{shipment.chargeableWeightKg} Kg</span>
              </div>
              <div>
                <span className="text-slate-500">Metode Bayar: </span>
                <span className="font-bold uppercase">{shipment.paymentMethod}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code Tracking" className="w-24 h-24 border border-black p-0.5" />
            ) : (
              <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-xs">QR</div>
            )}
            <span className="text-[9px] font-mono mt-1 text-slate-500">Scan untuk Lacak</span>
          </div>
        </div>

        {/* Origin & Destination Routing Banner */}
        <div className="grid grid-cols-2 gap-4 bg-slate-100 p-3 my-3 border border-black rounded text-xs font-mono">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Kota Asal (Origin):</span>
            <p className="text-sm font-black text-black">{shipment.senderCity.toUpperCase()}</p>
          </div>
          <div className="border-l border-slate-300 pl-3">
            <span className="text-[10px] uppercase font-bold text-slate-500">Kota Tujuan (Destination):</span>
            <p className="text-base font-black text-black">{shipment.receiverCity.toUpperCase()}</p>
          </div>
        </div>

        {/* Sender & Receiver Details */}
        <div className="grid grid-cols-2 gap-4 border-b-2 border-black pb-4 text-xs leading-relaxed">
          {/* Receiver (Prominent) */}
          <div className="border-r border-slate-300 pr-3">
            <p className="font-bold text-[11px] text-slate-500 uppercase">Kepada (Penerima):</p>
            <p className="font-black text-sm text-black">{shipment.receiverName}</p>
            <p className="font-bold font-mono text-slate-800">{shipment.receiverPhone}</p>
            <p className="text-slate-700 mt-1 whitespace-pre-line">{shipment.receiverAddress}</p>
            <p className="font-bold mt-1 text-black">{shipment.receiverCity}</p>
          </div>

          {/* Sender */}
          <div className="pl-1">
            <p className="font-bold text-[11px] text-slate-500 uppercase">Dari (Pengirim):</p>
            <p className="font-bold text-slate-900">{shipment.senderName}</p>
            <p className="font-mono text-slate-700">{shipment.senderPhone}</p>
            <p className="text-slate-600 mt-1">{shipment.senderAddress}</p>
            <p className="font-semibold text-slate-800">{shipment.senderCity}</p>
          </div>
        </div>

        {/* Package Content & Special Instruction */}
        <div className="pt-3 text-xs flex justify-between items-start">
          <div className="space-y-1">
            <p>
              <span className="font-bold text-slate-600">Isi Paket: </span>
              <span className="font-medium text-black">{shipment.packageDescription}</span>
            </p>
            <p className="text-[11px] text-slate-500">
              Dimensi: {shipment.lengthCm}x{shipment.widthCm}x{shipment.heightCm} cm | Aktual: {shipment.weightKg} kg
            </p>
          </div>

          {/* Security Verification Notice (Code kept private with receiver/sender) */}
          <div className="border border-black bg-slate-50 p-2 text-center rounded min-w-[130px]">
            <p className="text-[9px] uppercase font-bold text-slate-700">Verifikasi Penerima</p>
            <p className="text-[9px] text-slate-900 font-semibold mt-0.5">Kode Rahasia Digital</p>
            <p className="text-[8px] text-slate-500 mt-0.5">Disimpan di Akun &amp; Penerima</p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-4 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-[9px] text-slate-500">
          <span>LogiTrack E-Shipment Ekspedisi Darat Indonesia</span>
          <span>Dicetak otomatis: {new Date().toLocaleDateString('id-ID')}</span>
        </div>
      </div>
    </div>
  );
};
