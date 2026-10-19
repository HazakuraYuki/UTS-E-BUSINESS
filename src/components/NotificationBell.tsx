import React, { useEffect, useState, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { Bell, Check, Clock, PackageCheck } from 'lucide-react';
import { db } from '../lib/firebase';
import { NotificationItem } from '../types';
import { useAuth } from '../context/AuthContext';

export const NotificationBell: React.FC<{
  onSelectShipment?: (trackingNumber: string) => void;
}> = ({ onSelectShipment }) => {
  const { profile, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const activeUid = user?.uid || profile?.uid;

  useEffect(() => {
    if (!activeUid) {
      setNotifications([]);
      return;
    }

    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', activeUid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: NotificationItem[] = snapshot.docs.map(
            (d) => ({ id: d.id, ...d.data() } as NotificationItem)
          );
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setNotifications(list);
        },
        (error) => {
          console.warn('Notifications snapshot error:', error);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Error subscribing to notifications:', err);
    }
  }, [activeUid]);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (notif: NotificationItem) => {
    try {
      await updateDoc(doc(db, 'notifications', notif.id), { isRead: true });
    } catch (e) {
      console.warn(e);
    }
    if (onSelectShipment && notif.trackingNumber) {
      onSelectShipment(notif.trackingNumber);
      setIsOpen(false);
    }
  };

  const markAllRead = async () => {
    try {
      for (const n of notifications.filter((item) => !item.isRead)) {
        await updateDoc(doc(db, 'notifications', n.id), { isRead: true });
      }
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
        title="Notifikasi Pengiriman"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl text-slate-100 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Notifikasi Otomatis</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-300">
                  {unreadCount} baru
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-teal-400 hover:text-teal-300 transition"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="mt-3 max-h-80 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-800/50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <PackageCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p>Belum ada notifikasi.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Status perubahan paket akan muncul otomatis di sini.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif)}
                  className={`pt-2.5 first:pt-0 p-2 rounded-xl transition cursor-pointer text-xs ${
                    notif.isRead
                      ? 'bg-slate-950/40 text-slate-400 hover:bg-slate-800/50'
                      : 'bg-teal-500/10 border border-teal-500/20 text-slate-200 hover:bg-teal-500/15'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-semibold ${notif.isRead ? 'text-slate-300' : 'text-teal-300'}`}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {new Date(notif.createdAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{notif.message}</p>
                  {notif.trackingNumber && (
                    <span className="mt-1.5 inline-block text-[10px] font-mono text-teal-400 font-bold">
                      Resi: {notif.trackingNumber} &rarr;
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
