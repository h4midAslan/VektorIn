import { useState, useEffect } from "react";
import { ExternalLink, RefreshCw, Trophy, Star, Calendar } from "lucide-react";
import api from "../api/client";
import { useDarkClasses } from "../hooks/useDarkClasses";

function HackathonCard({ item, dark, d }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex gap-4 p-5 rounded-2xl border transition-all duration-200 hover:shadow-md
        ${dark ? "bg-gray-800/60 border-gray-700/50 hover:bg-gray-800" : "bg-white border-gray-100 hover:border-gray-200"}`}
    >
      <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center
        ${dark ? "bg-amber-500/15" : "bg-amber-50"}`}>
        {item.trusted
          ? <Star size={18} className="text-amber-500 fill-amber-400" />
          : <Trophy size={18} className="text-amber-500" />}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={`text-sm font-semibold leading-snug line-clamp-2 mb-1 group-hover:text-blue-500 transition
          ${dark ? "text-white" : "text-gray-900"}`}>
          {item.title}
        </h3>
        {item.description && (
          <p className={`text-xs line-clamp-1 mb-2 ${dark ? "text-gray-400" : "text-gray-500"}`}>
            {item.description}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          {item.deadline ? (
            <span className={`flex items-center gap-1 text-xs ${dark ? "text-amber-400" : "text-amber-600"}`}>
              <Calendar size={11} /> {item.deadline}
            </span>
          ) : (
            <span className={`text-xs ${dark ? "text-gray-600" : "text-gray-300"}`}>Tarix bildirilmir</span>
          )}
          <ExternalLink size={12} className={`${dark ? "text-gray-600" : "text-gray-300"} group-hover:text-blue-500 transition shrink-0`} />
        </div>
      </div>
    </a>
  );
}

export default function Hackathons() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [me, setMe] = useState(null);
  const d = useDarkClasses();
  const dark = d.dark;

  const load = async () => {
    try {
      const [hackRes, userRes] = await Promise.all([
        api.get("/hackathons"),
        api.get("/users/me"),
      ]);
      setItems(hackRes.data);
      setMe(userRes.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.post("/hackathons/refresh");
      setTimeout(() => { load(); setRefreshing(false); }, 4000);
    } catch {
      setRefreshing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-extrabold ${dark ? "text-white" : "text-gray-900"}`}>
            Hackathon & Yarışlar
          </h1>
          <p className={`text-sm mt-0.5 ${dark ? "text-gray-400" : "text-gray-500"}`}>
            Azərbaycanda aktual tələbə yarışları
          </p>
        </div>
        {me?.is_admin && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-40
              ${dark ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Yenilə
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-24 rounded-2xl animate-pulse ${dark ? "bg-gray-800" : "bg-gray-100"}`} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border
          ${dark ? "border-gray-700/50 text-gray-500" : "border-gray-100 text-gray-400"}`}>
          <Trophy size={40} className="mb-3 opacity-30" />
          <p className="font-medium text-sm">Hal-hazırda aktiv yarış tapılmadı</p>
          <p className="text-xs mt-1 opacity-70">Tezliklə yenilənəcək</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <HackathonCard key={item.id} item={item} dark={dark} d={d} />
          ))}
        </div>
      )}
    </div>
  );
}
