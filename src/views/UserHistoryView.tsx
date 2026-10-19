import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import {
  Package,
  Clock,
  Printer,
  CreditCard,
  Search,
  ArrowRight,
  Send,
  Plus,
} from 'lucide-react';
import { db } from '../lib/firebase';
import { Shipment } from '../types';
import { useAuth } from '../context/AuthContext';

interface UserHistoryViewProps {
  onNavigate: (tab: string, param?: string) => void;
  onOpenPayment: (shipment: Shipment) => void;
  onOpenLabel: (shipment: Shipment) => void;
}

export const UserHistoryView: React.FC<UserHistoryViewProps> = ({
  onNavigate,
  onOpenPayment,
  onOpenLabel,
}) => {
  const { user, profile } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  const activeUid = user?.uid || profile?.uid;

  useEffect(() => {
    if (!activeUid) {
      setShipments([]);
      setLoading(false);
      return;
    }

    try {
      // In sender role, show user shipments; or in demo mode show user's or demo shipments
      const q = query(
        collection(db, 'shipments'),
        where('senderId', '==', activeUid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shipment));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setShipments(list);
          setLoading(false);
        },
        (err) => {
          console.warn('History snapshot error:', err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn(e);
      setLoading(false);
    }
  }, [activeUid]);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Riwayat Pengiriman Saya</h1>
          <p className="text-xs text-slate-400 mt-1">
            Daftar paket yang Anda kirimkan menggunakan platform LogiTrack.
          </p>
        </div>

        <button
          onClick={() => onNavigate('kirim')}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Kirim Paket Baru</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400 mx-auto mb-2" />
          <p className="text-xs">Memuat riwayat pengiriman...</p>
        </div>
      ) : shipments.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-400 space-y-3">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Belum Ada Pengiriman</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Anda belum membuat pesanan pengiriman. Buat pesanan sekarang dan nikmati sistem otomatis
            Send-Receive Automatic!
          </p>
          <button
            onClick={() => onNavigate('kirim')}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-600 px-4 py-2 text-xs font-bold text-white transition mt-2"
          >
            <span>Kirim Paket Pertama</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {shipments.map((shp) => (
            <div
              key={shp.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg hover:border-slate-700 transition space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-teal-300">
                    {shp.trackingNumber}
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-semibold">
                    {shp.serviceType}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(shp.createdAt).toLocaleDateString('id-ID')}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                    shp.status === 'Terkirim'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : shp.status === 'Gagal Kirim' || shp.status === 'Dibatalkan'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-teal-500/20 text-teal-300'
                  }`}
                >
                  {shp.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Rute Pengiriman:</span>
                  <p className="font-semibold text-white mt-0.5">
                    {shp.senderCity} &rarr; {shp.receiverCity}
                  </p>
                  <p className="text-slate-400 mt-1">Kepada: {shp.receiverName}</p>
                </div>
                <div className="sm:text-right">
                  <span className="text-slate-500">Total Ongkir:</span>
                  <p className="font-black text-white text-base">
                    Rp {shp.shippingCost.toLocaleString('id-ID')}
                  </p>
                  <span
                    className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded ${
                      shp.paymentStatus === 'Lunas'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {shp.paymentStatus} ({shp.paymentMethod})
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-wrap gap-2 justify-end">
                {shp.paymentStatus !== 'Lunas' && shp.paymentMethod !== 'COD' && (
                  <button
                    onClick={() => onOpenPayment(shp)}
                    className="flex items-center gap-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white transition"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Bayar (Simulasi)</span>
                  </button>
                )}
                <button
                  onClick={() => onOpenLabel(shp)}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-teal-400" />
                  <span>Cetak Label</span>
                </button>
                <button
                  onClick={() => onNavigate('lacak', shp.trackingNumber)}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition"
                >
                  <Search className="w-3.5 h-3.5 text-teal-400" />
                  <span>Lacak Real-Time</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
