export interface City {
  id: string;
  name: string;
  province: string;
  zone: string; // 'A', 'B', 'C', 'D'
  lat: number;
  lng: number;
}

export const INDONESIAN_CITIES: City[] = [
  { id: 'JKT', name: 'DKI Jakarta', province: 'DKI Jakarta', zone: 'A', lat: -6.2088, lng: 106.8456 },
  { id: 'BGR', name: 'Kota Bogor', province: 'Jawa Barat', zone: 'A', lat: -6.5971, lng: 106.8060 },
  { id: 'DPK', name: 'Kota Depok', province: 'Jawa Barat', zone: 'A', lat: -6.4025, lng: 106.7942 },
  { id: 'TNG', name: 'Kota Tangerang', province: 'Banten', zone: 'A', lat: -6.1783, lng: 106.6319 },
  { id: 'BKS', name: 'Kota Bekasi', province: 'Jawa Barat', zone: 'A', lat: -6.2383, lng: 106.9756 },
  { id: 'BDG', name: 'Kota Bandung', province: 'Jawa Barat', zone: 'B', lat: -6.9175, lng: 107.6191 },
  { id: 'CRB', name: 'Kota Cirebon', province: 'Jawa Barat', zone: 'B', lat: -6.7320, lng: 108.5523 },
  { id: 'SMG', name: 'Kota Semarang', province: 'Jawa Tengah', zone: 'B', lat: -6.9667, lng: 110.4167 },
  { id: 'SLO', name: 'Kota Surakarta (Solo)', province: 'Jawa Tengah', zone: 'B', lat: -7.5755, lng: 110.8243 },
  { id: 'YOG', name: 'DI Yogyakarta', province: 'DI Yogyakarta', zone: 'B', lat: -7.7956, lng: 110.3695 },
  { id: 'SUB', name: 'Kota Surabaya', province: 'Jawa Timur', zone: 'C', lat: -7.2575, lng: 112.7521 },
  { id: 'MLG', name: 'Kota Malang', province: 'Jawa Timur', zone: 'C', lat: -7.9666, lng: 112.6326 },
  { id: 'KDR', name: 'Kota Kediri', province: 'Jawa Timur', zone: 'C', lat: -7.8480, lng: 112.0178 },
  { id: 'BWX', name: 'Banyuwangi', province: 'Jawa Timur', zone: 'C', lat: -8.2192, lng: 114.3692 },
  { id: 'DPS', name: 'Kota Denpasar', province: 'Bali', zone: 'C', lat: -8.6705, lng: 115.2126 },
  { id: 'MTR', name: 'Kota Mataram', province: 'Nusa Tenggara Barat', zone: 'D', lat: -8.5769, lng: 116.1009 },
  { id: 'BDL', name: 'Kota Bandar Lampung', province: 'Lampung', zone: 'B', lat: -5.4500, lng: 105.2667 },
  { id: 'PLM', name: 'Kota Palembang', province: 'Sumatera Selatan', zone: 'C', lat: -2.9761, lng: 104.7754 }
];

// Zone distance rates matrix (base rate per kg in IDR)
export const ZONE_BASE_RATES: Record<string, Record<string, number>> = {
  A: { A: 10000, B: 15000, C: 22000, D: 32000 },
  B: { A: 15000, B: 12000, C: 18000, D: 28000 },
  C: { A: 22000, B: 18000, C: 12000, D: 22000 },
  D: { A: 32000, B: 28000, C: 22000, D: 15000 },
};

export const SERVICE_OPTIONS = [
  {
    type: 'REGULER',
    name: 'LogiReguler',
    description: 'Layanan standar ekspedisi darat terpercaya',
    eta: '2 - 3 Hari',
    multiplier: 1.0,
    minWeightKg: 1,
    icon: 'Truck',
  },
  {
    type: 'EXPRESS',
    name: 'LogiExpress',
    description: 'Layanan prioritas cepat sampai tujuan esok hari',
    eta: '1 Hari (Next Day)',
    multiplier: 1.5,
    minWeightKg: 1,
    icon: 'Zap',
  },
  {
    type: 'CARGO',
    name: 'LogiCargo',
    description: 'Layanan hemat khusus paket berat dan berukuran besar',
    eta: '3 - 5 Hari',
    multiplier: 0.75,
    minWeightKg: 5,
    icon: 'PackageCheck',
  },
];

export function getCityById(id: string): City | undefined {
  return INDONESIAN_CITIES.find(c => c.id === id || c.name.toLowerCase().includes(id.toLowerCase()));
}
