"use client";

import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { X, Plus, Upload, ChevronRight, ChevronLeft } from "lucide-react";
import { usePlacebookStore } from "@/lib/store";
import { THEMES } from "@/lib/themes";
import type { Location, LocationTheme, LocationCategory, FoodEntry } from "@/lib/types";
import StarRating from "./StarRating";

interface Props {
  lat: number;
  lng: number;
  onClose: () => void;
  onSaved: (id: string) => void;
}

type Step = "basics" | "theme" | "details" | "food" | "memories";

const CATEGORIES: { value: LocationCategory; label: string; emoji: string }[] = [
  { value: "town", label: "Town", emoji: "🏘️" },
  { value: "city", label: "City", emoji: "🏙️" },
  { value: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { value: "attraction", label: "Attraction", emoji: "🎡" },
  { value: "campsite", label: "Campsite", emoji: "⛺" },
  { value: "hidden_gem", label: "Hidden Gem", emoji: "💎" },
  { value: "national_park", label: "National Park", emoji: "🌲" },
  { value: "beach", label: "Beach", emoji: "🏖️" },
  { value: "mountain", label: "Mountain", emoji: "⛰️" },
  { value: "road_trip", label: "Road Trip", emoji: "🚗" },
];

const MOODS = ["😄 Amazing", "😊 Good", "😐 Okay", "😴 Tired", "🤩 Blown Away", "😍 In Love With It"];
const WEATHER = ["☀️ Sunny", "⛅ Cloudy", "🌧️ Rainy", "❄️ Snowy", "🌫️ Foggy", "🌈 After Rain"];

export default function AddLocationModal({ lat, lng, onClose, onSaved }: Props) {
  const addLocation = usePlacebookStore((s) => s.addLocation);
  const [step, setStep] = useState<Step>("basics");

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState<LocationCategory>("town");
  const [visitedAt, setVisitedAt] = useState(new Date().toISOString().split("T")[0]);
  const [theme, setTheme] = useState<LocationTheme>("modern");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [highlights, setHighlights] = useState<string[]>([""]);
  const [hiddenGems, setHiddenGems] = useState<string[]>([""]);
  const [mood, setMood] = useState("");
  const [weather, setWeather] = useState("");
  const [wouldReturn, setWouldReturn] = useState(true);
  const [costs, setCosts] = useState("");
  const [food, setFood] = useState<FoodEntry[]>([]);
  const [newFood, setNewFood] = useState({ name: "", category: "meal" as FoodEntry["category"], rating: 3, notes: "" });
  const [photos, setPhotos] = useState<{ id: string; dataUrl: string; caption: string }[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const STEPS: Step[] = ["basics", "theme", "details", "food", "memories"];
  const stepIndex = STEPS.indexOf(step);
  const isLastStep = step === "memories";

  function addHighlight() { setHighlights([...highlights, ""]); }
  function updateHighlight(i: number, v: string) { setHighlights(highlights.map((h, idx) => idx === i ? v : h)); }
  function removeHighlight(i: number) { setHighlights(highlights.filter((_, idx) => idx !== i)); }

  function addHiddenGem() { setHiddenGems([...hiddenGems, ""]); }
  function updateGem(i: number, v: string) { setHiddenGems(hiddenGems.map((g, idx) => idx === i ? v : g)); }
  function removeGem(i: number) { setHiddenGems(hiddenGems.filter((_, idx) => idx !== i)); }

  function addFoodEntry() {
    if (!newFood.name.trim()) return;
    setFood([...food, { id: uuidv4(), ...newFood }]);
    setNewFood({ name: "", category: "meal" as FoodEntry["category"], rating: 3, notes: "" });
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos((prev) => [...prev, { id: uuidv4(), dataUrl: ev.target?.result as string, caption: "" }]);
      };
      reader.readAsDataURL(file);
    });
  }

  function handleSave() {
    if (!name.trim() || !country.trim()) return;

    const location: Location = {
      id: uuidv4(),
      name: name.trim(),
      country: country.trim(),
      region: region.trim() || undefined,
      lat,
      lng,
      theme,
      category,
      visitedAt,
      rating,
      photos: photos.map((p) => ({ id: p.id, dataUrl: p.dataUrl, caption: p.caption })),
      highlights: highlights.filter(Boolean),
      notes,
      food,
      peopleMet: [],
      hiddenGems: hiddenGems.filter(Boolean),
      mood: mood || undefined,
      weather: weather || undefined,
      costs: costs ? parseFloat(costs) : undefined,
      wouldReturn,
      visitCount: 1,
    };

    addLocation(location);
    onSaved(location.id);
  }

  const th = THEMES[theme];

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
          <div className="text-center">
            <p className="font-semibold text-gray-900">New Place</p>
            <p className="text-xs text-gray-400 capitalize">{step}</p>
          </div>
          <div className="flex gap-1">
            {STEPS.map((s) => (
              <div
                key={s}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  STEPS.indexOf(s) <= stepIndex ? "bg-indigo-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === "basics" && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Place Name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Grindelwald"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Australia"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <input
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Tasmania"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        category === c.value
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <span>{c.emoji}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Visited</label>
                <input
                  type="date"
                  value={visitedAt}
                  onChange={(e) => setVisitedAt(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {step === "theme" && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm text-gray-500">Choose the look for this location&apos;s scrapbook page:</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(THEMES).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      theme === t.id
                        ? "border-indigo-500 shadow-md shadow-indigo-100"
                        : "border-gray-200 hover:border-gray-300"
                    } ${t.bg}`}
                  >
                    <div className="text-2xl mb-1">{t.emoji}</div>
                    <div className={`font-semibold text-sm ${t.text} ${t.font}`}>{t.name}</div>
                    <div className={`text-xs mt-0.5 opacity-70 ${t.text}`}>{t.description}</div>
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div className={`rounded-2xl p-4 ${th.bg} ${th.font}`}>
                <p className={`text-xs font-medium uppercase tracking-wide opacity-60 ${th.text}`}>Preview</p>
                <p className={`text-lg font-bold mt-1 ${th.text}`}>{name || "Your Place"}</p>
                <p className={`text-sm opacity-70 ${th.text}`}>{country || "Country"}</p>
                <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${th.badge}`}>
                  {CATEGORIES.find((c) => c.value === category)?.emoji} {CATEGORIES.find((c) => c.value === category)?.label}
                </div>
              </div>
            </div>
          )}

          {step === "details" && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Rating</label>
                <StarRating value={rating} onChange={setRating} size="lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What surprised you most? What will you remember?"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Highlights</label>
                {highlights.map((h, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      value={h}
                      onChange={(e) => updateHighlight(i, e.target.value)}
                      placeholder="e.g. Lakeside walk at dawn"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button type="button" onClick={() => removeHighlight(i)} className="text-gray-400 hover:text-red-500 px-2">
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addHighlight} className="text-indigo-600 text-sm flex items-center gap-1 mt-1">
                  <Plus size={14} /> Add highlight
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hidden Gems</label>
                {hiddenGems.map((g, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      value={g}
                      onChange={(e) => updateGem(i, e.target.value)}
                      placeholder="e.g. The unmarked track to the waterfall"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button type="button" onClick={() => removeGem(i)} className="text-gray-400 hover:text-red-500 px-2">
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addHiddenGem} className="text-indigo-600 text-sm flex items-center gap-1 mt-1">
                  <Plus size={14} /> Add hidden gem
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select...</option>
                    {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weather</label>
                  <select
                    value={weather}
                    onChange={(e) => setWeather(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select...</option>
                    {WEATHER.map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated spend ($)</label>
                <input
                  type="number"
                  value={costs}
                  onChange={(e) => setCosts(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center justify-between py-1">
                <label className="text-sm font-medium text-gray-700">Would you return?</label>
                <button
                  type="button"
                  onClick={() => setWouldReturn(!wouldReturn)}
                  className={`w-12 h-6 rounded-full transition-colors ${wouldReturn ? "bg-indigo-600" : "bg-gray-300"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${wouldReturn ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          )}

          {step === "food" && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm text-gray-500">Log what you ate and drank:</p>
              {food.length > 0 && (
                <div className="space-y-2">
                  {food.map((f) => (
                    <div key={f.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{f.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{f.category} · {"⭐".repeat(f.rating)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFood(food.filter((x) => x.id !== f.id))}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">Add a meal / drink</p>
                <input
                  value={newFood.name}
                  onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                  placeholder="e.g. Chicken schnitzel"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newFood.category}
                    onChange={(e) => setNewFood({ ...newFood, category: e.target.value as FoodEntry["category"] })}
                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                    <option value="drink">Drink</option>
                    <option value="dessert">Dessert</option>
                  </select>
                  <div className="flex items-center gap-1">
                    <StarRating value={newFood.rating} onChange={(v) => setNewFood({ ...newFood, rating: v })} size="sm" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addFoodEntry}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {step === "memories" && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm text-gray-500">Add photos to your scrapbook:</p>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((p, i) => (
                    <div key={p.id} className="relative aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.dataUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-8 flex flex-col items-center gap-2 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
              >
                <Upload size={24} />
                <span className="text-sm font-medium">Upload photos</span>
              </button>
              <div className="bg-indigo-50 rounded-2xl p-4 space-y-3 text-sm text-indigo-800">
                <p className="font-medium">Memory prompts:</p>
                <p>🎯 What surprised you most about this place?</p>
                <p>💡 What would you tell a friend visiting?</p>
                <p>🔄 What would you do differently next time?</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={() => setStep(STEPS[stepIndex - 1])}
              className="flex items-center gap-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (isLastStep) {
                handleSave();
              } else {
                setStep(STEPS[stepIndex + 1]);
              }
            }}
            disabled={step === "basics" && (!name.trim() || !country.trim())}
            className="flex-1 flex items-center justify-center gap-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isLastStep ? "Save Place 📍" : (
              <>Next <ChevronRight size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
