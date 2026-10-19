import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Target,
  Shield,
  Zap,
  Users,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Truck,
  Package,
  Calendar,
  Lock,
  MapPin,
  Tag,
  Megaphone,
  RefreshCw,
  FileCheck2,
  Sliders,
  Sparkles,
  Info,
  ChevronDown,
} from 'lucide-react';
import {
  MARKET_INSIGHTS,
  COMPETITORS,
  SWOT_DATA,
  MARKETING_MIX_7P,
  GTM_TIMELINE,
  RISK_MATRIX,
} from '../data/marketStrategy';
import { INDONESIAN_CITIES, SERVICE_OPTIONS, ZONE_BASE_RATES } from '../data/cities';
import { calculateTariff } from '../services/shipmentService';

interface MarketStrategyViewProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const MarketStrategyView: React.FC<MarketStrategyViewProps> = ({ onNavigate }) => {
  // Simulator Model Bisnis Tarif Aktif
  const [originCity, setOriginCity] = useState('DKI Jakarta');
  const [destCity, setDestCity] = useState('Kota Bandung');
  const [simWeight, setSimWeight] = useState(2);
  const [simService, setSimService] = useState<'REGULER' | 'EXPRESS' | 'CARGO'>('REGULER');

  // Interactive Live Projection Sliders
  const [merchantCount, setMerchantCount] = useState<number>(500); // 100 - 5000 UMKM
  const [packagesPerMerchant, setPackagesPerMerchant] = useState<number>(40); // 10 - 150 paket/bulan
  const [avgTicketPrice, setAvgTicketPrice] = useState<number>(22000); // Rp 15.000 - Rp 45.000
  const [platformTakeRate, setPlatformTakeRate] = useState<number>(18); // 10% - 30% margin kotor

  // Live calculation based on calculateTariff
  const tariffResult = useMemo(() => {
    return calculateTariff(originCity, destCity, simWeight, 25, 20, 10, simService);
  }, [originCity, destCity, simWeight, simService]);

  // Projected financial metrics
  const financialProjections = useMemo(() => {
    const totalMonthlyPackages = merchantCount * packagesPerMerchant;
    const monthlyGrossRevenue = totalMonthlyPackages * avgTicketPrice;
    const monthlyNetRevenue = Math.round(monthlyGrossRevenue * (platformTakeRate / 100));

    const annualPackages = totalMonthlyPackages * 12;
    const annualGrossRevenue = monthlyGrossRevenue * 12;
    const annualNetRevenue = monthlyNetRevenue * 12;

    // Asumsi biaya tetap operasional bulanan (server cloud, admin CS, sewa hub) ~ Rp 45.000.000
    const fixedMonthlyCost = 45000000;
    const isProfitable = monthlyNetRevenue >= fixedMonthlyCost;
    const breakEvenPackages = Math.ceil(fixedMonthlyCost / (avgTicketPrice * (platformTakeRate / 100)));

    return {
      totalMonthlyPackages,
      monthlyGrossRevenue,
      monthlyNetRevenue,
      annualPackages,
      annualGrossRevenue,
      annualNetRevenue,
      fixedMonthlyCost,
      isProfitable,
      breakEvenPackages,
    };
  }, [merchantCount, packagesPerMerchant, avgTicketPrice, platformTakeRate]);

  return (
    <div className="max-w-6xl mx-auto py-6 px-3 sm:px-4 space-y-12 text-slate-100">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3.5 py-1.5 text-xs font-semibold text-teal-300 border border-teal-500/30">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Dokumentasi Strategi Bisnis &bull; Syarat Kelengkapan UAS E-Business</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Strategi Pasar &amp; Rencana Bisnis LogiTrack
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Analisis komprehensif lanskap ekspedisi darat Indonesia: proposisi nilai send-receive automatic,
            ukuran pasar riil, segmentasi UMKM online, analisis kompetitor incumbent, bauran pemasaran 7P,
            model monetisasi berbasis tarif zona riil, serta proyeksi pertumbuhan 12 bulan.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href="#proposisi"
              className="text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 text-teal-300 transition"
            >
              1. Proposisi Nilai
            </a>
            <a
              href="#pasar"
              className="text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 text-teal-300 transition"
            >
              2. Analisis Pasar
            </a>
            <a
              href="#kompetitor"
              className="text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 text-teal-300 transition"
            >
              3. Kompetitor
            </a>
            <a
              href="#swot"
              className="text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 text-teal-300 transition"
            >
              4. SWOT
            </a>
            <a
              href="#7p"
              className="text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 text-teal-300 transition"
            >
              5. Bauran 7P
            </a>
            <a
              href="#model-tarif"
              className="text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 text-teal-300 transition"
            >
              6. Model Tarif
            </a>
            <a
              href="#gtm"
              className="text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 text-teal-300 transition"
            >
              7. Roadmap GTM
            </a>
            <a
              href="#proyeksi"
              className="text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 text-teal-300 transition"
            >
              8. Simulator Proyeksi
            </a>
            <a
              href="#risiko"
              className="text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 text-teal-300 transition"
            >
              9. Risiko &amp; Mitigasi
            </a>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BAGIAN 1: RINGKASAN BISNIS & PROPOSISI NILAI
      ========================================================================= */}
      <section id="proposisi" className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Award className="w-5 h-5 text-teal-400" />
          <h2 className="text-xl sm:text-2xl font-black text-white">
            1. Ringkasan Bisnis &amp; Proposisi Nilai (Value Proposition)
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          LogiTrack hadir sebagai platform <strong>E-Shipment Ekspedisi Darat</strong> cerdas yang menjembatani
          pedagang online (social commerce &amp; UMKM), kurir lapangan, dan konsumen akhir di sepanjang koridor
          pulau Jawa, Bali, dan pintu gerbang Sumatera. Platform ini memecahkan 4 titik nyeri (pain points) utama
          logistik konvensional:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Send-Receive Automatic</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Kalkulasi tarif instan membandingkan berat riil vs rumus volumetrik darat (P×L×T)/5000. Terbit
              label thermal otomatis siap tempel tanpa antre loket.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Resi Atomik Anti-Balapan</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Format <code className="text-teal-300 font-mono">LGT-YYYYMMDD-NNNN</code> diamankan via transaksi
              Firestore runTransaction pada counter harian. Tahan klik ganda serentak saat lonjakan pesanan.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Konfirmasi Aman Digital</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Kode rahasia 10-karakter alfanumerik (32^10 kemungkinan) via kapabilitas receiptKeys. Kurir tidak
              dapat memalsukan status paket sebelum diverifikasi oleh penerima asli.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Pelacakan Zero-PII</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pelacakan publik menampilkan rute kota, posisi kurir di peta, dan timeline real-time tanpa
              mengekspos nama jalan lengkap maupun nomor telepon pribadi ke publik.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          BAGIAN 2: ANALISIS PASAR & SEGMENTASI
      ========================================================================= */}
      <section id="pasar" className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <TrendingUp className="w-5 h-5 text-teal-400" />
          <h2 className="text-xl sm:text-2xl font-black text-white">
            2. Analisis Ukuran Pasar &amp; Segmentasi Logistik Indonesia
          </h2>
        </div>

        {/* Sumber Pasar Resmi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MARKET_INSIGHTS.nationalStats.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-2 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {item.label}
                </span>
                <p className="text-xl sm:text-2xl font-black text-teal-300 mt-1">{item.value}</p>
                <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">{item.annotation}</p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                <Info className="w-3 h-3 text-teal-400 shrink-0" />
                <span>Sumber: {item.source}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 3 Segmen Pasar Utama */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-teal-400" />
            <span>Segmentasi Pengguna &amp; Target Utama</span>
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {MARKET_INSIGHTS.marketSegments.map((seg, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">
                      {seg.badge} ({seg.share})
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white">{seg.name}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{seg.profile}</p>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-rose-400 uppercase">Kendala Utama (Pain Points):</span>
                    <p className="text-slate-400 text-[11px]">{seg.painPoints}</p>
                  </div>
                </div>

                <div className="bg-teal-950/20 p-3 rounded-xl border border-teal-500/20 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-teal-300 uppercase">Solusi LogiTrack:</span>
                  <p className="text-slate-300 text-[11px]">{seg.logiTrackSolution}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Label Asumsi Pasar Akademik */}
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-200/90 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-300">[Transparansi Asumsi Akademik UAS E-Business]:</span>
            <p className="text-slate-300 leading-relaxed">
              Angka estimasi volume paket harian dan pangsa pasar kompetitor disadur dari estimasi publik
              Asperindo dan riset industri. Adapun proyeksi adopsi UMKM 50-2.500 seller dihitung sebagai model
              akademik rintisan digital-first untuk menilai kelayakan ekonomi unit bisnis (unit economics).
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          BAGIAN 3: ANALISIS KOMPETITOR (JNE, J&T, SICEPAT, ANTERAJA)
      ========================================================================= */}
      <section id="kompetitor" className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Users className="w-5 h-5 text-teal-400" />
          <h2 className="text-xl sm:text-2xl font-black text-white">
            3. Analisis Kompetitor &amp; Posisi Diferensiasi LogiTrack
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Tabel perbandingan objektif antara pemain ekspedisi incumbent skala nasional dengan LogiTrack:
        </p>

        {/* Tabel Komparasi Responsif */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Ekspedisi / Pemain</th>
                <th className="py-3.5 px-4 font-bold">Pangsa Pasar</th>
                <th className="py-3.5 px-4 font-bold">Kisaran Tarif Dasar</th>
                <th className="py-3.5 px-4 font-bold">Kecepatan SLA</th>
                <th className="py-3.5 px-4 font-bold">Kelemahan Konsumen</th>
                <th className="py-3.5 px-4 font-bold text-teal-400">Diferensiasi LogiTrack</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {COMPETITORS.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <span className="font-bold text-white text-sm block">{c.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{c.badge}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">{c.marketShareEstimate}</td>
                  <td className="py-3 px-4 font-semibold text-white">{c.averageRatePerKg}</td>
                  <td className="py-3 px-4">{c.speedSLA}</td>
                  <td className="py-3 px-4 text-rose-300 text-[11px] max-w-[200px]">
                    {c.weaknesses.join('; ')}
                  </td>
                  <td className="py-3 px-4 text-teal-300 text-[11px] font-medium max-w-[240px]">
                    {c.differentiationVsLogiTrack}
                  </td>
                </tr>
              ))}
              {/* Highlight LogiTrack */}
              <tr className="bg-teal-950/20 border-t-2 border-teal-500/40 font-semibold">
                <td className="py-3 px-4">
                  <span className="font-black text-teal-300 text-sm block">LogiTrack</span>
                  <span className="text-[10px] text-teal-400 font-mono">Platform E-Shipment Modern</span>
                </td>
                <td className="py-3 px-4 font-mono text-teal-300">Target 0.5 - 2% Segmen Tol Jawa</td>
                <td className="py-3 px-4 text-emerald-400 font-mono">Rp 10.000 - Rp 15.000 / Kg</td>
                <td className="py-3 px-4 text-white">1 - 3 Hari (Next-Day Koridor)</td>
                <td className="py-3 px-4 text-slate-400 text-[11px] italic">
                  Jaringan fisik awal fokus pada 18 kota strategis Jawa-Bali
                </td>
                <td className="py-3 px-4 text-white text-[11px] font-bold">
                  Resi atomik anti-balapan, konfirmasi kode 10-char anti-fraud, dan pelacakan Zero-PII aman.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* =========================================================================
          BAGIAN 4: ANALISIS SWOT
      ========================================================================= */}
      <section id="swot" className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Shield className="w-5 h-5 text-teal-400" />
          <h2 className="text-xl sm:text-2xl font-black text-white">4. Analisis SWOT Komprehensif</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SWOT_DATA.map((swot, idx) => {
            const colorClass =
              swot.category === 'Strengths'
                ? 'border-emerald-500/30 bg-emerald-950/10 text-emerald-400'
                : swot.category === 'Weaknesses'
                ? 'border-amber-500/30 bg-amber-950/10 text-amber-400'
                : swot.category === 'Opportunities'
                ? 'border-sky-500/30 bg-sky-950/10 text-sky-400'
                : 'border-rose-500/30 bg-rose-950/10 text-rose-400';

            return (
              <div
                key={idx}
                className={`rounded-2xl border ${colorClass} p-5 space-y-3 bg-slate-900/90 shadow-xl`}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span className="uppercase text-xs font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-950">
                      {swot.category}
                    </span>
                    <span>{swot.title}</span>
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {swot.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="space-y-0.5">
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                        <span>{item.point}</span>
                      </p>
                      <p className="text-[11px] text-slate-300 pl-5 leading-relaxed">{item.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          BAGIAN 5: STRATEGI BAURAN PEMASARAN 7P
      ========================================================================= */}
      <section id="7p" className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Tag className="w-5 h-5 text-teal-400" />
          <h2 className="text-xl sm:text-2xl font-black text-white">5. Strategi Bauran Pemasaran (Marketing Mix 7P)</h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Penerapan kerangka 7P sektor jasa logistik untuk memastikan proposisi nilai sampai secara terukur:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MARKETING_MIX_7P.map((m, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3 flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                  {m.pillar}
                </span>
                <h3 className="text-sm font-bold text-white">{m.title}</h3>
                <p className="text-xs text-slate-400">{m.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] space-y-1.5 text-slate-300">
                {m.details.map((d, dIdx) => (
                  <div key={dIdx} className="flex items-start gap-1.5">
                    <span className="text-teal-400 mt-0.5">&bull;</span>
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          BAGIAN 6: MODEL BISNIS & KALKULATOR TARIF AKTIF
      ========================================================================= */}
      <section id="model-tarif" className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <DollarSign className="w-5 h-5 text-teal-400" />
          <h2 className="text-xl sm:text-2xl font-black text-white">
            6. Model Bisnis &amp; Struktur Penetapan Tarif LogiTrack
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Penjelasan Model Monetisasi */}
          <div className="space-y-4 lg:col-span-1">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-teal-300">
                Aliran Pendapatan (Revenue Streams)
              </h3>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="font-bold text-white">1. Margin Selisih Tarif Pengiriman (Utama)</span>
                  <p className="text-slate-400 text-[11px]">
                    Margin 15% - 25% dari total ongkos kirim kotor per paket yang dibayar oleh pengirim.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="font-bold text-white">2. Biaya Penanganan Transaksi COD</span>
                  <p className="text-slate-400 text-[11px]">
                    Biaya administrasi 1.5% dari nominal tunai COD yang berhasil diverifikasi kurir.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="font-bold text-white">3. Premi Layanan Nilai Tambah (LogiCargo B2B)</span>
                  <p className="text-slate-400 text-[11px]">
                    Pengemasan kayu dan proteksi barang bernilai tinggi (asuransi opsional 0.2%).
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-950/20 border border-teal-500/20 text-xs text-slate-300 space-y-2">
              <span className="font-bold text-teal-300 block">Matriks Zona Asal-Tujuan Resmi:</span>
              <p className="text-[11px] text-slate-400">
                Tarif dihitung menggunakan fungsi resmi <code className="text-teal-300">calculateTariff</code> dari
                basis data <code className="text-teal-300">src/data/cities.ts</code> tanpa angka fiktif.
              </p>
            </div>
          </div>

          {/* Interactive Live Tariff Simulator */}
          <div className="rounded-2xl border border-teal-500/30 bg-slate-900 p-6 space-y-5 lg:col-span-2 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Simulator Tarif &amp; Margin Bisnis Langsung</h3>
                <p className="text-xs text-slate-400">
                  Uji coba perhitungan ongkir dan estimasi profitabilitas per paket menggunakan tarif riil.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">
                Live Engine
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Kota Asal (Origin)</label>
                <select
                  value={originCity}
                  onChange={(e) => setOriginCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  {INDONESIAN_CITIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} (Zona {c.zone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Kota Tujuan (Destination)</label>
                <select
                  value={destCity}
                  onChange={(e) => setDestCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  {INDONESIAN_CITIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} (Zona {c.zone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                  Berat Paket Aktual (Kg): <span className="text-teal-400 font-mono">{simWeight} Kg</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={simWeight}
                  onChange={(e) => setSimWeight(Number(e.target.value))}
                  className="w-full accent-teal-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Pilihan Layanan</label>
                <select
                  value={simService}
                  onChange={(e) => setSimService(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  {SERVICE_OPTIONS.map((s) => (
                    <option key={s.type} value={s.type}>
                      {s.name} ({s.eta}) &bull; Pengali {s.multiplier}x
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Hasil Perhitungan Live */}
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-xs space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Rute Zona</span>
                  <span className="font-bold font-mono text-white">
                    {tariffResult.originZone} &rarr; {tariffResult.destZone}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Tarif Dasar / Kg</span>
                  <span className="font-bold font-mono text-white">
                    Rp {tariffResult.baseRate.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Berat Tertagih</span>
                  <span className="font-bold font-mono text-white">
                    {tariffResult.chargeableWeightKg} Kg
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-teal-500/10 border border-teal-500/30">
                  <span className="text-[10px] text-teal-300 block font-semibold">Total Ongkir Konsumen</span>
                  <span className="font-black font-mono text-teal-400 text-sm">
                    Rp {tariffResult.shippingCost.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Rincian Alokasi Margin Unit Economics */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-300 gap-2">
                <span>
                  Estimasi Biaya Operasional Vendor Transportasi (80%):{' '}
                  <strong className="text-white font-mono">
                    Rp {Math.round(tariffResult.shippingCost * 0.8).toLocaleString('id-ID')}
                  </strong>
                </span>
                <span className="text-emerald-400 font-bold font-mono">
                  Estimasi Margin Kotor LogiTrack (20%): Rp{' '}
                  {Math.round(tariffResult.shippingCost * 0.2).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          BAGIAN 7: RENCANA GO-TO-MARKET (GTM 12 BULAN)
      ========================================================================= */}
      <section id="gtm" className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Calendar className="w-5 h-5 text-teal-400" />
          <h2 className="text-xl sm:text-2xl font-black text-white">
            7. Rencana Go-To-Market (GTM) 12 Bulan dalam 4 Kuartal
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Peta jalan peluncuran operasional dan komersialisasi platform LogiTrack secara terukur:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {GTM_TIMELINE.map((step, idx) => {
            const statusBadge =
              step.status === 'Selesai'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : step.status === 'Sedang Berjalan'
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/30 animate-pulse'
                : 'bg-slate-800 text-slate-400 border-slate-700';

            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white">{step.quarter}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge}`}>
                      {step.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">{step.months}</span>
                  <h3 className="text-sm font-bold text-teal-300">{step.phaseName}</h3>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Target Kinerja:</span>
                    <span dangerouslySetInnerHTML={{ __html: step.targetMetrics }} />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  {step.keyInitiatives.map((init, initIdx) => (
                    <div key={initIdx} className="flex items-start gap-1.5">
                      <ArrowRight className="w-3 h-3 text-teal-400 shrink-0 mt-0.5" />
                      <span>{init}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          BAGIAN 8: PROYEKSI FINANSIAL & OPERASIONAL DENGAN SLIDER INTERAKTIF
      ========================================================================= */}
      <section id="proyeksi" className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sliders className="w-5 h-5 text-teal-400" />
          <h2 className="text-xl sm:text-2xl font-black text-white">
            8. Proyeksi Finansial &amp; Operasional Sederhana (Simulator Interaktif)
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Gunakan slider di bawah untuk menguji skenario pertumbuhan bisnis LogiTrack. Angka dihitung secara
          real-time berdasarkan parameter asumsi eksplisit:
        </p>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Mitra UMKM Aktif:</span>
              <span className="font-bold text-teal-400 font-mono">{merchantCount} Toko</span>
            </div>
            <input
              type="range"
              min="50"
              max="3000"
              step="50"
              value={merchantCount}
              onChange={(e) => setMerchantCount(Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Min: 50 | Max: 3.000 UMKM</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Paket / Toko / Bulan:</span>
              <span className="font-bold text-teal-400 font-mono">{packagesPerMerchant} Paket</span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={packagesPerMerchant}
              onChange={(e) => setPackagesPerMerchant(Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Rata-rata volume order harian 1-5 paket</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Rata-rata Ongkir / Paket:</span>
              <span className="font-bold text-teal-400 font-mono">
                Rp {avgTicketPrice.toLocaleString('id-ID')}
              </span>
            </div>
            <input
              type="range"
              min="12000"
              max="45000"
              step="1000"
              value={avgTicketPrice}
              onChange={(e) => setAvgTicketPrice(Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Berdasarkan tarif zona rute Trans-Jawa</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Platform Take Rate:</span>
              <span className="font-bold text-emerald-400 font-mono">{platformTakeRate}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="30"
              step="1"
              value={platformTakeRate}
              onChange={(e) => setPlatformTakeRate(Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Net margin komisi operasional platform</span>
          </div>
        </div>

        {/* Live KPI Cards Output */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-1 shadow-lg">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Volume Paket Bulanan
            </span>
            <p className="text-2xl font-black text-white font-mono">
              {financialProjections.totalMonthlyPackages.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-slate-400">
              Tahunan: {financialProjections.annualPackages.toLocaleString('id-ID')} paket
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-1 shadow-lg">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              GMV Ongkir / Bulan
            </span>
            <p className="text-2xl font-black text-sky-400 font-mono">
              Rp {(financialProjections.monthlyGrossRevenue / 1000000).toFixed(1)} Jt
            </p>
            <p className="text-[10px] text-slate-400">
              Tahunan: Rp {(financialProjections.annualGrossRevenue / 1000000000).toFixed(2)} Miliar
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-5 space-y-1 shadow-lg">
            <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">
              Pendapatan Bersih Platform
            </span>
            <p className="text-2xl font-black text-emerald-300 font-mono">
              Rp {(financialProjections.monthlyNetRevenue / 1000000).toFixed(1)} Jt
            </p>
            <p className="text-[10px] text-slate-400">
              Tahunan: Rp {(financialProjections.annualNetRevenue / 1000000).toFixed(1)} Jt
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-1 shadow-lg">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Status Impas (BEP)
            </span>
            <p
              className={`text-lg font-black font-mono ${
                financialProjections.isProfitable ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {financialProjections.isProfitable ? '✓ Terlampaui (Profit)' : '⚠ Di Bawah BEP'}
            </p>
            <p className="text-[10px] text-slate-400">
              Titik impas: {financialProjections.breakEvenPackages.toLocaleString('id-ID')} paket/bln
            </p>
          </div>
        </div>

        {/* Kotak Asumsi Operasional */}
        <div className="rounded-2xl bg-slate-950 p-5 border border-slate-800 text-xs space-y-2">
          <span className="font-bold text-white block uppercase tracking-wider text-[11px]">
            Daftar Asumsi Model Finansial [UAS E-Business]:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-400 text-[11px]">
            <div>
              <strong className="text-slate-300">Biaya Tetap (Fixed Cost):</strong> Diasumsikan Rp 45.000.000 /
              bulan (hosting cloud Firebase, gaji 2 staf operasional/CS, amortisasi perangkat).
            </div>
            <div>
              <strong className="text-slate-300">Biaya Variabel (Vendor):</strong> 80-82% dari ongkos kirim kotor
              dibayarkan langsung kepada armada pengemudi truk atau vendor kargo Trans-Jawa.
            </div>
            <div>
              <strong className="text-slate-300">Retensi Pengguna:</strong> Diasumsikan 85% UMKM aktif melakukan
              repeat shipping setiap minggu berkat kemudahan cetak resi thermal.
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          BAGIAN 9: RISIKO & MITIGASI
      ========================================================================= */}
      <section id="risiko" className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl sm:text-2xl font-black text-white">
            9. Matriks Manajemen Risiko &amp; Strategi Mitigasi
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Identifikasi potensi risiko bisnis, teknis, dan operasional beserta langkah mitigasi preventif:
        </p>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Kategori Risiko</th>
                <th className="py-3.5 px-4 font-bold">Uraian Risiko &amp; Potensi Dampak</th>
                <th className="py-3.5 px-4 font-bold text-center">Peluang</th>
                <th className="py-3.5 px-4 font-bold text-center">Dampak</th>
                <th className="py-3.5 px-4 font-bold text-teal-400">Strategi Mitigasi LogiTrack</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {RISK_MATRIX.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-bold text-white text-xs">{r.category}</td>
                  <td className="py-3 px-4 text-slate-300 text-[11px] max-w-[220px]">{r.riskName}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.likelihood === 'Tinggi'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {r.likelihood}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.impact === 'Tinggi'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {r.impact}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-teal-300 text-[11px] leading-relaxed max-w-[300px]">
                    {r.mitigationStrategy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Call to Action Footer */}
      <div className="rounded-3xl border border-teal-500/40 bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950 p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-white">Siap Menguji Coba Ekspedisi Darat LogiTrack?</h3>
          <p className="text-xs text-slate-300">
            Jelajahi alur Send-Receive Automatic, cetak label resi thermal, atau uji verifikasi kode penerima.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('kirim')}
            className="flex items-center gap-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Kirim Paket Demo</span>
          </button>
          <button
            onClick={() => onNavigate('lacak')}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 transition cursor-pointer"
          >
            <Truck className="w-4 h-4 text-teal-400" />
            <span>Lacak Resi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
