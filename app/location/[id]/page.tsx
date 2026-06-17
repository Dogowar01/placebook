"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Calendar, Star, Edit2, Trash2, ChevronRight } from "lucide-react";
import { usePlacebookStore } from "@/lib/store";
import { THEMES } from "@/lib/themes";
import StarRating from "@/components/StarRating";
import NavBar from "@/components/NavBar";

const CATEGORY_EMOJI: Record<string, string> = {
  town: "🏘️", city: "🏙️", restaurant: "🍽️", attraction: "🎡",
  campsite: "⛺", hidden_gem: "💎", national_park: "🌲", beach: "🏖️",
  mountain: "⛰️", road_trip: "🚗",
};

const CATEGORY_LABEL: Record<string, string> = {
  town: "Town", city: "City", restaurant: "Restaurant", attraction: "Attraction",
  campsite: "Campsite", hidden_gem: "Hidden Gem", national_park: "National Park",
  beach: "Beach", mountain: "Mountain", road_trip: "Road Trip",
};

export default function LocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const location = usePlacebookStore((s) => s.getLocation(id));
  const deleteLocation = usePlacebookStore((s) => s.deleteLocation);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  if (!location) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-500">Place not found</p>
          <button onClick={() => router.back()} className="mt-4 text-indigo-600 font-medium">Go back</button>
        </div>
      </div>
    );
  }

  const theme = THEMES[location.theme];

  function handleDelete() {
    deleteLocation(location!.id);
    router.push("/map");
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.font} pb-24`}>
      {/* Hero photo or theme banner */}
      <div className="relative">
        {location.photos.length > 0 ? (
          <div className="relative h-64 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={location.photos[0].dataUrl}
              alt={location.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        ) : (
          <div className={`h-48 ${theme.bg} flex items-center justify-center`}>
            <span className="text-7xl opacity-30">{CATEGORY_EMOJI[location.category]}</span>
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-12 left-4 bg-black/40 backdrop-blur-sm text-white rounded-full p-2.5"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Delete */}
        <button
          onClick={() => setShowDelete(true)}
          className="absolute top-12 right-4 bg-black/40 backdrop-blur-sm text-white rounded-full p-2.5"
        >
          <Trash2 size={18} />
        </button>

        {/* Theme badge */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${theme.badge} backdrop-blur-sm`}>
            {theme.emoji} {theme.name}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-5 -mt-6 relative z-10 space-y-5">
        {/* Title card */}
        <div className={`rounded-3xl p-5 ${theme.card} animate-fade-in`}>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${theme.badge}`}>
            {CATEGORY_EMOJI[location.category]} {CATEGORY_LABEL[location.category]}
          </div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>{location.name}</h1>
          <div className={`flex items-center gap-1.5 mt-1 ${theme.text} opacity-70 text-sm`}>
            <MapPin size={14} />
            {location.region ? `${location.region}, ` : ""}{location.country}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <StarRating value={location.rating} readonly />
            <span className={`text-sm opacity-60 ${theme.text}`}>
              <Calendar size={12} className="inline mr-1" />
              {new Date(location.visitedAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
          {location.mood && (
            <div className={`mt-2 text-sm ${theme.text} opacity-70`}>{location.mood}</div>
          )}
          {location.weather && (
            <div className={`text-sm ${theme.text} opacity-70`}>{location.weather}</div>
          )}
        </div>

        {/* Notes */}
        {location.notes && (
          <div className={`rounded-3xl p-5 ${theme.card} animate-fade-in`}>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 opacity-50 ${theme.text}`}>Notes</p>
            <p className={`text-sm leading-relaxed ${theme.text} italic`}>&ldquo;{location.notes}&rdquo;</p>
          </div>
        )}

        {/* Highlights */}
        {location.highlights.length > 0 && (
          <div className={`rounded-3xl p-5 ${theme.card} animate-fade-in`}>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 opacity-50 ${theme.text}`}>Highlights</p>
            <div className="space-y-2">
              {location.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`${theme.accentText} font-bold text-sm`}>✦</span>
                  <p className={`text-sm ${theme.text}`}>{h}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        {location.photos.length > 0 && (
          <div className={`rounded-3xl p-5 ${theme.card} animate-fade-in`}>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 opacity-50 ${theme.text}`}>
              Photos · {location.photos.length}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {location.photos.map((photo, i) => (
                <button
                  key={photo.id}
                  onClick={() => setActivePhoto(photo.dataUrl)}
                  className={`aspect-square overflow-hidden ${theme.photoFrame}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Food */}
        {location.food.length > 0 && (
          <div className={`rounded-3xl p-5 ${theme.card} animate-fade-in`}>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 opacity-50 ${theme.text}`}>
              Food & Drink · {location.food.length}
            </p>
            <div className="space-y-3">
              {location.food.map((f) => (
                <div key={f.id} className={`flex items-center justify-between border-b ${theme.border} pb-3 last:border-0 last:pb-0`}>
                  <div>
                    <p className={`text-sm font-medium ${theme.text}`}>{f.name}</p>
                    <p className={`text-xs opacity-60 capitalize ${theme.text}`}>{f.category}</p>
                  </div>
                  <StarRating value={f.rating} readonly size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hidden Gems */}
        {location.hiddenGems.length > 0 && (
          <div className={`rounded-3xl p-5 ${theme.card} animate-fade-in`}>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 opacity-50 ${theme.text}`}>Hidden Gems 💎</p>
            <div className="space-y-2">
              {location.hiddenGems.map((g, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-cyan-500">◆</span>
                  <p className={`text-sm ${theme.text}`}>{g}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className={`rounded-3xl p-5 ${theme.card} animate-fade-in`}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className={`text-2xl font-bold ${theme.accentText}`}>{location.photos.length}</p>
              <p className={`text-xs opacity-60 ${theme.text}`}>Photos</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${theme.accentText}`}>{location.food.length}</p>
              <p className={`text-xs opacity-60 ${theme.text}`}>Meals</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${theme.accentText}`}>{location.wouldReturn ? "✓" : "✗"}</p>
              <p className={`text-xs opacity-60 ${theme.text}`}>Return?</p>
            </div>
          </div>
          {location.costs && (
            <div className={`mt-3 pt-3 border-t ${theme.border} text-center`}>
              <p className={`text-sm ${theme.text}`}>
                <span className="opacity-60">Spent: </span>
                <span className="font-semibold">${location.costs.toFixed(0)}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center"
          onClick={() => setActivePhoto(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={activePhoto} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}

      {/* Delete confirm */}
      {showDelete && (
        <div className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center px-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-pop-in">
            <p className="text-lg font-bold text-gray-900 mb-2">Delete this place?</p>
            <p className="text-sm text-gray-500 mb-5">This will permanently remove {location.name} and all its memories.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-3 border border-gray-200 rounded-2xl text-gray-700 font-medium">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-medium hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <NavBar />
    </div>
  );
}
