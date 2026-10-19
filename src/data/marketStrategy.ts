/**
 * LogiTrack Market Strategy & Business Planning Data (UAS E-Business)
 * Seluruh data statistik berbasis laporan industri resmi atau diberi label [Asumsi Akademik].
 */

export interface CompetitorComparison {
  name: string;
  badge: string;
  marketShareEstimate: string;
  averageRatePerKg: string;
  speedSLA: string;
  keyStrengths: string[];
  weaknesses: string[];
  differentiationVsLogiTrack: string;
}

export interface SwotItem {
  category: 'Strengths' | 'Weaknesses' | 'Opportunities' | 'Threats';
  title: string;
  items: { point: string; explanation: string }[];
}

export interface MarketingMix7P {
  pillar: string;
  title: string;
  description: string;
  details: string[];
  icon: string;
}

export interface GtmMilestone {
  quarter: string;
  months: string;
  phaseName: string;
  targetMetrics: string;
  keyInitiatives: string[];
  status: 'Selesai' | 'Sedang Berjalan' | 'Direncanakan';
}

export interface RiskItem {
  category: string;
  riskName: string;
  likelihood: 'Rendah' | 'Sedang' | 'Tinggi';
  impact: 'Rendah' | 'Sedang' | 'Tinggi';
  mitigationStrategy: string;
}

// 1. DATA ANALISIS PASAR & SUMBER
export const MARKET_INSIGHTS = {
  nationalStats: [
    {
      label: 'Ukuran Ekonomi Digital Indonesia',
      value: '~US$ 82 Miliar',
      source: 'Google, Temasek, Bain & Company - e-Conomy SEA Report 2023/2024',
      annotation: 'Diproyeksikan mencapai US$ 110 Miliar pada 2025, ditopang sektor e-commerce dan logistik.',
    },
    {
      label: 'Estimasi Volume Paket Harian Nasional',
      value: '6.000.000+ Paket/Hari',
      source: 'Asperindo (Asosiasi Jasa Pengiriman Ekspres Indonesia) - Estimasi 2023',
      annotation: 'Lonjakan pesat pada belanja media sosial (TikTok Shop, Instagram, WhatsApp).',
    },
    {
      label: 'UMKM Go-Digital',
      value: '22+ Juta Pelaku Usaha',
      source: 'Kementerian Koperasi dan UKM RI (KemenkopUKM) - Kuartal IV 2023',
      annotation: 'Target nasional mencapai 30 juta UMKM terdigitalisasi, memerlukan logistik handal dan hemat biaya.',
    },
    {
      label: 'Rasio Biaya Logistik terhadap PDB',
      value: '~14.29% PDB',
      source: 'Kementerian Perencanaan Pembangunan Nasional (Bappenas) - Kajian 2023',
      annotation: 'Peluang besar bagi optimalisasi rute ekspedisi darat terpadu via Tol Trans-Jawa.',
    },
  ],
  marketSegments: [
    {
      name: 'UMKM & Social Commerce Sellers',
      share: '55%',
      badge: 'Target Primer',
      profile: 'Pedagang online di TikTok Shop, Shopee, Instagram, dan WhatsApp yang mengirim 5-50 paket per hari.',
      painPoints: 'Biaya kirim tinggi, risiko pesanan fiktif COD, nomor resi lambat terbit, klaim paket hilang sulit.',
      logiTrackSolution: 'Penerbitan resi instan atomik, verifikasi penerima 10-karakter anti-penipuan, tarif terprediksi zona Trans-Jawa.',
    },
    {
      name: 'Pengirim Individu & C2C',
      share: '30%',
      badge: 'Target Sekunder',
      profile: 'Masyarakat umum yang mengirim barang personal, berkas penting, oleh-oleh antar-kota.',
      painPoints: 'Alamat dan nomor telepon bocor ke publik saat nomor resi dibagikan untuk pelacakan.',
      logiTrackSolution: 'Zero-PII Public Tracking (nama jalan dan nomor telepon disamarkan), live GPS kurir di peta.',
    },
    {
      name: 'Distributor & B2B Kargo Ringan',
      share: '15%',
      badge: 'Target Pelengkap',
      profile: 'Toko grosir, konveksi tekstil, dan industri kreatif kota tier-2/tier-3 (Solo, Cirebon, Malang, Pekalongan).',
      painPoints: 'Layanan kargo konvensional lambat dan memiliki batas minimum berat yang terlalu tinggi (misal 50 kg).',
      logiTrackSolution: 'Layanan LogiCargo dengan batas minimum ekonomis 10 kg dan diskon pengali tarif 0.7x.',
    },
  ],
};

// 2. ANALISIS KOMPETITOR
export const COMPETITORS: CompetitorComparison[] = [
  {
    name: 'JNE Express',
    badge: 'Incumbent Tradisional',
    marketShareEstimate: '~25 - 30% [Asumsi Pasar]',
    averageRatePerKg: 'Rp 11.000 - Rp 14.000 (Jkt - Bdg)',
    speedSLA: '1 - 3 Hari (Reguler / YES)',
    keyStrengths: [
      'Jaringan fisik agen drop-point sangat luas hingga pelosok kecamatan.',
      'Brand equity dan kepercayaan konsumen sangat tinggi.',
    ],
    weaknesses: [
      'Antrean loket manual sering panjang bagi pengirim mandiri.',
      'Data pelacakan publik sering menampilkan nomor telepon dan nama penerima lengkap.',
      'Penetapan harga kargo kurang fleksibel untuk UMKM skala mikro.',
    ],
    differentiationVsLogiTrack:
      'LogiTrack mengotomasi alur Send-Receive via web PWA tanpa antre, dilengkapi verifikasi digital penerima tanpa bocor data pribadi.',
  },
  {
    name: 'J&T Express',
    badge: 'E-Commerce Heavyweight',
    marketShareEstimate: '~28 - 32% [Asumsi Pasar]',
    averageRatePerKg: 'Rp 10.000 - Rp 13.000 (Jkt - Bdg)',
    speedSLA: '1 - 2 Hari (EZ / Super)',
    keyStrengths: [
      'Integrasi bawaan (default 3PL) di platform marketplace besar (Shopee).',
      'Operasional 365 hari tanpa libur dengan pusat sortir otomatis modern.',
    ],
    weaknesses: [
      'Keluhan penerimaan paket dilempar tanpa verifikasi penerima yang sah.',
      'Kurang fleksibel bagi pedagang social commerce yang berjualan di luar marketplace terikat.',
    ],
    differentiationVsLogiTrack:
      'LogiTrack memberikan kode konfirmasi 10-karakter unik sehingga kurir tidak bisa sembarangan menandai paket "Terkirim" sebelum diverifikasi pembeli.',
  },
  {
    name: 'SiCepat Ekspres',
    badge: 'Fast Logistics Challenger',
    marketShareEstimate: '~15 - 18% [Asumsi Pasar]',
    averageRatePerKg: 'Rp 10.000 - Rp 12.500 (Jkt - Bdg)',
    speedSLA: '1 - 2 Hari (SIUNTUNG / BEST)',
    keyStrengths: [
      'Fitur timbangan presisi dan layanan pick-up paket cepat ke tempat penjual.',
      'Fokus kuat pada komunitas seller e-commerce.',
    ],
    weaknesses: [
      'Kerap terjadi isu balapan sistem saat peak season promo diskon kilat.',
      'Antarmuka pelacakan masih berbasis teks statis, jarang menampilkan visualisasi pergerakan armada langsung di peta.',
    ],
    differentiationVsLogiTrack:
      'LogiTrack memiliki generator resi atomik anti-balapan yang tahan klik ganda dan peta Leaflet interaktif dengan live update posisi kurir.',
  },
  {
    name: 'Anteraja',
    badge: 'Tech-Enabled Logistics',
    marketShareEstimate: '~10 - 12% [Asumsi Pasar]',
    averageRatePerKg: 'Rp 10.000 - Rp 13.000 (Jkt - Bdg)',
    speedSLA: '1 - 3 Hari (Reguler / Next Day)',
    keyStrengths: [
      'Pendekatan digital-first dan penjemputan oleh kurir (Satria).',
      'Integrasi erat dengan ekosistem Tokopedia dan GoTo.',
    ],
    weaknesses: [
      'Cakupan rute antar-kota tier-2 dan tier-3 masih bertahap.',
      'Biaya layanan ekspres lebih mahal untuk pengiriman berat di atas 5 kg.',
    ],
    differentiationVsLogiTrack:
      'LogiTrack mengoptimalkan rute Trans-Jawa 18 kota dengan biaya proporsional zona dan keterbukaan pool penjemputan untuk armada kurir lokal.',
  },
];

// 3. ANALISIS SWOT
export const SWOT_DATA: SwotItem[] = [
  {
    category: 'Strengths',
    title: 'Kekuatan Internal',
    items: [
      {
        point: 'Resi Atomik Anti-Balapan',
        explanation: 'Transaksi Firebase atomik pada dokumen penghitung harian menjamin nomor resi unik tanpa duplikasi walau terjadi klik ganda serentak.',
      },
      {
        point: 'Keamanan Data & Privasi Zero-PII',
        explanation: 'Tracking publik menerapkan masking otomatis pada nama jalan dan telepon, mencegah kebocoran informasi pribadi konsumen.',
      },
      {
        point: 'Konfirmasi Digital Penerima Mandiri',
        explanation: 'Kode rahasia 10-karakter (32^10 kombinasi) menjamin paket hanya dapat diselesaikan saat barang benar-benar diterima.',
      },
      {
        point: 'Teknologi Modern PWA Hemat Daya',
        explanation: 'Dapat diinstal langsung di layar ponsel kurir dan pengirim tanpa unduhan Play Store yang memakan memori ponsel.',
      },
    ],
  },
  {
    category: 'Weaknesses',
    title: 'Kelemahan Internal',
    items: [
      {
        point: 'Jaringan Fisik Awal Terbatas',
        explanation: 'Fokus awal melayani 18 kota strategis Jawa, Bali, dan Lampung, belum mencakup wilayah pedalaman terpencil.',
      },
      {
        point: 'Ketergantungan Infrastruktur Web Browser',
        explanation: 'Pemindaian barcode memerlukan browser modern dengan izin kamera HTTPS dan koneksi internet stabil.',
      },
      {
        point: 'Brand Awareness Baru',
        explanation: 'Sebagai platform rintisan, memerlukan upaya edukasi dan insentif kepercayaan untuk meyakinkan penjual online berpindah.',
      },
    ],
  },
  {
    category: 'Opportunities',
    title: 'Peluang Eksternal',
    items: [
      {
        point: 'Ledakan Social Commerce (TikTok & Live Selling)',
        explanation: 'Ribuan seller independen membutuhkan solusi pengiriman mandiri yang tidak terikat komisi tinggi marketplace konvensional.',
      },
      {
        point: 'Efisiensi Tol Trans-Jawa',
        explanation: 'Konektivitas jalan tol Trans-Jawa memangkas waktu tempuh Jakarta - Surabaya menjadi <12 jam, membuka potensi pengiriman darat cepat Next-Day.',
      },
      {
        point: 'Program Digitalisasi 30 Juta UMKM',
        explanation: 'Kebijakan pemerintah mendorong digitalisasi usaha mikro membuka ceruk pasar penjual lokal di kota tier-2/tier-3.',
      },
    ],
  },
  {
    category: 'Threats',
    title: 'Ancaman Eksternal',
    items: [
      {
        point: 'Perang Tarif oleh Pemain Modal Raksasa',
        explanation: 'Kompetitor incumbent dapat melakukan subsidi ongkir agresif untuk mempertahankan dominasi volume pasar.',
      },
      {
        point: 'Fluktuasi Harga Bahan Bakar (BBM)',
        explanation: 'Kenaikan tarif tol dan harga BBM bersubsidi dapat memicu lonjakan biaya operasional armada darat.',
      },
      {
        point: 'Tantangan Cuaca Ekstrem Jalur Darat',
        explanation: 'Banjir pantura atau longsor jalur lintas provinsi dapat mengganggu kepatuhan SLA estimasi tiba.',
      },
    ],
  },
];

// 4. BAURAN PEMASARAN (MARKETING MIX 7P)
export const MARKETING_MIX_7P: MarketingMix7P[] = [
  {
    pillar: 'Product (Produk)',
    title: 'Tiga Tingkat Layanan Ekspedisi Darat Terintegrasi',
    description: 'Solusi pengiriman logistik darat adaptif yang menjawab seluruh kebutuhan berat dan kecepatan barang.',
    details: [
      'LogiReguler: Estimasi 2-3 hari untuk kebutuhan hemat harian (pengali 1.0x).',
      'LogiExpress: Prioritas Next-Day esok hari sampai di koridor Trans-Jawa (pengali 1.5x).',
      'LogiCargo: Kargo ekonomis mulai 10 kg dengan tarif bersahabat bagi distributor (pengali 0.7x).',
      'Pelacakan Visual Interaktif: Peta rute titik asal-tujuan dengan koordinat GPS terkini kurir.',
      'Sistem Konfirmasi Penerima Mandiri: Kode otentikasi digital sebagai bukti serah terima sah.',
    ],
    icon: 'Package',
  },
  {
    pillar: 'Price (Harga)',
    title: 'Tarif Berbasis Zona Transparan Tanpa Biaya Tersembunyi',
    description: 'Formula penetapan harga berbasis zona geografis A, B, C, D dan berat tertagih (aktual vs volumetrik 5000).',
    details: [
      'Tarif Intrazona (Zona A - A / B - B): Mulai Rp 10.000 - Rp 12.000 / Kg.',
      'Tarif Antarzona (Zona A - B): Rp 15.000 / Kg (Jakarta - Bandung).',
      'Tarif Jarak Menengah (Zona A - C): Rp 22.000 / Kg (Jakarta - Surabaya / Denpasar).',
      'Formula Volumetrik Standar: (P × L × T) / 5000 kg, melindungi kapasitas kargo darat.',
      'Simulasi Pembayaran Transparan: Opsi Transfer Bank, QRIS, dan COD terverifikasi.',
    ],
    icon: 'Tag',
  },
  {
    pillar: 'Place (Tempat / Saluran)',
    title: 'Aplikasi Web PWA Multichannel & Koridor Trans-Jawa',
    description: 'Aksesibilitas digital 24/7 tanpa batas ruang dan drop-point di 18 kota strategis Indonesia.',
    details: [
      'Platform Web Responsif & PWA: Beroperasi lancar dari smartphone Android, iOS, maupun laptop kasir.',
      'Cakupan Koridor Trans-Jawa & Bali: 18 kota terhubung (Jakarta, Bandung, Semarang, Solo, Jogja, Surabaya, Malang, Banyuwangi, Denpasar).',
      'Gerbang Sumatera: Bandar Lampung dan Palembang terintegrasi penyeberangan Merak-Bakauheni.',
    ],
    icon: 'MapPin',
  },
  {
    pillar: 'Promotion (Promosi)',
    title: 'Pertumbuhan Berbasis Komunitas UMKM & Edukasi Keamanan',
    description: 'Strategi pemasaran terukur yang fokus pada advokasi komunitas penjual dan kepercayaan data.',
    details: [
      'Kampanye "Kirim Tenang Resi Aman": Menyoroti fitur anti-bocor nomor kontak pembeli.',
      'Program LogiPartner UMKM: Diskon volume bertingkat bagi penjual dengan pengiriman >50 paket/bulan.',
      'Demonstrasi Langsung Simulasi COD: Membangun kepercayaan calon pengguna melalui transparansi sistem.',
    ],
    icon: 'Megaphone',
  },
  {
    pillar: 'People (Sumber Daya Manusia)',
    title: 'Kurir Terverifikasi & Dukungan Pelanggan Responsif',
    description: 'Fokus pada integritas armada lapangan dan profesionalisme layanan.',
    details: [
      'Portal Khusus Kurir: Kurir memiliki akun resmi untuk memantau tugas penjemputan dan rute.',
      'Pelatihan Etika Serah Terima: Kurir diwajibkan meminta kode konfirmasi sebelum menyerahkan paket.',
      'Admin Operasional Proaktif: Dashboard pusat kontrol untuk memitigasi kendala keterlambatan.',
    ],
    icon: 'Users',
  },
  {
    pillar: 'Process (Proses Operasional)',
    title: 'Send-Receive Automatic 3 Langkah Efisien',
    description: 'Otomatisasi proses yang memangkas waktu tunggu dari pendaftaran hingga paket terkirim.',
    details: [
      'Langkah 1: Input cepat data pengirim, penerima, berat paket, dan rute.',
      'Langkah 2: Terbit resi LGT otomatis seketika dengan kode QR dan label thermal siap cetak.',
      'Langkah 3: Kurir klaim paket dari antrean pool penjemputan dan memperbarui status secara berurutan.',
      'Langkah 4: Penerima verifikasi kode rahasia di halaman /terima/:kode untuk menutup pesanan.',
    ],
    icon: 'RefreshCw',
  },
  {
    pillar: 'Physical Evidence (Bukti Fisik)',
    title: 'Label Resi Standar Thermal & Jejak Digital Transparan',
    description: 'Sentuhan fisik profesional yang meningkatkan derajat kepercayaan pelanggan.',
    details: [
      'Label Resi Ukuran Thermal 10x15cm: Memuat Barcode, QR Code pelacakan, berat tertagih, dan kota rute.',
      'Desain Bersih Bebas Bocoran PIN: Kode konfirmasi tidak dicetak di luar kardus demi mencegah pencurian.',
      'Tanda Terima Digital: Notifikasi otomatis dan ringkasan penyelesaian transaksi dengan stempel waktu resmi.',
    ],
    icon: 'FileCheck2',
  },
];

// 5. RENCANA GO-TO-MARKET (12 BULAN)
export const GTM_TIMELINE: GtmMilestone[] = [
  {
    quarter: 'Q1 (Bulan 1 - 3)',
    months: 'Januari - Maret',
    phaseName: 'Fase Fondasi & Uji Coba Pilot Koridor Jabodetabek-Bandung',
    targetMetrics: '50 Mitra UMKM Pilot &bull; 1.500 Paket/Bulan &bull; SLA Tepat Waktu 96%',
    status: 'Selesai',
    keyInitiatives: [
      'Finalisasi arsitektur web PWA, Firestore security rules, dan modul atomic counter resi.',
      'Uji coba pemindai barcode kamera ponsel di kondisi pencahayaan toko UMKM nyata.',
      'Peluncuran pilot tertutup di rute Jakarta, Bogor, Depok, Tangerang, Bekasi, dan Bandung.',
      'Penyusunan Standard Operating Procedure (SOP) kurir dalam verifikasi kode konfirmasi 10-karakter.',
    ],
  },
  {
    quarter: 'Q2 (Bulan 4 - 6)',
    months: 'April - Juni',
    phaseName: 'Komersialisasi Koridor Tol Trans-Jawa Penuh',
    targetMetrics: '350 Mitra UMKM &bull; 12.000 Paket/Bulan &bull; Kepuasan Pengguna 4.8/5.0',
    status: 'Sedang Berjalan',
    keyInitiatives: [
      'Pembukaan pool kurir mandiri di hub Semarang, Solo, Yogyakarta, Surabaya, dan Malang.',
      'Kampanye promosi ongkir flat khusus produk fesyen & kerajinan tangan UMKM Jawa Tengah & Timur.',
      'Aktivasi fitur pembayaran simulasi QRIS instan dan rekonsiliasi COD real-time.',
      'Program kemitraan dengan 5 komunitas seller online terkemuka di media sosial.',
    ],
  },
  {
    quarter: 'Q3 (Bulan 7 - 9)',
    months: 'Juli - September',
    phaseName: 'Ekspansi Gerbang Wisata & Pintu Masuk Sumatera',
    targetMetrics: '1.000 Mitra UMKM &bull; 35.000 Paket/Bulan &bull; Penurunan Komplain <0.5%',
    status: 'Direncanakan',
    keyInitiatives: [
      'Ekspansi rute darat-penyeberangan ke Banyuwangi - Denpasar (Bali) dan Lampung - Palembang.',
      'Peluncuran layanan LogiCargo khusus pengiriman barang berat industri kreatif (min 10 kg).',
      'Peningkatan kemampuan offline caching Service Worker PWA untuk area minim sinyal seluler.',
      'Integrasi program referral antar-pedagang dengan insentif gratis ongkir 5 paket pertama.',
    ],
  },
  {
    quarter: 'Q4 (Bulan 10 - 12)',
    months: 'Oktober - Desember',
    phaseName: 'Skala Penuh & Kesiapan Kampanye Akhir Tahun (Peak Season)',
    targetMetrics: '2.500 Mitra UMKM &bull; 80.000+ Paket/Bulan &bull; Break-Even Point (BEP) Operasional',
    status: 'Direncanakan',
    keyInitiatives: [
      'Optimasi infrastruktur sistem menghadapi lonjakan transaksi festival belanja 11.11 dan 12.12 Harbolnas.',
      'Penyediaan API webhook pengiriman untuk platform toko online mandiri (WooCommerce/Shopify).',
      'Laporan performa tahunan dan audit operasional kepatuhan data privasi bersama Asperindo.',
    ],
  },
];

// 6. MATRIKS RISIKO DAN MITIGASI
export const RISK_MATRIX: RiskItem[] = [
  {
    category: 'Keamanan Data & Privasi',
    riskName: 'Penyalahgunaan data pribadi (nomor HP dan alamat rumah) oleh oknum luar',
    likelihood: 'Sedang',
    impact: 'Tinggi',
    mitigationStrategy:
      'LogiTrack menerapkan Zero-PII public tracking di mana detail alamat jalan dan nomor HP disamarkan secara default; hanya kota asal dan tujuan yang terlihat di antarmuka publik.',
  },
  {
    category: 'Integritas Sistem',
    riskName: 'Balapan resi / nomor ganda saat ribuan pesanan dibuat serentak (Race Condition)',
    likelihood: 'Sedang',
    impact: 'Tinggi',
    mitigationStrategy:
      'Penerbitan nomor resi dikunci menggunakan transaksi Firestore atomik pada koleksi counters/tracking_YYYYMMDD dengan aturan validasi ketat resource.data.currentSeq + 1.',
  },
  {
    category: 'Kecurangan Lapangan (Fraud)',
    riskName: 'Kurir nakal menandai paket terkirim padahal belum sampai atau barang hilang',
    likelihood: 'Sedang',
    impact: 'Tinggi',
    mitigationStrategy:
      'Penerapan kode konfirmasi rahasia 10-karakter unik di dokumen receiptKeys. Pengiriman tidak dapat diselesaikan menjadi status Terkirim tanpa input kode valid dari penerima atau pengirim.',
  },
  {
    category: 'Operasional Lapangan',
    riskName: 'Keterlambatan armada darat akibat kemacetan atau cuaca buruk di jalan tol',
    likelihood: 'Tinggi',
    impact: 'Sedang',
    mitigationStrategy:
      'Sistem pembaruan GPS real-time kurir dan status kendala transparan (Gagal Kirim / Dibatalkan) dengan notifikasi instan langsung ke dashboard pengirim beserta alasan tercatat.',
  },
  {
    category: 'Persaingan Pasar',
    riskName: 'Perang diskon tarif agresif dari ekspedisi konglomerasi incumbent',
    likelihood: 'Tinggi',
    impact: 'Sedang',
    mitigationStrategy:
      'Fokus diferensiasi pada kenyamanan pedagang social commerce (tanpa komisi marketplace), kecepatan Send-Receive tanpa antre, dan transparansi COD aman daripada sekadar bakar uang.',
  },
];
