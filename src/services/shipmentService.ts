import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  writeBatch,
  runTransaction,
  arrayUnion,
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import {
  Shipment,
  ShipmentEvent,
  NotificationItem,
  ShipmentStatus,
  PaymentMethod,
  GeoCoordinate,
  PublicTracking,
  PublicTimelineEntry,
  PickupPoolItem,
  ReceiptKey,
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
  const origin =
    INDONESIAN_CITIES.find(
      (c) => c.name.toLowerCase() === originCityName.toLowerCase() || c.id === originCityName
    ) || INDONESIAN_CITIES[0];

  const dest =
    INDONESIAN_CITIES.find(
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

/**
 * Atomic daily sequential tracking number: LGT-YYYYMMDD-NNNN
 * Protected against double-clicks and race conditions via Firestore runTransaction.
 */
export async function getNextTrackingNumber(): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const counterRef = doc(db, 'trackingCounters', dateStr);

  try {
    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(counterRef);
      let nextSeq = 1001;
      if (snap.exists()) {
        const data = snap.data();
        nextSeq = (Number(data.lastSequence) || 1000) + 1;
      }
      transaction.set(
        counterRef,
        {
          date: dateStr,
          lastSequence: nextSeq,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return `LGT-${dateStr}-${nextSeq.toString().padStart(4, '0')}`;
    });
  } catch (err) {
    console.warn('Fallback sequence generation:', err);
    // Secure fallback timestamp suffix if offline or transaction error
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `LGT-${dateStr}-${rand}`;
  }
}

/**
 * Cryptographically secure alphanumeric confirmation code (10 chars, uppercase letters and numbers)
 * Total entropy: 32^10 = 1.125 quadrillion combinations, impossible to brute-force.
 */
export function generateConfirmationCode(length = 10): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
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
  const trackingNumber = await getNextTrackingNumber();
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

  // 1. Private shipment document: NOTE confirmationCode is omitted from this doc per security rules
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
    status: 'Paket Terdaftar',
    paymentMethod: params.paymentMethod,
    paymentStatus: initialPaymentStatus,
    originCoords,
    destinationCoords,
    currentCourierLocation: originCoords,
    createdAt: now,
    updatedAt: now,
  };

  // 2. Safe initial timeline event
  const initialTimelineEntry: PublicTimelineEntry = {
    status: 'Paket Terdaftar',
    title: 'Paket Berhasil Didaftarkan',
    description: `Pengiriman otomatis dibuat. Rute: ${originCity.name} -> ${destCity.name}. Menunggu ${
      params.paymentMethod === 'COD' ? 'penjemputan kurir (COD)' : 'penyelesaian pembayaran'
    }.`,
    location: originCity.name,
    timestamp: now,
  };

  // 3. Safe Public Tracking document (no PII, safe for public get)
  const publicDoc: PublicTracking = {
    trackingNumber,
    status: 'Paket Terdaftar',
    senderCity: originCity.name,
    receiverCity: destCity.name,
    originCoords,
    destinationCoords,
    currentCourierLocation: originCoords,
    estimatedDeliveryDate: tariff.eta,
    serviceType: params.serviceType,
    updatedAt: now,
    timeline: [initialTimelineEntry],
  };

  // 4. Pickup Pool item (if COD, immediately available for courier pickup)
  const poolItem: PickupPoolItem = {
    shipmentId,
    trackingNumber,
    senderId: params.senderId,
    senderCity: originCity.name,
    receiverCity: destCity.name,
    serviceType: params.serviceType,
    chargeableWeightKg: tariff.chargeableWeightKg,
    paymentMethod: params.paymentMethod,
    shippingCost: tariff.shippingCost,
    originCoords,
    destinationCoords,
    createdAt: now,
  };

  // 5. Audit event document
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

  // 6. Notification document for sender
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

  try {
    const batch = writeBatch(db);

    // Save private shipment
    batch.set(doc(db, 'shipments', shipmentId), newShipment);

    // Save private secret (readable only by sender & admin)
    batch.set(doc(db, 'shipmentSecrets', trackingNumber), {
      trackingNumber,
      code: confirmationCode,
      shipmentId,
      senderId: params.senderId,
      createdAt: now,
    });

    // Save capability receipt key (doc ID: trackingNumber_code)
    batch.set(doc(db, 'receiptKeys', `${trackingNumber}_${confirmationCode}`), {
      trackingNumber,
      shipmentId,
      senderId: params.senderId,
      isCOD: params.paymentMethod === 'COD',
    } as ReceiptKey);

    // Save public tracking copy
    batch.set(doc(db, 'publicTracking', trackingNumber), publicDoc);

    // If COD, publish to courier pickup pool immediately
    if (params.paymentMethod === 'COD') {
      batch.set(doc(db, 'pickupPool', shipmentId), poolItem);
    }

    // Save audit event
    batch.set(doc(db, 'shipmentEvents', eventId), initialEvent);

    // Save notification
    batch.set(doc(db, 'notifications', notifId), initialNotif);

    await batch.commit();

    // Return the created shipment with confirmationCode attached for immediate sender view
    return {
      ...newShipment,
      confirmationCode,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'shipments/' + shipmentId);
    throw error;
  }
}

// Payment simulation helper (Belum Bayar -> Lunas)
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

    const batch = writeBatch(db);

    // 1. Update private shipment payment status
    batch.update(shipmentRef, {
      paymentStatus: 'Lunas',
      paymentMethod,
      paidAt: now,
      updatedAt: now,
    });

    // 2. Add to courier pickup pool since payment is now completed
    const poolRef = doc(db, 'pickupPool', shipmentId);
    batch.set(
      poolRef,
      {
        shipmentId,
        trackingNumber: shipment.trackingNumber,
        senderId: shipment.senderId,
        senderCity: shipment.senderCity,
        receiverCity: shipment.receiverCity,
        serviceType: shipment.serviceType,
        chargeableWeightKg: shipment.chargeableWeightKg,
        paymentMethod,
        shippingCost: shipment.shippingCost,
        originCoords: shipment.originCoords,
        destinationCoords: shipment.destinationCoords,
        createdAt: now,
      } as PickupPoolItem,
      { merge: true }
    );

    // 3. Update public tracking timeline
    const publicRef = doc(db, 'publicTracking', shipment.trackingNumber);
    batch.update(publicRef, {
      updatedAt: now,
      timeline: arrayUnion({
        status: shipment.status,
        title: 'Pembayaran Terverifikasi (Simulasi)',
        description: `Pembayaran sebesar Rp ${shipment.shippingCost.toLocaleString(
          'id-ID'
        )} via ${paymentMethod} berhasil diverifikasi. Paket masuk antrean penjemputan armada.`,
        location: shipment.senderCity,
        timestamp: now,
      } as PublicTimelineEntry),
    });

    // 4. Add private event
    const eventId = doc(collection(db, 'shipmentEvents')).id;
    batch.set(doc(db, 'shipmentEvents', eventId), {
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

    // 5. Dispatch notification to sender
    const notifId = doc(collection(db, 'notifications')).id;
    batch.set(doc(db, 'notifications', notifId), {
      id: notifId,
      userId: shipment.senderId,
      shipmentId,
      trackingNumber: shipment.trackingNumber,
      title: 'Pembayaran Lunas',
      message: `Pembayaran untuk nomor resi ${shipment.trackingNumber} telah terkonfirmasi. Kurir akan segera melakukan penjemputan.`,
      isRead: false,
      createdAt: now,
    } as NotificationItem);

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'shipments/' + shipmentId);
  }
}

// Sequential status progression
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

  // Dynamic titles and descriptions
  let title = `Status Diperbarui: ${nextStatus}`;
  let description = notes || `Status paket kini telah diperbarui menjadi ${nextStatus}.`;
  const loc =
    customLocation ||
    (nextStatus === 'Sedang Diantar' || nextStatus === 'Terkirim'
      ? shipment.receiverCity
      : shipment.senderCity);

  if (nextStatus === 'Dijemput') {
    title = 'Paket Telah Dijemput Kurir';
    description = `Kurir ${courierName || 'LogiTrack'} telah mengambil paket dari alamat pengirim di ${
      shipment.senderCity
    }.`;
  } else if (nextStatus === 'Di Gudang') {
    title = 'Paket Tiba di Gudang Sortir Logistik';
    description = `Paket sedang diproses dan disortir di Hub Logistik ${loc} untuk penjadwalan armada darat.`;
  } else if (nextStatus === 'Dalam Perjalanan') {
    title = 'Paket Dalam Perjalanan Antar Kota';
    description = `Armada ekspedisi darat sedang bergerak melintasi rute ${shipment.senderCity} menuju ${shipment.receiverCity}.`;
  } else if (nextStatus === 'Sedang Diantar') {
    title = 'Paket Sedang Diantar ke Alamat Penerima';
    description = `Kurir ${courierName || 'LogiTrack'} sedang dalam perjalanan menuju alamat tujuan penerima (${
      shipment.receiverAddress
    }).`;
  } else if (nextStatus === 'Terkirim') {
    title = 'Paket Berhasil Terkirim';
    description = `Paket telah diterima dengan sukses oleh ${
      proofRecipient || shipment.receiverName
    }. Transaksi pengiriman selesai secara otomatis.`;
  }

  try {
    const batch = writeBatch(db);

    // 1. Update private shipment doc
    const shipmentRef = doc(db, 'shipments', shipment.id);
    batch.update(shipmentRef, updatePayload);

    // 2. If claimed or delivered, remove from pickup pool
    if (nextStatus === 'Dijemput' || nextStatus === 'Terkirim') {
      const poolRef = doc(db, 'pickupPool', shipment.id);
      batch.delete(poolRef);
    }

    // 3. Keep public tracking in sync
    const publicRef = doc(db, 'publicTracking', shipment.trackingNumber);
    const publicUpdates: Record<string, any> = {
      status: nextStatus,
      updatedAt: now,
      timeline: arrayUnion({
        status: nextStatus,
        title,
        description,
        location: loc,
        timestamp: now,
      } as PublicTimelineEntry),
    };
    if (nextStatus === 'Terkirim') {
      publicUpdates.deliveredAt = now;
    }
    batch.update(publicRef, publicUpdates);

    // 4. Save audit event
    const eventId = doc(collection(db, 'shipmentEvents')).id;
    batch.set(doc(db, 'shipmentEvents', eventId), {
      id: eventId,
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      status: nextStatus,
      title,
      description,
      location: loc,
      updatedByUid: courierUid || auth.currentUser?.uid || 'courier',
      updatedByName: courierName || 'Kurir LogiTrack',
      updatedByRole: 'Kurir',
      timestamp: now,
    } as ShipmentEvent);

    // 5. Dispatch notification to sender
    const notifId = doc(collection(db, 'notifications')).id;
    batch.set(doc(db, 'notifications', notifId), {
      id: notifId,
      userId: shipment.senderId,
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      title: `Update Paket: ${nextStatus}`,
      message: `${title} (${shipment.trackingNumber}). ${description}`,
      isRead: false,
      createdAt: now,
    } as NotificationItem);

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'shipments/' + shipment.id);
  }
}

/**
 * Courier claiming an unassigned shipment from the pickup pool.
 */
export async function claimPickupPoolItem(
  poolItem: PickupPoolItem,
  courierUid: string,
  courierName: string
): Promise<void> {
  const now = new Date().toISOString();
  try {
    const batch = writeBatch(db);

    // 1. Update shipments: assignedCourier + status 'Dijemput'
    batch.update(doc(db, 'shipments', poolItem.shipmentId), {
      assignedCourierId: courierUid,
      assignedCourierName: courierName,
      status: 'Dijemput',
      updatedAt: now,
    });

    // 2. Delete from pickup pool
    batch.delete(doc(db, 'pickupPool', poolItem.shipmentId));

    // 3. Update public tracking
    batch.update(doc(db, 'publicTracking', poolItem.trackingNumber), {
      status: 'Dijemput',
      updatedAt: now,
      timeline: arrayUnion({
        status: 'Dijemput',
        title: 'Paket Telah Dijemput Kurir',
        description: `Kurir ${courierName} telah mengambil paket dari alamat pengirim di ${poolItem.senderCity}.`,
        location: poolItem.senderCity,
        timestamp: now,
      } as PublicTimelineEntry),
    });

    // 4. Audit event
    const eventId = doc(collection(db, 'shipmentEvents')).id;
    batch.set(doc(db, 'shipmentEvents', eventId), {
      id: eventId,
      shipmentId: poolItem.shipmentId,
      trackingNumber: poolItem.trackingNumber,
      status: 'Dijemput',
      title: 'Paket Telah Dijemput Kurir',
      description: `Kurir ${courierName} telah mengambil paket dari pengirim di ${poolItem.senderCity}.`,
      location: poolItem.senderCity,
      updatedByUid: courierUid,
      updatedByName: courierName,
      updatedByRole: 'Kurir',
      timestamp: now,
    } as ShipmentEvent);

    // 5. Notification to sender
    const notifId = doc(collection(db, 'notifications')).id;
    batch.set(doc(db, 'notifications', notifId), {
      id: notifId,
      userId: poolItem.senderId,
      shipmentId: poolItem.shipmentId,
      trackingNumber: poolItem.trackingNumber,
      title: 'Paket Telah Dijemput Kurir',
      message: `Kurir ${courierName} telah menjemput paket Anda (${poolItem.trackingNumber}). Segera diproses ke hub sortir.`,
      isRead: false,
      createdAt: now,
    } as NotificationItem);

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'pickupPool/' + poolItem.shipmentId);
  }
}

/**
 * Receiver confirming delivery automatically via resi + confirmation code.
 * Works without receiver login by verifying against receiptKeys capability doc.
 */
export async function confirmReceiptByCode(
  trackingNumber: string,
  confirmationCode: string,
  receiverNameClaim?: string
): Promise<Shipment> {
  const cleanTracking = trackingNumber.trim().toUpperCase();
  const cleanCode = confirmationCode.trim().toUpperCase();

  try {
    // 1. Verify capability key doc (receiptKeys/{trackingNumber}_{code})
    const keyRef = doc(db, 'receiptKeys', `${cleanTracking}_${cleanCode}`);
    const keySnap = await getDoc(keyRef);

    if (!keySnap.exists()) {
      throw new Error('Nomor resi atau kode konfirmasi tidak valid.');
    }

    const keyData = keySnap.data() as ReceiptKey;
    const shipmentId = keyData.shipmentId;

    // 2. Fetch public or private shipment status to ensure not already delivered
    const publicRef = doc(db, 'publicTracking', cleanTracking);
    const publicSnap = await getDoc(publicRef);
    if (!publicSnap.exists()) {
      throw new Error('Data pengiriman tidak ditemukan.');
    }
    const publicData = publicSnap.data() as PublicTracking;

    if (publicData.status === 'Terkirim') {
      // Already confirmed and delivered
      return {
        id: shipmentId,
        trackingNumber: cleanTracking,
        status: 'Terkirim',
        deliveredAt: publicData.deliveredAt,
        receiverCity: publicData.receiverCity,
        senderCity: publicData.senderCity,
      } as Shipment;
    }

    const now = new Date().toISOString();
    const batch = writeBatch(db);

    // 3. Create receiptConfirmations/{cleanTracking} proof doc (verified by rules)
    const confirmationRef = doc(db, 'receiptConfirmations', cleanTracking);
    batch.set(confirmationRef, {
      trackingNumber: cleanTracking,
      code: cleanCode,
      receiverName: receiverNameClaim || 'Penerima Mandiri',
      confirmedAt: now,
    });

    // 4. Update private shipment doc
    const shipmentRef = doc(db, 'shipments', shipmentId);
    const shipmentUpdatePayload: Record<string, any> = {
      status: 'Terkirim',
      deliveredAt: now,
      updatedAt: now,
      receiverNotes: `Konfirmasi digital langsung oleh penerima: ${
        receiverNameClaim || 'Penerima Sah'
      } menggunakan kode rahasia valid.`,
    };

    if (keyData.isCOD) {
      shipmentUpdatePayload.paymentStatus = 'Lunas';
      shipmentUpdatePayload.paidAt = now;
    }
    batch.update(shipmentRef, shipmentUpdatePayload);

    // 5. Update public tracking document
    batch.update(publicRef, {
      status: 'Terkirim',
      deliveredAt: now,
      updatedAt: now,
      timeline: arrayUnion({
        status: 'Terkirim',
        title: 'Paket Berhasil Dikonfirmasi Penerima',
        description:
          'Penerima telah memverifikasi penerimaan paket secara digital melalui kode rahasia. Pengiriman ditutup otomatis.',
        location: publicData.receiverCity,
        timestamp: now,
      } as PublicTimelineEntry),
    });

    // 6. Delete from pickup pool if it was still there
    batch.delete(doc(db, 'pickupPool', shipmentId));

    // 7. Audit event
    const eventId = `receipt_${cleanTracking}`;
    batch.set(doc(db, 'shipmentEvents', eventId), {
      id: eventId,
      shipmentId,
      trackingNumber: cleanTracking,
      status: 'Terkirim',
      title: 'Paket Berhasil Dikonfirmasi Penerima',
      description: `Penerima (${
        receiverNameClaim || 'Penerima Sah'
      }) telah memverifikasi penerimaan paket secara digital melalui kode rahasia. Pengiriman ditutup otomatis.`,
      location: publicData.receiverCity,
      updatedByName: receiverNameClaim || 'Penerima Mandiri',
      updatedByRole: 'Penerima',
      timestamp: now,
    } as ShipmentEvent);

    // 8. Notification to sender
    const notifId = `receipt_${cleanTracking}`;
    const cleanRecipientName = (receiverNameClaim || 'Penerima Sah').slice(0, 60);
    batch.set(doc(db, 'notifications', notifId), {
      id: notifId,
      userId: keyData.senderId,
      shipmentId,
      trackingNumber: cleanTracking,
      title: 'Paket Selesai Diterima!',
      message: `Selamat! Paket Anda dengan resi ${cleanTracking} telah berhasil diterima oleh ${cleanRecipientName}. Transaksi otomatis ditutup.`,
      isRead: false,
      createdAt: now,
    } as NotificationItem);

    await batch.commit();

    return {
      id: shipmentId,
      trackingNumber: cleanTracking,
      status: 'Terkirim',
      deliveredAt: now,
      updatedAt: now,
      senderCity: publicData.senderCity,
      receiverCity: publicData.receiverCity,
      receiverName: receiverNameClaim || 'Penerima Sah',
    } as Shipment;
  } catch (error) {
    if (error instanceof Error && error.message.includes('tidak valid')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, 'receiptConfirmations/' + cleanTracking);
    throw error;
  }
}

// Courier updating GPS location
export async function updateCourierGPS(
  shipmentId: string,
  trackingNumber: string,
  lat: number,
  lng: number,
  cityName?: string
): Promise<void> {
  const now = new Date().toISOString();
  try {
    const coords: GeoCoordinate = { lat, lng, cityName, updatedAt: now };
    const batch = writeBatch(db);

    // Update private shipment
    batch.update(doc(db, 'shipments', shipmentId), {
      currentCourierLocation: coords,
      updatedAt: now,
    });

    // Update public tracking
    batch.update(doc(db, 'publicTracking', trackingNumber), {
      currentCourierLocation: coords,
      updatedAt: now,
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'shipments/' + shipmentId);
  }
}

// Admin handling exceptions (Gagal Kirim / Dibatalkan)
export async function markShipmentException(
  shipment: Shipment,
  type: 'Gagal Kirim' | 'Dibatalkan',
  reason: string,
  adminName: string
): Promise<void> {
  const now = new Date().toISOString();
  try {
    const batch = writeBatch(db);

    const updatePayload: Partial<Shipment> = {
      status: type,
      updatedAt: now,
    };
    if (type === 'Gagal Kirim') {
      updatePayload.failureReason = reason;
    } else {
      updatePayload.cancelReason = reason;
    }

    // 1. Private shipment
    batch.update(doc(db, 'shipments', shipment.id), updatePayload);

    // 2. Remove from pickup pool
    batch.delete(doc(db, 'pickupPool', shipment.id));

    // 3. Update public tracking
    const publicRef = doc(db, 'publicTracking', shipment.trackingNumber);
    batch.update(publicRef, {
      status: type,
      updatedAt: now,
      timeline: arrayUnion({
        status: type,
        title: `Kendala Pengiriman: ${type}`,
        description: `Alasan: ${reason}. Ditandai oleh Admin ${adminName}.`,
        location: shipment.receiverCity || shipment.senderCity,
        timestamp: now,
      } as PublicTimelineEntry),
    });

    // 4. Audit Event
    const eventId = doc(collection(db, 'shipmentEvents')).id;
    batch.set(doc(db, 'shipmentEvents', eventId), {
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

    // 5. Notification to sender
    const notifId = doc(collection(db, 'notifications')).id;
    batch.set(doc(db, 'notifications', notifId), {
      id: notifId,
      userId: shipment.senderId,
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      title: `Perhatian: Paket ${type}`,
      message: `Resi ${shipment.trackingNumber} berstatus ${type}. Alasan: ${reason}`,
      isRead: false,
      createdAt: now,
    } as NotificationItem);

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'shipments/' + shipment.id);
  }
}

// Fetch shipment by tracking number (Public-safe with private fallback for privileged users)
export async function fetchShipmentByTrackingNumber(trackingNumber: string): Promise<{
  shipment: Shipment | null;
  events: ShipmentEvent[];
}> {
  const cleanTracking = trackingNumber.trim().toUpperCase();
  try {
    // 1. First fetch safe public tracking document
    const pubSnap = await getDoc(doc(db, 'publicTracking', cleanTracking));
    if (!pubSnap.exists()) {
      return { shipment: null, events: [] };
    }

    const pub = pubSnap.data() as PublicTracking;

    // Convert timeline entries to ShipmentEvent structure for UI display
    const publicEvents: ShipmentEvent[] = (pub.timeline || []).map((t, idx) => ({
      id: `evt-pub-${idx}`,
      shipmentId: '',
      trackingNumber: pub.trackingNumber,
      status: t.status,
      title: t.title,
      description: t.description,
      location: t.location,
      timestamp: t.timestamp,
    }));

    // Construct base shipment object with safe fields
    let shipmentObj: Shipment = {
      id: cleanTracking,
      trackingNumber: pub.trackingNumber,
      senderId: '',
      senderName: 'Pengirim Terverifikasi',
      senderPhone: '',
      senderAddress: 'Alamat Pengirim Terlindungi',
      senderCity: pub.senderCity,
      receiverName: 'Penerima Terdaftar',
      receiverPhone: '',
      receiverAddress: 'Alamat Penerima Terlindungi',
      receiverCity: pub.receiverCity,
      packageDescription: 'Paket Ekspedisi Darat',
      weightKg: 1,
      lengthCm: 20,
      widthCm: 15,
      heightCm: 10,
      chargeableWeightKg: 1,
      serviceType: pub.serviceType,
      shippingCost: 0,
      baseRate: 0,
      status: pub.status,
      paymentMethod: 'TRANSFER',
      paymentStatus: 'Lunas',
      originCoords: pub.originCoords,
      destinationCoords: pub.destinationCoords,
      currentCourierLocation: pub.currentCourierLocation,
      deliveredAt: pub.deliveredAt,
      createdAt: pub.updatedAt,
      updatedAt: pub.updatedAt,
    };

    // 2. If user is signed in, check if they can access the private shipment details
    if (auth.currentUser) {
      try {
        const q = query(
          collection(db, 'shipments'),
          where('trackingNumber', '==', cleanTracking),
          limit(1)
        );
        const privSnap = await getDocs(q);
        if (!privSnap.empty) {
          const priv = privSnap.docs[0].data() as Shipment;
          shipmentObj = { ...shipmentObj, ...priv };

          // If sender or admin, also retrieve secret confirmation code
          try {
            const secretSnap = await getDoc(doc(db, 'shipmentSecrets', cleanTracking));
            if (secretSnap.exists()) {
              shipmentObj.confirmationCode = secretSnap.data().code;
            }
          } catch {
            // Ignore if not authorized to read secrets
          }
        }
      } catch {
        // Not authorized for private document: safe public document will be shown
      }
    }

    return { shipment: shipmentObj, events: publicEvents };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'publicTracking/' + cleanTracking);
    return { shipment: null, events: [] };
  }
}
