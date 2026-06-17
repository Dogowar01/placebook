"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePlacebookStore } from "@/lib/store";
import { THEMES } from "@/lib/themes";
import StarRating from "@/components/StarRating";
import NavBar from "@/components/NavBar";
import { Clock, MapPin } from "lucide-react";

const CATEGORY_EMOJI: Record<string, string> = {
  town: "🏘️", city: "🏙️", restaurant: "🍽️", attraction: "🎡",
  campsite: "⛺", hidden_gem: "💎", national_park: "🌲", beach: "🏖️",
  mountain: "⛰️", road_trip: "🚗",
};

export default function TimelinePage() {
  const locations = usePlacebookStore((s) => s.locations);

  const byYear = useMemo(() => {
    const sorted = [...locations].sort(
      (a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime()
    );
    const groups: Record<string, typeof sorted> = {};
    sorted.forEach((loc) => {
      const year = new Date(loc.visitedAt).getFullYear().toString();
      if (!groups[year]) groups[year] = [];
      groups[year].push(loc);
    });
    return Object.entries(groups).sort(([a], [b]) => parseInt(b) - parseInt(a));
  }, [locations]);

  if (locations.length === 0) {
    return (
      <div className="flex flex-col" style={{ minHeight: "100dvh" }}>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="font-bold text-gray-900 text-lg mb-2">Your timeline awaits</h2>
            <p className="text-gray-500 text-sm">Add places on the map to see your life scroll out here.</p>
            <Link href="/map" className="mt-5 inline-block px-6 py-3 bg-indigo-600 text-white rounded-2xl font-semibold">
              Go to Map →
            </Link>
          </div>
        </div>
        <NavBar />
      </div>
    );
  }

  return (
    <div className="bg-gray-50" style={{ minHeight: "100dvh", paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-14 pb-5">
        <h1 className="text-2xl font-bold text-gray-900">Timeline</h1>
        <p className="text-sm text-gray-500 mt-1">{locations.length} places across your life</p>
      </div>

      <div className="px-5 pt-6 space-y-8">
        {byYear.map(([year, locs]) => (
          <div key={year}>
            {/* Year header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                {year.slice(2)}
              </div>
              <div>
                <p className="font-bold text-gray-900">{year}</p>
                <p className="text-xs text-gray-400">{locs.length} place{locs.length !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {/* Timeline items */}
            <div className="relative ml-5 pl-6 border-l-2 border-indigo-100 space-y-4">
              {locs.map((loc) => {
                const theme = THEMES[loc.theme];
                return (
                  <Link key={loc.id} href={`/location/${loc.id}`}>
                    <div className="relative animate-fade-in">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[33px] top-3 w-4 h-4 rounded-full border-2 border-white shadow ${
                        loc.rating >= 4 ? "bg-indigo-600" : "bg-gray-300"
                      }`} />

                      {/* Card */}
                      <div className={`rounded-2xl overflow-hidden ${theme.card} hover:shadow-md transition-shadow`}>
                        {loc.photos[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={loc.photos[0].dataUrl} alt="" className="w-full h-32 object-cover" />
                        )}
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-base">{CATEGORY_EMOJI[loc.category]}</span>
                                <p className={`font-semibold text-sm truncate ${theme.text}`}>{loc.name}</p>
                              </div>
                              <div className={`flex items-center gap-1 text-xs opacity-60 mt-0.5 ${theme.text}`}>
                                <MapPin size={10} />
                                {loc.region ? `${loc.region}, ` : ""}{loc.country}
                              </div>
                            </div>
                            <div className="shrink-0">
                              <StarRating value={loc.rating} readonly size="sm" />
                            </div>
                          </div>
                          <div className={`flex items-center gap-1 text-xs opacity-50 mt-2 ${theme.text}`}>
                            <Clock size={10} />
                            {new Date(loc.visitedAt).toLocaleDateString("en-AU", { day: "numeric", month: "long" })}
                          </div>
                          {loc.highlights[0] && (
                            <p className={`text-xs mt-1 opacity-70 line-clamp-1 ${theme.text}`}>
                              ✦ {loc.highlights[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <NavBar />
    </div>
  );
}
