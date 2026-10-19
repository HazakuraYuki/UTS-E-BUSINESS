import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { GeoCoordinate } from '../types';

interface TrackingMapProps {
  origin: GeoCoordinate;
  destination: GeoCoordinate;
  courierLocation?: GeoCoordinate;
  height?: string;
  interactive?: boolean;
}

export const TrackingMap: React.FC<TrackingMapProps> = ({
  origin,
  destination,
  courierLocation,
  height = '360px',
  interactive = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Cleanup previous map instance if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center in Java/Indonesia
    const centerLat = (origin.lat + destination.lat) / 2;
    const centerLng = (origin.lng + destination.lng) / 2;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 6,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: false,
    });

    mapInstanceRef.current = map;

    // OpenStreetMap tile layer (Free, no API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    // Custom icons
    const createCustomIcon = (bgColor: string, label: string) => {
      return L.divIcon({
        className: 'custom-leaflet-icon',
        html: `
          <div style="
            background: ${bgColor};
            color: white;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 9999px;
            border: 2px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
          ">
            <span>${label}</span>
          </div>
        `,
        iconSize: [80, 30],
        iconAnchor: [40, 15],
      });
    };

    const originMarker = L.marker([origin.lat, origin.lng], {
      icon: createCustomIcon('#0d9488', `Asal: ${origin.cityName || 'Asal'}`),
    }).addTo(map);
    originMarker.bindPopup(`<b>Kota Asal Pengiriman</b><br>${origin.cityName || ''}`);

    const destMarker = L.marker([destination.lat, destination.lng], {
      icon: createCustomIcon('#2563eb', `Tujuan: ${destination.cityName || 'Tujuan'}`),
    }).addTo(map);
    destMarker.bindPopup(`<b>Kota Tujuan Penerima</b><br>${destination.cityName || ''}`);

    const boundsPoints: [number, number][] = [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
    ];

    // Courier location marker if provided
    if (courierLocation && courierLocation.lat && courierLocation.lng) {
      boundsPoints.push([courierLocation.lat, courierLocation.lng]);
      const courierMarker = L.marker([courierLocation.lat, courierLocation.lng], {
        icon: L.divIcon({
          className: 'courier-pulse-icon',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
              <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: #10b981; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 28px; height: 28px; border-radius: 50%; background: #059669; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
                🚚
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        }),
      }).addTo(map);
      courierMarker.bindPopup(
        `<b>Posisi Real-Time Kurir</b><br>${courierLocation.cityName || 'Dalam perjalanan armada'}`
      );
    }

    // Polyline connecting points
    const routeCoords: [number, number][] = [
      [origin.lat, origin.lng],
      ...(courierLocation && courierLocation.lat && courierLocation.lng
        ? [[courierLocation.lat, courierLocation.lng] as [number, number]]
        : []),
      [destination.lat, destination.lng],
    ];

    L.polyline(routeCoords, {
      color: '#0d9488',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.8,
    }).addTo(map);

    // Fit map bounds
    if (boundsPoints.length > 0) {
      map.fitBounds(L.latLngBounds(boundsPoints), {
        padding: [45, 45],
        maxZoom: 11,
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [origin.lat, origin.lng, destination.lat, destination.lng, courierLocation?.lat, courierLocation?.lng, interactive]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/80 shadow-inner bg-slate-950">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-lg bg-slate-900/90 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-slate-300 border border-slate-700 shadow-md">
        <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
        <span>Peta Terestrial OpenStreetMap</span>
      </div>
    </div>
  );
};
