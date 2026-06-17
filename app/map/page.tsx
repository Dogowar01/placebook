"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Plus, Layers, X, Map } from "lucide-react";
import { usePlacebookStore } from "@/lib/store";
import AddLocationModal from "@/components/AddLocationModal";
import NavBar from "@/components/NavBar";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PlacebookMap = dynamic(() => import("@/components/PlacebookMap"), { ssr: false });

export default function MapPage() {
  const router = useRouter();
  const locations = usePlacebookStore((s) => s.locations);
  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [addMode, setAddMode] = useState(false);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (!addMode) return;
      setPendingPin({ lat, lng });
      setShowAddModal(true);
    },
    [addMode]
  );

  function handleSaved(id: string) {
    setPendingPin(null);
    setShowAddModal(false);
    setAddMode(false);
    router.push(`/location/${id}`);
  }

  function handleCloseModal() {
    setPendingPin(null);
    setShowAddModal(false);
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-[500] flex items-center justify-between px-4 pt-safe pt-4 pb-3 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2 shadow-lg flex items-center gap-2">
            <span className="text-xl">📖</span>
            <span className="font-bold text-gray-900">Placebook</span>
            {locations.length > 0 && (
              <span className="text-xs text-gray-400">{locations.length} places</span>
            )}
          </div>
        </div>
        <div className="pointer-events-auto flex gap-2">
          <button
            onClick={() => setHeatmapMode(!heatmapMode)}
            className={`bg-white/90 backdrop-blur-md rounded-full p-2.5 shadow-lg transition-colors ${heatmapMode ? "text-indigo-600" : "text-gray-600"}`}
          >
            <Layers size={20} />
          </button>
        </div>
      </div>

      {/* Map */}
      <div className={`flex-1 ${addMode ? "cursor-crosshair" : ""}`}>
        <PlacebookMap
          locations={locations}
          onMapClick={handleMapClick}
          pendingPin={pendingPin}
          heatmapMode={heatmapMode}
        />
      </div>

      {/* Add mode banner */}
      {addMode && (
        <div className="absolute top-20 left-4 right-4 z-[500] bg-indigo-600 text-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg animate-fade-in">
          <p className="text-sm font-medium">📍 Tap the map to drop a pin</p>
          <button onClick={() => { setAddMode(false); setPendingPin(null); }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Empty state */}
      {locations.length === 0 && !addMode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[400]">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 mx-6 text-center shadow-2xl pointer-events-auto max-w-xs animate-pop-in">
            <div className="text-5xl mb-3">🗺️</div>
            <h2 className="font-bold text-gray-900 text-lg mb-2">Your map awaits</h2>
            <p className="text-gray-500 text-sm mb-5">
              Start building your personal history of everywhere you&apos;ve ever been.
            </p>
            <button
              onClick={() => setAddMode(true)}
              className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Drop your first pin 📍
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      {!addMode && locations.length > 0 && (
        <button
          onClick={() => setAddMode(true)}
          className="absolute bottom-24 right-5 z-[500] w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Add Location Modal */}
      {showAddModal && pendingPin && (
        <AddLocationModal
          lat={pendingPin.lat}
          lng={pendingPin.lng}
          onClose={handleCloseModal}
          onSaved={handleSaved}
        />
      )}

      <NavBar />
    </div>
  );
}
