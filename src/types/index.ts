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
  trackingNumber: string; // LGT-YYYYMMDD-XXXX
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
  confirmationCode: string; // 6 digits for receiver confirmation
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
