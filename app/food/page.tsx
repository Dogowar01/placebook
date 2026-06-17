"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePlacebookStore } from "@/lib/store";
import NavBar from "@/components/NavBar";
import StarRating from "@/components/StarRating";

type FoodCategory = "all" | "breakfast" | "lunch" | "dinner" | "snack" | "drink" | "dessert";

const CATEGORY_CONFIG: Record<string, { label: string; emoji: string }> = {
  all: { label: "All", emoji: "🍽️" },
  breakfast: { label: "Breakfast", emoji: "🥐" },
  lunch: { label: "Lunch", emoji: "🥗" },
  dinner: { label: "Dinner", emoji: "🍖" },
  snack: { label: "Snack", emoji: "🍿" },
  drink: { label: "Drink", emoji: "☕" },
  dessert: { label: "Dessert", emoji: "🍰" },
};

export default function FoodPage() {
  const locations = usePlacebookStore((s) => s.locations);
  const [activeCategory, setActiveCategory] = useState<FoodCategory>("all");
  const [sortBy, setSortBy] = useState<"rating" | "recent">("rating");

  const allFood = useMemo(() => {
    return locations
      .flatMap((loc) =>
        loc.food.map((f) => ({
          ...f,
          locationName: loc.name,
          locationId: loc.id,
          visitedAt: loc.visitedAt,
          country: loc.country,
        }))
      )
      .filter((f) => activeCategory === "all" || f.category === activeCategory)
      .sort((a, b) => {
        if (sortBy === "rating") return b.rating - a.rating;
        return new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime();
      });
  }, [locations, activeCategory, sortBy]);

  const stats = useMemo(() => {
    const all = locations.flatMap((l) => l.food);
    const byCategory = Object.keys(CATEGORY_CONFIG)
      .filter((k) => k !== "all")
      .map((cat) => ({
        category: cat,
        count: all.filter((f) => f.category === cat).length,
        avgRating:
          all.filter((f) => f.category === cat).reduce((s, f) => s + f.rating, 0) /
            (all.filter((f) => f.category === cat).length || 1),
      }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count);
    return { total: all.length, byCategory };
  }, [locations]);

  if (stats.total === 0) {
    return (
      <div className="h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-5xl mb-4">🍽️</div>
            <h2 className="font-bold text-gray-900 text-lg mb-2">Your food journal</h2>
            <p className="text-gray-500 text-sm">Log meals when you add places to build your personal food collection.</p>
            <Link href="/map" className="mt-5 inline-block px-6 py-3 bg-indigo-600 text-white rounded-2xl font-semibold">
              Add a place →
            </Link>
          </div>
        </div>
        <NavBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-14 pb-5">
        <h1 className="text-2xl font-bold text-gray-900">Food Journal</h1>
        <p className="text-sm text-gray-500 mt-1">{stats.total} meals & drinks logged</p>
      </div>

      {/* Category pills */}
      <div className="px-5 pt-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
        {Object.entries(CATEGORY_CONFIG).map(([cat, cfg]) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat as FoodCategory)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
              activeCategory === cat
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            <span>{cfg.emoji}</span>
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="px-5 py-3 flex gap-2">
        <button
          onClick={() => setSortBy("rating")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            sortBy === "rating" ? "bg-indigo-100 text-indigo-700" : "bg-white text-gray-500 border border-gray-200"
          }`}
        >
          Top Rated
        </button>
        <button
          onClick={() => setSortBy("recent")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            sortBy === "recent" ? "bg-indigo-100 text-indigo-700" : "bg-white text-gray-500 border border-gray-200"
          }`}
        >
          Most Recent
        </button>
      </div>

      {/* Food list */}
      <div className="px-5 space-y-3">
        {allFood.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">{CATEGORY_CONFIG[activeCategory].emoji}</p>
            <p className="text-sm">No {activeCategory} entries yet</p>
          </div>
        )}

        {allFood.map((f, i) => (
          <Link key={`${f.id}-${i}`} href={`/location/${f.locationId}`}>
            <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl shrink-0">
                {CATEGORY_CONFIG[f.category]?.emoji || "🍽️"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{f.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-400 truncate">at {f.locationName}</p>
                  <span className="text-gray-200">·</span>
                  <p className="text-xs text-gray-400">{f.country}</p>
                </div>
              </div>
              <div className="shrink-0">
                <StarRating value={f.rating} readonly size="sm" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Best of section */}
      {sortBy === "rating" && allFood.length > 0 && (
        <div className="px-5 mt-8">
          <h2 className="font-bold text-gray-900 mb-3">Best in each category</h2>
          <div className="space-y-2">
            {stats.byCategory.map((cat) => {
              const best = locations
                .flatMap((loc) => loc.food.map((f) => ({ ...f, locationName: loc.name, locationId: loc.id })))
                .filter((f) => f.category === cat.category)
                .sort((a, b) => b.rating - a.rating)[0];
              if (!best) return null;
              return (
                <Link key={cat.category} href={`/location/${best.locationId}`}>
                  <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                    <span className="text-xl">{CATEGORY_CONFIG[cat.category].emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 uppercase font-semibold">{CATEGORY_CONFIG[cat.category].label}</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{best.name}</p>
                      <p className="text-xs text-gray-400 truncate">{best.locationName}</p>
                    </div>
                    <StarRating value={best.rating} readonly size="sm" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <NavBar />
    </div>
  );
}
