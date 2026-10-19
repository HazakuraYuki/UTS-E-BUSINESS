import { collection, doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Shipment, ShipmentEvent, UserProfile, PublicTracking, PublicTimelineEntry } from '../types';
import { INDONESIAN_CITIES, ZONE_BASE_RATES, SERVICE_OPTIONS } from '../data/cities';

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
      const demoDoc = await getDoc(doc(db, 'publicTracking', 'LGT-20261019-4409'));
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

    const batch = writeBatch(db);

    // 1. Seed Demo Users in Firestore
    for (const u of DEMO_USERS) {
      batch.set(doc(db, 'users', u.uid), u);
    }

    // 2. Seed Tariffs
    batch.set(doc(db, 'tariffs', 'standard'), {
      updatedAt: now.toISOString(),
      zoneRates: ZONE_BASE_RATES,
      services: SERVICE_OPTIONS,
      citiesCount: INDONESIAN_CITIES.length,
    });

    // 3. Demo Shipments definitions
    interface DemoItem {
      shipment: Shipment;
      secretCode: string;
      timeline: PublicTimelineEntry[];
      events: ShipmentEvent[];
      inPickupPool?: boolean;
    }

    const demoItems: DemoItem[] = [
      {
        secretCode: 'KODE1001OK',
        inPickupPool: false, // Belum bayar
        shipment: {
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
        timeline: [
          {
            status: 'Paket Terdaftar',
            title: 'Paket Berhasil Didaftarkan',
            description: 'Pengiriman dibuat via sistem Send-Receive Automatic. Menunggu pembayaran.',
            location: 'DKI Jakarta',
            timestamp: subHours(3),
          },
        ],
        events: [
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
        ],
      },
      {
        secretCode: 'KODE2045OK',
        inPickupPool: false,
        shipment: {
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
          status: 'Dalam Perjalanan',
          paymentMethod: 'QRIS',
          paymentStatus: 'Lunas',
          paidAt: subHours(12),
          assignedCourierId: 'demo_user_courier_01',
          assignedCourierName: 'Budi Santoso',
          originCoords: { lat: smg.lat, lng: smg.lng, cityName: smg.name },
          destinationCoords: { lat: sub.lat, lng: sub.lng, cityName: sub.name },
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
        timeline: [
          {
            status: 'Paket Terdaftar',
            title: 'Paket Berhasil Didaftarkan',
            description: 'Pengiriman didaftarkan oleh Andi Pratama.',
            location: 'Kota Semarang',
            timestamp: subHours(14),
          },
          {
            status: 'Dijemput',
            title: 'Pembayaran Lunas & Dijemput Kurir',
            description: 'Pembayaran QRIS Rp 216.000 terverifikasi. Kurir Budi Santoso menjemput paket.',
            location: 'Kota Semarang',
            timestamp: subHours(12),
          },
          {
            status: 'Di Gudang',
            title: 'Sortir Hub Sentral Logistik',
            description: 'Paket disortir dan dimuat ke truk armada ekspedisi darat Tol Trans-Jawa.',
            location: 'Semarang Hub',
            timestamp: subHours(8),
          },
          {
            status: 'Dalam Perjalanan',
            title: 'Dalam Perjalanan Antar Kota',
            description: 'Armada darat melintasi rute tol Semarang - Surabaya. Kurir membagikan posisi GPS.',
            location: 'Lintas Pantura Jateng-Jatim',
            timestamp: subHours(1),
          },
        ],
        events: [
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
            id: 'EVT-002-4',
            shipmentId: 'DEMO-SHP-002',
            trackingNumber: 'LGT-20261019-2045',
            status: 'Dalam Perjalanan',
            title: 'Dalam Perjalanan Antar Kota',
            description: 'Armada darat melintasi rute tol Semarang - Surabaya.',
            location: 'Lintas Pantura Jateng-Jatim',
            timestamp: subHours(1),
          },
        ],
      },
      {
        secretCode: 'KODE3312OK',
        inPickupPool: false,
        shipment: {
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
        timeline: [
          {
            status: 'Paket Terdaftar',
            title: 'Paket Terdaftar',
            description: 'Pengiriman ekspedisi Jakarta - Denpasar terdaftar.',
            location: 'DKI Jakarta',
            timestamp: subHours(50),
          },
          {
            status: 'Dijemput',
            title: 'Dijemput Kurir',
            description: 'Paket diambil dari Mangga Dua Mall.',
            location: 'DKI Jakarta',
            timestamp: subHours(46),
          },
          {
            status: 'Di Gudang',
            title: 'Hub Gudang Transit Banyuwangi',
            description: 'Tiba di Pelabuhan Ketapang menyeberang ke Gilimanuk Bali.',
            location: 'Banyuwangi',
            timestamp: subHours(20),
          },
          {
            status: 'Sedang Diantar',
            title: 'Sedang Diantar Kurir Lokal',
            description: 'Kurir menuju alamat Jl. Teuku Umar No. 88, Denpasar.',
            location: 'Kota Denpasar',
            timestamp: subHours(4),
          },
          {
            status: 'Terkirim',
            title: 'Paket Diterima dengan Sukses',
            description: 'Penerima memverifikasi kode digital. Transaksi selesai secara otomatis.',
            location: 'Kota Denpasar',
            timestamp: subHours(2),
          },
        ],
        events: [
          {
            id: 'EVT-003-5',
            shipmentId: 'DEMO-SHP-003',
            trackingNumber: 'LGT-20261019-3312',
            status: 'Terkirim',
            title: 'Paket Diterima dengan Sukses',
            description: 'Penerima memverifikasi kode. Transaksi selesai secara otomatis.',
            location: 'Kota Denpasar',
            timestamp: subHours(2),
          },
        ],
      },
      {
        secretCode: 'KODE4409OK',
        inPickupPool: false,
        shipment: {
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
        timeline: [
          {
            status: 'Paket Terdaftar',
            title: 'Paket Terdaftar',
            description: 'Pesanan dibuat dengan metode COD (Bayar di Tempat).',
            location: 'Kota Bekasi',
            timestamp: subHours(18),
          },
          {
            status: 'Dijemput',
            title: 'Paket Dijemput Kurir',
            description: 'Kurir menjemput paket dari Bekasi.',
            location: 'Kota Bekasi',
            timestamp: subHours(15),
          },
          {
            status: 'Dalam Perjalanan',
            title: 'Dalam Perjalanan ke Bandung',
            description: 'Armada darat melintasi rute Tol Cipularang menuju Bandung.',
            location: 'Purwakarta / Cipularang',
            timestamp: subHours(6),
          },
          {
            status: 'Sedang Diantar',
            title: 'Sedang Diantar ke Alamat Penerima',
            description: 'Kurir Budi Santoso sedang dalam perjalanan menuju Jl. R.E. Martadinata No. 71.',
            location: 'Kota Bandung',
            timestamp: subHours(0.5),
          },
        ],
        events: [
          {
            id: 'EVT-004-1',
            shipmentId: 'DEMO-SHP-004',
            trackingNumber: 'LGT-20261019-4409',
            status: 'Sedang Diantar',
            title: 'Sedang Diantar ke Alamat Penerima',
            description: 'Kurir Budi Santoso sedang dalam perjalanan menuju alamat penerima.',
            location: 'Kota Bandung',
            timestamp: subHours(0.5),
          },
        ],
      },
    ];

    for (const item of demoItems) {
      const shp = item.shipment;
      const tn = shp.trackingNumber;

      // (a) Private shipment document (NO confirmationCode inside)
      const cleanShipment: Record<string, any> = { ...shp };
      delete cleanShipment.confirmationCode;
      batch.set(doc(db, 'shipments', shp.id), cleanShipment);

      // (b) Private secret document
      batch.set(doc(db, 'shipmentSecrets', tn), {
        trackingNumber: tn,
        code: item.secretCode,
        shipmentId: shp.id,
        senderId: shp.senderId,
        createdAt: shp.createdAt,
      });

      // (c) Capability key doc for receiver verification
      batch.set(doc(db, 'receiptKeys', `${tn}_${item.secretCode}`), {
        trackingNumber: tn,
        shipmentId: shp.id,
        senderId: shp.senderId,
        isCOD: shp.paymentMethod === 'COD',
      });

      // (d) Public tracking document
      const pubDoc: PublicTracking = {
        trackingNumber: tn,
        status: shp.status,
        senderCity: shp.senderCity,
        receiverCity: shp.receiverCity,
        originCoords: shp.originCoords,
        destinationCoords: shp.destinationCoords,
        currentCourierLocation: shp.currentCourierLocation,
        estimatedDeliveryDate: (shp as any).estimatedDeliveryDate || 'Besok',
        serviceType: shp.serviceType,
        updatedAt: shp.updatedAt,
        deliveredAt: shp.deliveredAt,
        timeline: item.timeline,
      };
      batch.set(doc(db, 'publicTracking', tn), pubDoc);

      // (e) Audit events
      for (const evt of item.events) {
        batch.set(doc(db, 'shipmentEvents', evt.id), evt);
      }
    }

    await batch.commit();
    return true;
  } catch (error) {
    console.warn('Notice seeding demo data:', error);
    return false;
  }
}
