import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  X,
  Shield,
  Truck,
  Send,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'login',
  onSuccess,
}) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, switchDemoPersona } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        await signInWithEmail(email, password);
      } else {
        if (!name.trim()) {
          throw new Error('Mohon isi nama lengkap');
        }
        await signUpWithEmail(email, password, name, phone);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setErrorMsg('Email atau password salah. Silakan periksa kembali.');
      } else if (msg.includes('email-already-in-use')) {
        setErrorMsg('Email ini telah terdaftar. Silakan gunakan tab Masuk.');
      } else if (msg.includes('weak-password')) {
        setErrorMsg('Password terlalu pendek (minimal 6 karakter).');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal login via Google');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (role: UserRole) => {
    switchDemoPersona(role);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400 border border-teal-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Akun E-Shipment LogiTrack</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            {tab === 'login' ? 'Masuk ke LogiTrack' : 'Daftar Akun Pengirim'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {tab === 'login'
              ? 'Kelola pengiriman otomatis, pantau status, dan cetak resi.'
              : 'Daftar untuk menikmati kemudahan pengiriman otomatis ekspedisi darat.'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl mb-5 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              tab === 'login' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              tab === 'register' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Daftar Baru
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'register' && (
            <>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Andi Pratama"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Nomor Telepon / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {tab === 'register' && (
            <div className="rounded-xl bg-slate-950 p-2.5 text-[11px] text-slate-400 border border-slate-800">
              <span className="text-teal-400 font-semibold">* Catatan Akses: </span>
              Pendaftaran umum secara default menetapkan akun dengan role <strong>Pengirim</strong>. Akun
              Kurir & Admin dikonfigurasi secara internal demi keamanan sistem.
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 disabled:opacity-50 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <span>{tab === 'login' ? 'Masuk Sekarang' : 'Daftar Akun Baru'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Fast Demo Mode Persona Selector for Reviewers */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Akses Cepat Pengujian (Demo Personas)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            Pilih persona instan untuk mendemokan alur peran tanpa mengetik email:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoSelect('sender')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition group"
            >
              <Send className="w-4 h-4 text-teal-400 mb-1 group-hover:scale-110 transition" />
              <span className="text-xs font-bold">Pengirim</span>
              <span className="text-[9px] text-slate-500">Andi P.</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSelect('courier')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition group"
            >
              <Truck className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition" />
              <span className="text-xs font-bold">Kurir</span>
              <span className="text-[9px] text-slate-500">Budi S.</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSelect('admin')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition group"
            >
              <Shield className="w-4 h-4 text-sky-400 mb-1 group-hover:scale-110 transition" />
              <span className="text-xs font-bold">Admin</span>
              <span className="text-[9px] text-slate-500">Hendra W.</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
