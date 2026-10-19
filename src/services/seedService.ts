import { collection, doc, setDoc, getDoc, getDocs, query, limit } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { Shipment, ShipmentEvent, UserProfile } from '../types';
import { INDONESIAN_CITIES } from '../data/cities';

export const DEMO_USERS: UserProfile[] = [
  {
    uid: 'demo_user_sender_01',
    email: 'andi.pengirim@logitrack.id',
    displayName: 'Andi Pratama (Pengirim Demo)',
    role: 'sender',
    phone: '081234567890',
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'demo_user_courier_01',
    email: 'budi.kurir@logitrack.id',
    displayName: 'Budi Santoso (Kurir Demo)',
    role: 'courier',
    phone: '082198765432',
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'demo_user_admin_01',
    email: 'admin@logitrack.id',
    displayName: 'Hendra Wijaya (Admin Demo)',
    role: 'admin',
    phone: '08111223344',
    createdAt: new Date().toISOString(),
  },
];

export async function seedDemoDataIfEmpty(force = false): Promise<boolean> {
  try {
    if (!force) {
      const demoDoc = await getDoc(doc(db, 'shipments', 'DEMO-SHP-004'));
      if (demoDoc.exists()) {
        return false; // Demo data already exists
      }
    }

    const now = new Date();
    const subHours = (hours: number) =>
      new Date(now.getTime() - hours * 3600 * 1000).toISOString();

    const jkt = INDONESIAN_CITIES[0];
    const bdg = INDONESIAN_CITIES[5];
    const smg = INDONESIAN_CITIES[7];
    const sub = INDONESIAN_CITIES[10];
    const dps = INDONESIAN_CITIES[14];

    // Seed Demo Shipments
    const demoShipments: Shipment[] = [
      {
        id: 'DEMO-SHP-001',
        trackingNumber: 'LGT-20261019-1001',
        senderId: 'demo_user_sender_01',
        senderName: 'Andi Pratama',
        senderPhone: '081234567890',
        senderAddress: 'Jl. Sudirman No. 45, Jakarta Pusat',
        senderCity: jkt.name,
        receiverName: 'Siti Rahmawati',
        receiverPhone: '085711223344',
        receiverAddress: 'Jl. Dago Asri No. 12, Bandung',
        receiverCity: bdg.name,
        receiverEmail: 'siti.rahmawati@gmail.com',
        packageDescription: 'Dokumen Penting & Sampel Tekstil',
        weightKg: 2,
        lengthCm: 25,
        widthCm: 20,
        heightCm: 10,
        chargeableWeightKg: 2,
        serviceType: 'REGULER',
        shippingCost: 30000,
        baseRate: 15000,
        confirmationCode: '482910',
        status: 'Paket Terdaftar',
        paymentMethod: 'TRANSFER',
        paymentStatus: 'Belum Bayar',
        originCoords: { lat: jkt.lat, lng: jkt.lng, cityName: jkt.name },
        destinationCoords: { lat: bdg.lat, lng: bdg.lng, cityName: bdg.name },
        currentCourierLocation: { lat: jkt.lat, lng: jkt.lng, cityName: jkt.name },
        createdAt: subHours(3),
        updatedAt: subHours(3),
        isDemo: true,
      },
      {
        id: 'DEMO-SHP-002',
        trackingNumber: 'LGT-20261019-2045',
        senderId: 'demo_user_sender_01',
        senderName: 'Andi Pratama',
        senderPhone: '081234567890',
        senderAddress: 'Kawasan Industri Candi, Semarang',
        senderCity: smg.name,
        receiverName: 'Bambang Irawan',
        receiverPhone: '081399887766',
        receiverAddress: 'Ruko Darmo Permai, Surabaya',
        receiverCity: sub.name,
        receiverEmail: 'bambang.irawan@gmail.com',
        packageDescription: 'Sparepart Mesin Cetak Industri',
        weightKg: 8,
        lengthCm: 40,
        widthCm: 30,
        heightCm: 25,
        chargeableWeightKg: 8,
        serviceType: 'EXPRESS',
        shippingCost: 216000,
        baseRate: 18000,
        confirmationCode: '725184',
        status: 'Dalam Perjalanan',
        paymentMethod: 'QRIS',
        paymentStatus: 'Lunas',
        paidAt: subHours(12),
        assignedCourierId: 'demo_user_courier_01',
        assignedCourierName: 'Budi Santoso',
        originCoords: { lat: smg.lat, lng: smg.lng, cityName: smg.name },
        destinationCoords: { lat: sub.lat, lng: sub.lng, cityName: sub.name },
        // Kurir is actively in transit between Semarang & Surabaya (e.g., near Tuban / Bojonegoro)
        currentCourierLocation: {
          lat: -7.05,
          lng: 111.85,
          cityName: 'Lintas Pantura Jateng-Jatim',
          updatedAt: subHours(1),
        },
        createdAt: subHours(14),
        updatedAt: subHours(1),
        isDemo: true,
      },
      {
        id: 'DEMO-SHP-003',
        trackingNumber: 'LGT-20261019-3312',
        senderId: 'demo_user_sender_01',
        senderName: 'Toko Elektronik Makmur',
        senderPhone: '08119876543',
        senderAddress: 'Mangga Dua Mall Blok B, Jakarta',
        senderCity: jkt.name,
        receiverName: 'Dewi Lestari',
        receiverPhone: '081822334455',
        receiverAddress: 'Jl. Teuku Umar No. 88, Denpasar, Bali',
        receiverCity: dps.name,
        receiverEmail: 'dewi.lestari@gmail.com',
        packageDescription: 'Laptop Ultrabook & Aksesoris',
        weightKg: 4,
        lengthCm: 45,
        widthCm: 35,
        heightCm: 15,
        chargeableWeightKg: 5,
        serviceType: 'EXPRESS',
        shippingCost: 165000,
        baseRate: 22000,
        confirmationCode: '914302',
        status: 'Terkirim',
        paymentMethod: 'TRANSFER',
        paymentStatus: 'Lunas',
        paidAt: subHours(48),
        assignedCourierId: 'demo_user_courier_01',
        assignedCourierName: 'Budi Santoso',
        originCoords: { lat: jkt.lat, lng: jkt.lng, cityName: jkt.name },
        destinationCoords: { lat: dps.lat, lng: dps.lng, cityName: dps.name },
        currentCourierLocation: { lat: dps.lat, lng: dps.lng, cityName: dps.name },
        deliveredAt: subHours(2),
        receiverNotes: 'Diterima langsung oleh Dewi Lestari (Tanda tangan digital penerima).',
        createdAt: subHours(50),
        updatedAt: subHours(2),
        isDemo: true,
      },
      {
        id: 'DEMO-SHP-004',
        trackingNumber: 'LGT-20261019-4409',
        senderId: 'demo_user_sender_01',
        senderName: 'Andi Pratama',
        senderPhone: '081234567890',
        senderAddress: 'Kemang Pratama Raya, Bekasi',
        senderCity: 'Kota Bekasi',
        receiverName: 'Rian Saputra',
        receiverPhone: '087788990011',
        receiverAddress: 'Jl. R.E. Martadinata No. 71, Bandung',
        receiverCity: bdg.name,
        packageDescription: 'Sepatu Kulit Handmade & Dompet',
        weightKg: 2,
        lengthCm: 30,
        widthCm: 20,
        heightCm: 12,
        chargeableWeightKg: 2,
        serviceType: 'REGULER',
        shippingCost: 30000,
        baseRate: 15000,
        confirmationCode: '315789',
        status: 'Sedang Diantar',
        paymentMethod: 'COD',
        paymentStatus: 'Bayar di Tempat',
        assignedCourierId: 'demo_user_courier_01',
        assignedCourierName: 'Budi Santoso',
        originCoords: { lat: -6.2383, lng: 106.9756, cityName: 'Kota Bekasi' },
        destinationCoords: { lat: bdg.lat, lng: bdg.lng, cityName: bdg.name },
        currentCourierLocation: {
          lat: -6.915,
          lng: 107.618,
          cityName: 'Bandung Kota (Dekat Lokasi Tujuan)',
          updatedAt: subHours(0.5),
        },
        createdAt: subHours(18),
        updatedAt: subHours(0.5),
        isDemo: true,
      },
    ];

    for (const shp of demoShipments) {
      await setDoc(doc(db, 'shipments', shp.id), shp);
    }

    // Seed Events for the in-progress and completed shipments
    const demoEvents: ShipmentEvent[] = [
      {
        id: 'EVT-001-1',
        shipmentId: 'DEMO-SHP-001',
        trackingNumber: 'LGT-20261019-1001',
        status: 'Paket Terdaftar',
        title: 'Paket Berhasil Didaftarkan',
        description: 'Pengiriman dibuat via sistem Send-Receive Automatic. Menunggu pembayaran.',
        location: 'DKI Jakarta',
        timestamp: subHours(3),
      },
      {
        id: 'EVT-002-1',
        shipmentId: 'DEMO-SHP-002',
        trackingNumber: 'LGT-20261019-2045',
        status: 'Paket Terdaftar',
        title: 'Paket Berhasil Didaftarkan',
        description: 'Pengiriman didaftarkan oleh Andi Pratama.',
        location: 'Kota Semarang',
        timestamp: subHours(14),
      },
      {
        id: 'EVT-002-2',
        shipmentId: 'DEMO-SHP-002',
        trackingNumber: 'LGT-20261019-2045',
        status: 'Dijemput',
        title: 'Pembayaran Lunas & Dijemput Kurir',
        description: 'Pembayaran QRIS Rp 216.000 terverifikasi. Kurir Budi Santoso menjemput paket.',
        location: 'Kota Semarang',
        timestamp: subHours(12),
      },
      {
        id: 'EVT-002-3',
        shipmentId: 'DEMO-SHP-002',
        trackingNumber: 'LGT-20261019-2045',
        status: 'Di Gudang',
        title: 'Sortir Hub Sentral Logistik',
        description: 'Paket disortir dan dimuat ke truk armada ekspedisi darat Tol Trans-Jawa.',
        location: 'Semarang Hub',
        timestamp: subHours(8),
      },
      {
        id: 'EVT-002-4',
        shipmentId: 'DEMO-SHP-002',
        trackingNumber: 'LGT-20261019-2045',
        status: 'Dalam Perjalanan',
        title: 'Dalam Perjalanan Antar Kota',
        description: 'Armada darat melintasi rute tol Semarang - Surabaya. Kurir membagikan posisi GPS.',
        location: 'Lintas Pantura Jateng-Jatim',
        timestamp: subHours(1),
      },
      {
        id: 'EVT-003-1',
        shipmentId: 'DEMO-SHP-003',
        trackingNumber: 'LGT-20261019-3312',
        status: 'Paket Terdaftar',
        title: 'Paket Terdaftar',
        description: 'Pengiriman ekspedisi Jakarta - Denpasar terdaftar.',
        location: 'DKI Jakarta',
        timestamp: subHours(50),
      },
      {
        id: 'EVT-003-2',
        shipmentId: 'DEMO-SHP-003',
        trackingNumber: 'LGT-20261019-3312',
        status: 'Dijemput',
        title: 'Dijemput Kurir',
        description: 'Paket diambil dari Mangga Dua Mall.',
        location: 'DKI Jakarta',
        timestamp: subHours(46),
      },
      {
        id: 'EVT-003-3',
        shipmentId: 'DEMO-SHP-003',
        trackingNumber: 'LGT-20261019-3312',
        status: 'Di Gudang',
        title: 'Hub Gudang Transit Banyuwangi',
        description: 'Tiba di Pelabuhan Ketapang menyeberang ke Gilimanuk Bali.',
        location: 'Banyuwangi',
        timestamp: subHours(20),
      },
      {
        id: 'EVT-003-4',
        shipmentId: 'DEMO-SHP-003',
        trackingNumber: 'LGT-20261019-3312',
        status: 'Sedang Diantar',
        title: 'Sedang Diantar Kurir Lokal',
        description: 'Kurir menuju alamat Jl. Teuku Umar No. 88, Denpasar.',
        location: 'Kota Denpasar',
        timestamp: subHours(4),
      },
      {
        id: 'EVT-003-5',
        shipmentId: 'DEMO-SHP-003',
        trackingNumber: 'LGT-20261019-3312',
        status: 'Terkirim',
        title: 'Paket Diterima dengan Sukses',
        description: 'Penerima memverifikasi kode 914302. Transaksi selesai secara otomatis.',
        location: 'Kota Denpasar',
        timestamp: subHours(2),
      },
    ];

    for (const evt of demoEvents) {
      await setDoc(doc(db, 'shipmentEvents', evt.id), evt);
    }

    return true;
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return false;
  }
}
