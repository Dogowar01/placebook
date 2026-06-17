"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePlacebookStore } from "@/lib/store";
import { getUnlockedAchievements, ACHIEVEMENTS } from "@/lib/achievements";
import NavBar from "@/components/NavBar";

const CATEGORY_LABEL: Record<string, string> = {
  town: "Towns", city: "Cities", restaurant: "Restaurants", attraction: "Attractions",
  campsite: "Campsites", hidden_gem: "Hidden Gems", national_park: "National Parks",
  beach: "Beaches", mountain: "Mountains", road_trip: "Road Trips",
};

const CATEGORY_EMOJI: Record<string, string> = {
  town: "🏘️", city: "🏙️", restaurant: "🍽️", attraction: "🎡",
  campsite: "⛺", hidden_gem: "💎", national_park: "🌲", beach: "🏖️",
  mountain: "⛰️", road_trip: "🚗",
};

export default function PassportPage() {
  const locations = usePlacebookStore((s) => s.locations);

  const stats = useMemo(() => {
    const countries = new Set(locations.map((l) => l.country)).size;
    const totalPhotos = locations.reduce((sum, l) => sum + l.photos.length, 0);
    const totalFood = locations.reduce((sum, l) => sum + l.food.length, 0);
    const totalHiddenGems = locations.reduce((sum, l) => sum + l.hiddenGems.length, 0);
    const fiveStars = locations.filter((l) => l.rating === 5).length;
    const wouldReturn = locations.filter((l) => l.wouldReturn).length;
    const byCategory = Object.entries(CATEGORY_LABEL).map(([key, label]) => ({
      key,
      label,
      emoji: CATEGORY_EMOJI[key],
      count: locations.filter((l) => l.category === key).length,
    })).filter((s) => s.count > 0).sort((a, b) => b.count - a.count);
    const topCountries = Object.entries(
      locations.reduce<Record<string, number>>((acc, l) => {
        acc[l.country] = (acc[l.country] || 0) + 1;
        return acc;
      }, {})
    ).sort(([, a], [, b]) => b - a).slice(0, 5);

    return { countries, totalPhotos, totalFood, totalHiddenGems, fiveStars, wouldReturn, byCategory, topCountries };
  }, [locations]);

  const unlocked = useMemo(() => getUnlockedAchievements(locations), [locations]);

  if (locations.length === 0) {
    return (
      <div className="flex flex-col" style={{ minHeight: "100dvh" }}>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="font-bold text-gray-900 text-lg mb-2">Your passport</h2>
            <p className="text-gray-500 text-sm">Build your collection and unlock achievements as you explore the world.</p>
            <Link href="/map" className="mt-5 inline-block px-6 py-3 bg-indigo-600 text-white rounded-2xl font-semibold">
              Start exploring →
            </Link>
          </div>
        </div>
        <NavBar />
      </div>
    );
  }

  const progress = Math.min((unlocked.length / ACHIEVEMENTS.length) * 100, 100);

  return (
    <div className="bg-gray-50" style={{ minHeight: "100dvh", paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-5 pt-14 pb-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
            📖
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Passport</h1>
            <p className="text-white/70 text-sm">{unlocked.length}/{ACHIEVEMENTS.length} achievements</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white/20 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="px-5 -mt-4 relative z-10 space-y-5">
        {/* Hero stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard emoji="📍" value={locations.length} label="Places Visited" accent="text-indigo-600" />
          <StatCard emoji="🌍" value={stats.countries} label="Countries" accent="text-violet-600" />
          <StatCard emoji="📸" value={stats.totalPhotos} label="Photos" accent="text-rose-500" />
          <StatCard emoji="🍽️" value={stats.totalFood} label="Meals Logged" accent="text-amber-500" />
          <StatCard emoji="💎" value={stats.totalHiddenGems} label="Hidden Gems" accent="text-cyan-500" />
          <StatCard emoji="⭐" value={stats.fiveStars} label="5-Star Places" accent="text-yellow-500" />
        </div>

        {/* By category */}
        {stats.byCategory.length > 0 && (
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Collection</p>
            <div className="space-y-3">
              {stats.byCategory.map((cat) => (
                <div key={cat.key} className="flex items-center gap-3">
                  <span className="text-xl w-8">{cat.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-800">{cat.label}</p>
                      <p className="text-sm font-bold text-indigo-600">{cat.count}</p>
                    </div>
                    <div className="bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-indigo-500 rounded-full h-1.5"
                        style={{ width: `${Math.min((cat.count / Math.max(...stats.byCategory.map((c) => c.count))) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top countries */}
        {stats.topCountries.length > 0 && (
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Top Countries</p>
            <div className="space-y-2">
              {stats.topCountries.map(([country, count], i) => (
                <div key={country} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-300 w-5">#{i + 1}</span>
                  <p className="flex-1 text-sm font-medium text-gray-800">{country}</p>
                  <p className="text-sm font-bold text-indigo-600">{count} {count === 1 ? "place" : "places"}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Achievements · {unlocked.length}/{ACHIEVEMENTS.length}
          </p>
          <div className="grid grid-cols-1 gap-3">
            {ACHIEVEMENTS.map((achievement) => {
              const isUnlocked = unlocked.some((a) => a.id === achievement.id);
              return (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-colors ${
                    isUnlocked ? "bg-indigo-50 border border-indigo-100" : "bg-gray-50 opacity-50"
                  }`}
                >
                  <span className={`text-2xl ${!isUnlocked && "grayscale"}`}>{achievement.icon}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${isUnlocked ? "text-indigo-900" : "text-gray-500"}`}>
                      {achievement.name}
                    </p>
                    <p className="text-xs text-gray-400">{achievement.description}</p>
                  </div>
                  {isUnlocked && <span className="text-indigo-600 text-sm">✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <NavBar />
    </div>
  );
}

function StatCard({ emoji, value, label, accent }: { emoji: string; value: number; label: string; accent: string }) {
  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm text-center">
      <p className="text-2xl mb-1">{emoji}</p>
      <p className={`text-3xl font-bold ${accent}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
