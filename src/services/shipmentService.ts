import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import {
  Shipment,
  ShipmentEvent,
  NotificationItem,
  ShipmentStatus,
  PaymentMethod,
  GeoCoordinate,
} from '../types';
import {
  INDONESIAN_CITIES,
  ZONE_BASE_RATES,
  SERVICE_OPTIONS,
  getCityById,
} from '../data/cities';

export interface TariffCalculationResult {
  actualWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  baseRate: number;
  multiplier: number;
  shippingCost: number;
  serviceName: string;
  eta: string;
  originZone: string;
  destZone: string;
}

export function calculateTariff(
  originCityName: string,
  destCityName: string,
  actualWeightKg: number,
  lengthCm: number = 20,
  widthCm: number = 15,
  heightCm: number = 10,
  serviceType: 'REGULER' | 'EXPRESS' | 'CARGO' = 'REGULER'
): TariffCalculationResult {
  const origin = INDONESIAN_CITIES.find(
    (c) => c.name.toLowerCase() === originCityName.toLowerCase() || c.id === originCityName
  ) || INDONESIAN_CITIES[0];

  const dest = INDONESIAN_CITIES.find(
    (c) => c.name.toLowerCase() === destCityName.toLowerCase() || c.id === destCityName
  ) || INDONESIAN_CITIES[5];

  // Volumetric formula for ground transport: (L x W x H) / 5000 in kg
  const volumetricWeightKg = Math.round(((lengthCm * widthCm * heightCm) / 5000) * 100) / 100;
  
  // Service minimum weight
  const service = SERVICE_OPTIONS.find((s) => s.type === serviceType) || SERVICE_OPTIONS[0];
  const rawWeight = Math.max(actualWeightKg, volumetricWeightKg, service.minWeightKg);
  const chargeableWeightKg = Math.ceil(rawWeight);

  // Base rate by zone
  const originZone = origin.zone || 'A';
  const destZone = dest.zone || 'B';
  const baseRate = ZONE_BASE_RATES[originZone]?.[destZone] || 15000;

  const multiplier = service.multiplier;
  const shippingCost = Math.round(chargeableWeightKg * baseRate * multiplier);

  return {
    actualWeightKg,
    lengthCm,
    widthCm,
    heightCm,
    volumetricWeightKg,
    chargeableWeightKg,
    baseRate,
    multiplier,
    shippingCost,
    serviceName: service.name,
    eta: service.eta,
    originZone,
    destZone,
  };
}

export function generateTrackingNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `LGT-${dateStr}-${randomSuffix}`;
}

export function generateConfirmationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Automatic Send-Receive creation pipeline
export async function createAutomaticShipment(params: {
  senderId: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderCity: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverCity: string;
  receiverEmail?: string;
  packageDescription: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  serviceType: 'REGULER' | 'EXPRESS' | 'CARGO';
  paymentMethod: PaymentMethod;
}): Promise<Shipment> {
  const trackingNumber = generateTrackingNumber();
  const confirmationCode = generateConfirmationCode();
  const shipmentId = doc(collection(db, 'shipments')).id;
  const now = new Date().toISOString();

  const tariff = calculateTariff(
    params.senderCity,
    params.receiverCity,
    params.weightKg,
    params.lengthCm,
    params.widthCm,
    params.heightCm,
    params.serviceType
  );

  const originCity = getCityById(params.senderCity) || INDONESIAN_CITIES[0];
  const destCity = getCityById(params.receiverCity) || INDONESIAN_CITIES[5];

  const originCoords: GeoCoordinate = {
    lat: originCity.lat,
    lng: originCity.lng,
    cityName: originCity.name,
    updatedAt: now,
  };

  const destinationCoords: GeoCoordinate = {
    lat: destCity.lat,
    lng: destCity.lng,
    cityName: destCity.name,
    updatedAt: now,
  };

  const initialPaymentStatus = params.paymentMethod === 'COD' ? 'Bayar di Tempat' : 'Belum Bayar';

  const newShipment: Shipment = {
    id: shipmentId,
    trackingNumber,
    senderId: params.senderId,
    senderName: params.senderName,
    senderPhone: params.senderPhone,
    senderAddress: params.senderAddress,
    senderCity: originCity.name,
    receiverName: params.receiverName,
    receiverPhone: params.receiverPhone,
    receiverAddress: params.receiverAddress,
    receiverCity: destCity.name,
    receiverEmail: params.receiverEmail || '',
    packageDescription: params.packageDescription,
    weightKg: params.weightKg,
    lengthCm: params.lengthCm,
    widthCm: params.widthCm,
    heightCm: params.heightCm,
    chargeableWeightKg: tariff.chargeableWeightKg,
    serviceType: params.serviceType,
    shippingCost: tariff.shippingCost,
    baseRate: tariff.baseRate,
    confirmationCode,
    status: 'Paket Terdaftar',
    paymentMethod: params.paymentMethod,
    paymentStatus: initialPaymentStatus,
    originCoords,
    destinationCoords,
    currentCourierLocation: originCoords,
    createdAt: now,
    updatedAt: now,
  };

  try {
    // 1. Save shipment to Firestore
    await setDoc(doc(db, 'shipments', shipmentId), newShipment);

    // 2. Automatically record initial timeline event
    const eventId = doc(collection(db, 'shipmentEvents')).id;
    const initialEvent: ShipmentEvent = {
      id: eventId,
      shipmentId,
      trackingNumber,
      status: 'Paket Terdaftar',
      title: 'Paket Berhasil Didaftarkan',
      description: `Pengiriman otomatis dibuat. Rute: ${originCity.name} -> ${destCity.name}. Menunggu ${
        params.paymentMethod === 'COD' ? 'penjemputan kurir (COD)' : 'penyelesaian pembayaran'
      }.`,
      location: originCity.name,
      updatedByUid: params.senderId,
      updatedByName: params.senderName,
      updatedByRole: 'Pengirim',
      timestamp: now,
    };
    await setDoc(doc(db, 'shipmentEvents', eventId), initialEvent);

    // 3. Automatically dispatch notification to sender
    const notifId = doc(collection(db, 'notifications')).id;
    const initialNotif: NotificationItem = {
      id: notifId,
      userId: params.senderId,
      shipmentId,
      trackingNumber,
      title: 'Resi Pengiriman Berhasil Dibuat',
      message: `Nomor resi ${trackingNumber} telah terbit. ${
        params.paymentMethod === 'COD'
          ? 'Paket siap dijemput kurir dengan sistem Bayar di Tempat (COD).'
          : 'Silakan selesaikan pembayaran agar paket segera masuk antrean penjemputan.'
      }`,
      isRead: false,
      createdAt: now,
    };
    await setDoc(doc(db, 'notifications', notifId), initialNotif);

    return newShipment;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'shipments/' + shipmentId);
    throw error;
  }
}

// Payment simulation helper
export async function simulatePayment(
  shipmentId: string,
  paymentMethod: PaymentMethod
): Promise<void> {
  const now = new Date().toISOString();
  try {
    const shipmentRef = doc(db, 'shipments', shipmentId);
    const shipmentSnap = await getDoc(shipmentRef);
    if (!shipmentSnap.exists()) {
      throw new Error('Pengiriman tidak ditemukan');
    }
    const shipment = shipmentSnap.data() as Shipment;

    await updateDoc(shipmentRef, {
      paymentStatus: 'Lunas',
      paymentMethod,
      paidAt: now,
      updatedAt: now,
    });

    // Add event
    const eventId = doc(collection(db, 'shipmentEvents')).id;
    await setDoc(doc(db, 'shipmentEvents', eventId), {
      id: eventId,
      shipmentId,
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      title: 'Pembayaran Terverifikasi (Simulasi)',
      description: `Pembayaran sebesar Rp ${shipment.shippingCost.toLocaleString(
        'id-ID'
      )} via ${paymentMethod} berhasil diverifikasi secara otomatis. Paket siap dijemput kurir.`,
      location: shipment.senderCity,
      timestamp: now,
      updatedByName: 'Sistem Pembayaran LogiTrack',
      updatedByRole: 'System',
    } as ShipmentEvent);

    // Dispatch notification
    const notifId = doc(collection(db, 'notifications')).id;
    await setDoc(doc(db, 'notifications', notifId), {
      id: notifId,
      userId: shipment.senderId,
      shipmentId,
      trackingNumber: shipment.trackingNumber,
      title: 'Pembayaran Lunas',
      message: `Pembayaran untuk nomor resi ${shipment.trackingNumber} telah terkonfirmasi. Kurir akan segera melakukan penjemputan.`,
      isRead: false,
      createdAt: now,
    } as NotificationItem);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'shipments/' + shipmentId);
  }
}

// Sequential courier / admin status progression
export const STATUS_SEQUENCE: ShipmentStatus[] = [
  'Paket Terdaftar',
  'Dijemput',
  'Di Gudang',
  'Dalam Perjalanan',
  'Sedang Diantar',
  'Terkirim',
];

export async function advanceShipmentStatus(params: {
  shipment: Shipment;
  nextStatus: ShipmentStatus;
  courierUid?: string;
  courierName?: string;
  customLocation?: string;
  notes?: string;
  proofRecipient?: string;
}): Promise<void> {
  const { shipment, nextStatus, courierUid, courierName, customLocation, notes, proofRecipient } =
    params;
  const now = new Date().toISOString();

  // Validate payment condition for pickup
  if (nextStatus === 'Dijemput') {
    if (shipment.paymentStatus !== 'Lunas' && shipment.paymentMethod !== 'COD') {
      throw new Error(
        'Paket belum dibayar! Kurir hanya dapat menjemput paket dengan status pembayaran Lunas atau COD.'
      );
    }
  }

  const updatePayload: Partial<Shipment> = {
    status: nextStatus,
    updatedAt: now,
  };

  if (courierUid) {
    updatePayload.assignedCourierId = courierUid;
  }
  if (courierName) {
    updatePayload.assignedCourierName = courierName;
  }

  if (nextStatus === 'Terkirim') {
    updatePayload.deliveredAt = now;
    if (proofRecipient) {
      updatePayload.receiverNotes = `Diterima oleh: ${proofRecipient}. ${notes || ''}`;
    }
    // If COD, mark paid upon delivery
    if (shipment.paymentMethod === 'COD') {
      updatePayload.paymentStatus = 'Lunas';
      updatePayload.paidAt = now;
    }
  }

  try {
    const shipmentRef = doc(db, 'shipments', shipment.id);
    await updateDoc(shipmentRef, updatePayload);

    // Dynamic title and description based on next status
    let title = `Status Diperbarui: ${nextStatus}`;
    let description = notes || `Status paket kini telah diperbarui menjadi ${nextStatus}.`;
    const loc = customLocation || (nextStatus === 'Sedang Diantar' || nextStatus === 'Terkirim' ? shipment.receiverCity : shipment.senderCity);

    if (nextStatus === 'Dijemput') {
      title = 'Paket Telah Dijemput Kurir';
      description = `Kurir ${courierName || 'LogiTrack'} telah mengambil paket dari alamat pengirim di ${shipment.senderCity}.`;
    } else if (nextStatus === 'Di Gudang') {
      title = 'Paket Tiba di Gudang Sortir Logistik';
      description = `Paket sedang diproses dan disortir di Hub Logistik ${loc} untuk penjadwalan armada darat.`;
    } else if (nextStatus === 'Dalam Perjalanan') {
      title = 'Paket Dalam Perjalanan Antar Kota';
      description = `Armada ekspedisi darat sedang bergerak melintasi rute ${shipment.senderCity} menuju ${shipment.receiverCity}.`;
    } else if (nextStatus === 'Sedang Diantar') {
      title = 'Paket Sedang Diantar ke Alamat Penerima';
      description = `Kurir ${courierName || 'LogiTrack'} sedang dalam perjalanan menuju alamat tujuan penerima (${shipment.receiverAddress}).`;
    } else if (nextStatus === 'Terkirim') {
      title = 'Paket Berhasil Terkirim';
      description = `Paket telah diterima dengan sukses oleh ${proofRecipient || shipment.receiverName}. Transaksi pengiriman selesai secara otomatis.`;
    }

    // Save event
    const eventId = doc(collection(db, 'shipmentEvents')).id;
    await setDoc(doc(db, 'shipmentEvents', eventId), {
      id: eventId,
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      status: nextStatus,
      title,
      description,
      location: loc,
      updatedByUid: courierUid || 'system',
      updatedByName: courierName || 'Kurir LogiTrack',
      updatedByRole: 'Kurir',
      timestamp: now,
    } as ShipmentEvent);

    // Disptach notification to sender
    const notifId = doc(collection(db, 'notifications')).id;
    await setDoc(doc(db, 'notifications', notifId), {
      id: notifId,
      userId: shipment.senderId,
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      title: `Update Paket: ${nextStatus}`,
      message: `${title} (${shipment.trackingNumber}). ${description}`,
      isRead: false,
      createdAt: now,
    } as NotificationItem);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'shipments/' + shipment.id);
  }
}

// Receiver confirming delivery automatically via 6-digit confirmation code
export async function confirmReceiptByCode(
  confirmationCode: string,
  receiverNameClaim?: string
): Promise<Shipment> {
  const cleanCode = confirmationCode.trim();
  try {
    const q = query(
      collection(db, 'shipments'),
      where('confirmationCode', '==', cleanCode),
      limit(1)
    );
    let snap = await getDocs(q);

    // If not found and it's one of our demo codes, attempt auto-seed fallback
    if (snap.empty && ['482910', '725184', '914302', '315789'].includes(cleanCode)) {
      const { seedDemoDataIfEmpty } = await import('./seedService');
      await seedDemoDataIfEmpty(true);
      snap = await getDocs(q);
    }

    if (snap.empty) {
      throw new Error('Kode konfirmasi tidak valid atau tidak cocok dengan paket apapun.');
    }
    const shipmentDoc = snap.docs[0];
    const shipment = shipmentDoc.data() as Shipment;

    if (shipment.status === 'Terkirim') {
      return shipment; // Already delivered
    }

    const now = new Date().toISOString();
    const updatePayload: Partial<Shipment> = {
      status: 'Terkirim',
      deliveredAt: now,
      updatedAt: now,
      receiverNotes: `Konfirmasi digital langsung oleh penerima: ${receiverNameClaim || shipment.receiverName} menggunakan kode OTP valid.`,
    };

    if (shipment.paymentMethod === 'COD') {
      updatePayload.paymentStatus = 'Lunas';
      updatePayload.paidAt = now;
    }

    await updateDoc(doc(db, 'shipments', shipment.id), updatePayload);

    // Event
    const eventId = doc(collection(db, 'shipmentEvents')).id;
    await setDoc(doc(db, 'shipmentEvents', eventId), {
      id: eventId,
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      status: 'Terkirim',
      title: 'Paket Berhasil Dikonfirmasi Penerima',
      description: `Penerima (${receiverNameClaim || shipment.receiverName}) telah memverifikasi penerimaan paket secara digital melalui kode rahasia. Pengiriman ditutup otomatis.`,
      location: shipment.receiverCity,
      updatedByName: 'Penerima Mandiri',
      updatedByRole: 'Penerima',
      timestamp: now,
    } as ShipmentEvent);

    // Notification to sender
    const notifId = doc(collection(db, 'notifications')).id;
    await setDoc(doc(db, 'notifications', notifId), {
      id: notifId,
      userId: shipment.senderId,
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      title: 'Paket Selesai Diterima!',
      message: `Selamat! Paket Anda dengan resi ${shipment.trackingNumber} telah berhasil diterima oleh ${receiverNameClaim || shipment.receiverName}. Transaksi otomatis ditutup.`,
      isRead: false,
      createdAt: now,
    } as NotificationItem);

    return { ...shipment, ...updatePayload };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Kode konfirmasi')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.GET, 'shipments');
    throw error;
  }
}

// Courier updating GPS location
export async function updateCourierGPS(
  shipmentId: string,
  lat: number,
  lng: number,
  cityName?: string
): Promise<void> {
  const now = new Date().toISOString();
  try {
    const coords: GeoCoordinate = { lat, lng, cityName, updatedAt: now };
    await updateDoc(doc(db, 'shipments', shipmentId), {
      currentCourierLocation: coords,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'shipments/' + shipmentId);
  }
}

// Admin handling exceptions
export async function markShipmentException(
  shipment: Shipment,
  type: 'Gagal Kirim' | 'Dibatalkan',
  reason: string,
  adminName: string
): Promise<void> {
  const now = new Date().toISOString();
  try {
    const updatePayload: Partial<Shipment> = {
      status: type,
      updatedAt: now,
    };
    if (type === 'Gagal Kirim') {
      updatePayload.failureReason = reason;
    } else {
      updatePayload.cancelReason = reason;
    }

    await updateDoc(doc(db, 'shipments', shipment.id), updatePayload);

    // Event
    const eventId = doc(collection(db, 'shipmentEvents')).id;
    await setDoc(doc(db, 'shipmentEvents', eventId), {
      id: eventId,
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      status: type,
      title: `Kendala Pengiriman: ${type}`,
      description: `Alasan: ${reason}. Ditandai oleh Admin ${adminName}.`,
      location: shipment.receiverCity || shipment.senderCity,
      updatedByName: adminName,
      updatedByRole: 'Admin',
      timestamp: now,
    } as ShipmentEvent);

    // Notification
    const notifId = doc(collection(db, 'notifications')).id;
    await setDoc(doc(db, 'notifications', notifId), {
      id: notifId,
      userId: shipment.senderId,
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      title: `Perhatian: Paket ${type}`,
      message: `Resi ${shipment.trackingNumber} berstatus ${type}. Alasan: ${reason}`,
      isRead: false,
      createdAt: now,
    } as NotificationItem);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'shipments/' + shipment.id);
  }
}

// Fetch shipment by tracking number
export async function fetchShipmentByTrackingNumber(trackingNumber: string): Promise<{
  shipment: Shipment | null;
  events: ShipmentEvent[];
}> {
  const cleanTracking = trackingNumber.trim().toUpperCase();
  try {
    const q = query(
      collection(db, 'shipments'),
      where('trackingNumber', '==', cleanTracking),
      limit(1)
    );
    let snap = await getDocs(q);
    if (snap.empty && cleanTracking.startsWith('LGT-20261019-')) {
      const { seedDemoDataIfEmpty } = await import('./seedService');
      await seedDemoDataIfEmpty(true);
      snap = await getDocs(q);
    }

    if (snap.empty) {
      return { shipment: null, events: [] };
    }

    const shipment = snap.docs[0].data() as Shipment;

    // Fetch associated events
    const eventsQuery = query(
      collection(db, 'shipmentEvents'),
      where('shipmentId', '==', shipment.id)
    );
    const eventsSnap = await getDocs(eventsQuery);
    const events = eventsSnap.docs.map((d) => d.data() as ShipmentEvent);
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return { shipment, events };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'shipments');
    return { shipment: null, events: [] };
  }
}
