"use client";

import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Location } from "@/lib/types";
import { THEMES } from "@/lib/themes";
import StarRating from "./StarRating";
import Link from "next/link";

// Category pin colours
const PIN_COLORS: Record<string, string> = {
  town: "#6366f1",
  city: "#8b5cf6",
  restaurant: "#f59e0b",
  attraction: "#ec4899",
  campsite: "#10b981",
  hidden_gem: "#06b6d4",
  national_park: "#22c55e",
  beach: "#3b82f6",
  mountain: "#64748b",
  road_trip: "#ef4444",
};

const CATEGORY_EMOJI: Record<string, string> = {
  town: "🏘️", city: "🏙️", restaurant: "🍽️", attraction: "🎡",
  campsite: "⛺", hidden_gem: "💎", national_park: "🌲", beach: "🏖️",
  mountain: "⛰️", road_trip: "🚗",
};

function createPin(category: string) {
  const color = PIN_COLORS[category] || "#6366f1";
  const emoji = CATEGORY_EMOJI[category] || "📍";
  return L.divIcon({
    className: "",
    html: `<div style="width:36px;height:36px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;">
      <span style="transform:rotate(45deg);font-size:15px;line-height:1;">${emoji}</span>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });
}

function createClickPin() {
  return L.divIcon({
    className: "",
    html: `<div style="width:36px;height:36px;border-radius:50% 50% 50% 0;background:#ef4444;transform:rotate(-45deg);border:2.5px solid white;box-shadow:0 2px 12px rgba(239,68,68,0.5);display:flex;align-items:center;justify-content:center;animation:popIn 0.4s cubic-bezier(0.34,1.56,0.64,1);">
      <span style="transform:rotate(45deg);font-size:15px;line-height:1;">📍</span>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface Props {
  locations: Location[];
  onMapClick: (lat: number, lng: number) => void;
  pendingPin: { lat: number; lng: number } | null;
  heatmapMode: boolean;
}

export default function PlacebookMap({ locations, onMapClick, pendingPin, heatmapMode }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="text-center text-white/60">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={[-25, 133]}
      zoom={4}
      style={{ width: "100%", height: "100%" }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution=""
      />
      <MapClickHandler onMapClick={onMapClick} />

      {locations.map((loc) => (
        <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={createPin(loc.category)}>
          <Popup className="placebook-popup" maxWidth={260}>
            <LocationPopup location={loc} />
          </Popup>
        </Marker>
      ))}

      {pendingPin && (
        <Marker position={[pendingPin.lat, pendingPin.lng]} icon={createClickPin()} />
      )}
    </MapContainer>
  );
}

function LocationPopup({ location }: { location: Location }) {
  const theme = THEMES[location.theme];
  return (
    <div className={`rounded-xl overflow-hidden min-w-[220px] ${theme.font}`}>
      {location.photos[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={location.photos[0].dataUrl} alt="" className="w-full h-32 object-cover" />
      )}
      {!location.photos[0] && (
        <div className={`h-20 ${theme.bg} flex items-center justify-center text-3xl`}>
          {CATEGORY_EMOJI[location.category]}
        </div>
      )}
      <div className="p-3">
        <h3 className="font-bold text-gray-900 text-sm">{location.name}</h3>
        <p className="text-xs text-gray-500">{location.region ? `${location.region}, ` : ""}{location.country}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <StarRating value={location.rating} readonly size="sm" />
          <span className="text-xs text-gray-400">{new Date(location.visitedAt).toLocaleDateString("en-AU", { month: "short", year: "numeric" })}</span>
        </div>
        {location.highlights[0] && (
          <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">✨ {location.highlights[0]}</p>
        )}
        <Link
          href={`/location/${location.id}`}
          className="mt-3 block w-full text-center py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
        >
          Open Scrapbook →
        </Link>
      </div>
    </div>
  );
}
