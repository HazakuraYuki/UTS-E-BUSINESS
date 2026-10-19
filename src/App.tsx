import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  Search,
  PackageCheck,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  CreditCard,
  Printer,
  Sparkles,
  Info,
  Smartphone,
  ChevronRight,
  Send,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingView } from './views/LandingView';
import { SendPackageView } from './views/SendPackageView';
import { TrackingView } from './views/TrackingView';
import { CourierDashboardView } from './views/CourierDashboardView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { ReceiveConfirmView } from './views/ReceiveConfirmView';
import { UserHistoryView } from './views/UserHistoryView';
import { PaymentView } from './components/PaymentView';
import { ShippingLabel } from './components/ShippingLabel';
import { QRScannerModal } from './components/QRScannerModal';
import { AuthModal } from './components/AuthModal';
import { NotificationBell } from './components/NotificationBell';
import { PWAInstallButton } from './components/PWAInstallButton';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { seedDemoDataIfEmpty } from './services/seedService';
import { Shipment } from './types';

function MainApp() {
  const { user, profile, signOut, switchDemoPersona, isDemoUser } = useAuth();
  const isOnline = useOnlineStatus();

  // Navigation tab: 'beranda' | 'kirim' | 'lacak' | 'terima' | 'kurir' | 'admin' | 'riwayat' | 'label' | 'bayar'
  const [activeTab, setActiveTab] = useState<string>('beranda');
  const [tabParam, setTabParam] = useState<string>('');

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [activePaymentShipment, setActivePaymentShipment] = useState<Shipment | null>(null);
  const [activeLabelShipment, setActiveLabelShipment] = useState<Shipment | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPWAInfo, setShowPWAInfo] = useState(false);

  // Parse URL query parameters on initial load (e.g., ?tab=lacak&resi=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const resi = params.get('resi');
    const kode = params.get('kode');

    if (tab) {
      setActiveTab(tab);
      if (resi) setTabParam(resi);
      if (kode) setTabParam(kode);
    }

    // Seed demo data once in background
    seedDemoDataIfEmpty();
  }, []);

  const handleNavigate = (tab: string, param?: string) => {
    setActiveTab(tab);
    setTabParam(param || '');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPayment = (shp: Shipment) => {
    setActivePaymentShipment(shp);
  };

  const handleOpenLabel = (shp: Shipment) => {
    setActiveLabelShipment(shp);
  };

  const handleScanSuccess = (decodedText: string) => {
    setShowQRScanner(false);
    // If scanning a confirmation code (digits) or tracking number
    if (decodedText.startsWith('LGT-') || decodedText.includes('-')) {
      handleNavigate('lacak', decodedText);
    } else if (/^\d{6}$/.test(decodedText)) {
      handleNavigate('terima', decodedText);
    } else {
      handleNavigate('lacak', decodedText);
    }
  };

  // Determine active view based on tab or role
  const renderCurrentView = () => {
    // If viewing shipping label full screen
    if (activeLabelShipment) {
      return (
        <ShippingLabel
          shipment={activeLabelShipment}
          onBack={() => setActiveLabelShipment(null)}
        />
      );
    }

    // If viewing payment full screen
    if (activePaymentShipment) {
      return (
        <PaymentView
          shipment={activePaymentShipment}
          onPaymentCompleted={(updated) => {
            setActivePaymentShipment(null);
            handleNavigate('lacak', updated.trackingNumber);
          }}
          onClose={() => setActivePaymentShipment(null)}
        />
      );
    }

    switch (activeTab) {
      case 'beranda':
        return (
          <LandingView
            onNavigate={handleNavigate}
            onOpenQRScanner={() => setShowQRScanner(true)}
          />
        );
      case 'kirim':
        let initialData;
        try {
          if (tabParam && tabParam.startsWith('{')) {
            initialData = JSON.parse(tabParam);
          }
        } catch (e) {
          console.warn(e);
        }
        return (
          <SendPackageView
            initialData={initialData}
            onNavigate={handleNavigate}
            onOpenPayment={handleOpenPayment}
            onOpenLabel={handleOpenLabel}
          />
        );
      case 'lacak':
        return (
          <TrackingView
            initialTrackingNumber={tabParam}
            onOpenQRScanner={() => setShowQRScanner(true)}
            onNavigate={handleNavigate}
          />
        );
      case 'terima':
        return (
          <ReceiveConfirmView
            initialCode={tabParam}
            onNavigate={handleNavigate}
          />
        );
      case 'kurir':
        return (
          <CourierDashboardView
            onOpenQRScanner={() => setShowQRScanner(true)}
            onNavigate={handleNavigate}
          />
        );
      case 'admin':
        return (
          <AdminDashboardView
            onOpenQRScanner={() => setShowQRScanner(true)}
            onNavigate={handleNavigate}
            onOpenLabel={handleOpenLabel}
          />
        );
      case 'riwayat':
        return (
          <UserHistoryView
            onNavigate={handleNavigate}
            onOpenPayment={handleOpenPayment}
            onOpenLabel={handleOpenLabel}
          />
        );
      default:
        return (
          <LandingView
            onNavigate={handleNavigate}
            onOpenQRScanner={() => setShowQRScanner(true)}
          />
        );
    }
  };

  const userRole = profile?.role || 'sender';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Offline Status Warning Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 font-bold px-4 py-1.5 text-xs text-center flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <span className="h-2 w-2 rounded-full bg-slate-950 animate-ping" />
          <span>Mode Offline: Anda sedang tidak terhubung ke internet. Data pelacakan membutuhkan koneksi.</span>
        </div>
      )}

      {/* Demo Persona Header Notification */}
      {isDemoUser && (
        <div className="bg-teal-500/10 border-b border-teal-500/20 px-4 py-1 text-center text-xs text-teal-300 flex items-center justify-center gap-2">
          <span className="font-bold">Mode Pengujian Demo Aktif:</span>
          <span>
            Masuk sebagai <strong>{profile?.displayName}</strong> ({profile?.role.toUpperCase()})
          </span>
          <button
            onClick={() => setShowAuthModal(true)}
            className="underline hover:text-white ml-2 text-[11px]"
          >
            Ganti Akun
          </button>
        </div>
      )}

      {/* Main App Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <button
            onClick={() => handleNavigate('beranda')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 shadow-lg shadow-teal-500/20 group-hover:scale-105 transition">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white">LogiTrack</span>
                <span className="rounded bg-teal-500/20 px-1.5 py-0.2 text-[9px] font-black uppercase text-teal-400">
                  E-Shipment
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">
                Ekspedisi Darat Indonesia
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => handleNavigate('beranda')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'beranda'
                  ? 'bg-slate-800 text-teal-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Beranda
            </button>
            <button
              onClick={() => handleNavigate('kirim')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'kirim'
                  ? 'bg-slate-800 text-teal-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Kirim Paket
            </button>
            <button
              onClick={() => handleNavigate('lacak')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'lacak'
                  ? 'bg-slate-800 text-teal-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Lacak Resi
            </button>
            <button
              onClick={() => handleNavigate('terima')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'terima'
                  ? 'bg-slate-800 text-teal-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Konfirmasi Terima
            </button>

            {/* Role specific links */}
            {profile && (
              <>
                <button
                  onClick={() => handleNavigate('riwayat')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'riwayat'
                      ? 'bg-slate-800 text-teal-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Riwayat Saya
                </button>

                {(userRole === 'courier' || userRole === 'admin') && (
                  <button
                    onClick={() => handleNavigate('kurir')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      activeTab === 'kurir'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Portal Kurir</span>
                  </button>
                )}

                {userRole === 'admin' && (
                  <button
                    onClick={() => handleNavigate('admin')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      activeTab === 'admin'
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        : 'text-sky-400 hover:bg-sky-500/10'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin Ops</span>
                  </button>
                )}
              </>
            )}
          </nav>

          {/* Right Header Action Items */}
          <div className="flex items-center gap-2">
            {/* PWA Install Button */}
            <PWAInstallButton compact />

            {/* Notifications */}
            {profile && <NotificationBell onSelectShipment={(resi) => handleNavigate('lacak', resi)} />}

            {/* User Profile or Login Trigger */}
            {profile ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-white leading-tight">
                    {profile.displayName.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-teal-400 uppercase font-semibold">
                    {profile.role}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Keluar (Logout)"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Masuk / Daftar</span>
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white md:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900/95 p-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
            <button
              onClick={() => handleNavigate('beranda')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 text-slate-200"
            >
              Beranda
            </button>
            <button
              onClick={() => handleNavigate('kirim')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 text-slate-200"
            >
              Kirim Paket Baru
            </button>
            <button
              onClick={() => handleNavigate('lacak')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 text-slate-200"
            >
              Lacak Nomor Resi
            </button>
            <button
              onClick={() => handleNavigate('terima')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 text-slate-200"
            >
              Konfirmasi Terima Paket
            </button>

            {profile && (
              <>
                <button
                  onClick={() => handleNavigate('riwayat')}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 text-slate-200"
                >
                  Riwayat Pengiriman Saya
                </button>
                <button
                  onClick={() => handleNavigate('kurir')}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 text-emerald-400 flex items-center justify-between"
                >
                  <span>Portal Kurir</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleNavigate('admin')}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 text-sky-400 flex items-center justify-between"
                >
                  <span>Dashboard Admin</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowPWAInfo(true);
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-teal-400 flex items-center gap-1"
              >
                <Smartphone className="w-4 h-4" />
                <span>Info Aplikasi PWA</span>
              </button>

              {!profile && (
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs font-bold bg-teal-500 text-white px-3 py-1.5 rounded-lg"
                >
                  Login Akun
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {renderCurrentView()}
      </main>

      {/* Mobile Floating Action Bar for Quick Tracking & Scan (Thumb-zone) */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-30 flex items-center justify-between gap-2 p-2 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 shadow-2xl">
        <button
          onClick={() => handleNavigate('beranda')}
          className={`flex-1 flex flex-col items-center py-1 rounded-xl text-[10px] font-bold ${
            activeTab === 'beranda' ? 'text-teal-400 bg-teal-500/10' : 'text-slate-400'
          }`}
        >
          <Truck className="w-4 h-4 mb-0.5" />
          <span>Beranda</span>
        </button>
        <button
          onClick={() => handleNavigate('kirim')}
          className={`flex-1 flex flex-col items-center py-1 rounded-xl text-[10px] font-bold ${
            activeTab === 'kirim' ? 'text-teal-400 bg-teal-500/10' : 'text-slate-400'
          }`}
        >
          <Package className="w-4 h-4 mb-0.5" />
          <span>Kirim</span>
        </button>
        <button
          onClick={() => setShowQRScanner(true)}
          className="flex-1 flex flex-col items-center py-1 rounded-xl text-[10px] font-black bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md"
        >
          <Search className="w-4 h-4 mb-0.5" />
          <span>Scan Resi</span>
        </button>
        <button
          onClick={() => handleNavigate('terima')}
          className={`flex-1 flex flex-col items-center py-1 rounded-xl text-[10px] font-bold ${
            activeTab === 'terima' ? 'text-teal-400 bg-teal-500/10' : 'text-slate-400'
          }`}
        >
          <PackageCheck className="w-4 h-4 mb-0.5" />
          <span>Terima</span>
        </button>
        <button
          onClick={() => {
            if (profile?.role === 'courier') handleNavigate('kurir');
            else if (profile?.role === 'admin') handleNavigate('admin');
            else if (profile) handleNavigate('riwayat');
            else setShowAuthModal(true);
          }}
          className={`flex-1 flex flex-col items-center py-1 rounded-xl text-[10px] font-bold ${
            activeTab === 'kurir' || activeTab === 'admin' || activeTab === 'riwayat'
              ? 'text-teal-400 bg-teal-500/10'
              : 'text-slate-400'
          }`}
        >
          <User className="w-4 h-4 mb-0.5" />
          <span>{profile ? 'Akun' : 'Masuk'}</span>
        </button>
      </div>

      {/* Global QR Code Scanner Modal */}
      <QRScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* PWA Info Dialog */}
      {showPWAInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-base">Tentang LogiTrack PWA</h3>
              </div>
              <button
                onClick={() => setShowPWAInfo(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
              <p>
                <strong>LogiTrack</strong> dirancang sebagai <strong>Progressive Web App (PWA)</strong>,
                bukan aplikasi native toko aplikasi (Play Store / App Store).
              </p>
              <p>
                Aplikasi ini dapat dipasang langsung ke layar utama ponsel (Home Screen) melalui menu
                "Tambahkan ke Layar Utama" di browser Anda (Chrome/Safari), berjalan dalam tampilan
                layar penuh tanpa bilah URL browser, dan menyimpan cache statis secara efisien.
              </p>
              <p className="rounded-xl bg-slate-950 p-3 border border-slate-800 text-[11px] text-teal-300">
                Data pelacakan GPS, mutasi status, dan notifikasi Firestore membutuhkan koneksi
                internet real-time.
              </p>
            </div>
            <button
              onClick={() => setShowPWAInfo(false)}
              className="w-full rounded-xl bg-teal-500 hover:bg-teal-600 py-2.5 text-xs font-bold text-white transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
