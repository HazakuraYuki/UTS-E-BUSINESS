export type UserRole = 'sender' | 'courier' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
}

export type ShipmentStatus =
  | 'Paket Terdaftar'
  | 'Dijemput'
  | 'Di Gudang'
  | 'Dalam Perjalanan'
  | 'Sedang Diantar'
  | 'Terkirim'
  | 'Gagal Kirim'
  | 'Dibatalkan';

export type PaymentMethod = 'TRANSFER' | 'QRIS' | 'COD';

export type PaymentStatus = 'Belum Bayar' | 'Lunas' | 'Bayar di Tempat';

export interface GeoCoordinate {
  lat: number;
  lng: number;
  cityName?: string;
  updatedAt?: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string; // LGT-YYYYMMDD-NNNN
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
  chargeableWeightKg: number;
  serviceType: 'REGULER' | 'EXPRESS' | 'CARGO';
  shippingCost: number;
  baseRate: number;
  confirmationCode?: string; // Private confirmation code (kept in shipmentSecrets doc)
  status: ShipmentStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt?: string;
  assignedCourierId?: string;
  assignedCourierName?: string;
  currentCourierLocation?: GeoCoordinate;
  originCoords: GeoCoordinate;
  destinationCoords: GeoCoordinate;
  cancelReason?: string;
  failureReason?: string;
  receiverNotes?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface PublicTimelineEntry {
  status: ShipmentStatus;
  title: string;
  description: string;
  location: string;
  timestamp: string;
}

export interface PublicTracking {
  trackingNumber: string;
  status: ShipmentStatus;
  senderCity: string;
  receiverCity: string;
  originCoords: GeoCoordinate;
  destinationCoords: GeoCoordinate;
  currentCourierLocation?: GeoCoordinate;
  estimatedDeliveryDate?: string;
  distanceKm?: number;
  serviceType: 'REGULER' | 'EXPRESS' | 'CARGO';
  updatedAt: string;
  deliveredAt?: string;
  timeline: PublicTimelineEntry[];
}

export interface PickupPoolItem {
  shipmentId: string;
  trackingNumber: string;
  senderId: string;
  senderCity: string;
  receiverCity: string;
  serviceType: 'REGULER' | 'EXPRESS' | 'CARGO';
  chargeableWeightKg: number;
  paymentMethod: PaymentMethod;
  shippingCost: number;
  originCoords: GeoCoordinate;
  destinationCoords: GeoCoordinate;
  createdAt: string;
}

export interface ShipmentSecret {
  trackingNumber: string;
  code: string;
  shipmentId: string;
  senderId: string;
  createdAt: string;
}

export interface ReceiptKey {
  trackingNumber: string;
  shipmentId: string;
  senderId: string;
  isCOD: boolean;
}

export interface ShipmentEvent {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  status: ShipmentStatus;
  title: string;
  description: string;
  location: string;
  updatedByUid?: string;
  updatedByName?: string;
  updatedByRole?: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  shipmentId: string;
  trackingNumber: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
