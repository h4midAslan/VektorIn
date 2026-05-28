import { useState, useEffect } from "react";
import { Trophy, Heart, Clock, Camera, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useDarkMode } from "../hooks/useTheme";

function Countdown({ seconds }) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = n => String(n).padStart(2, "0");
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {[{ v: d, l: "Gün" }, { v: h, l: "Saat" }, { v: m, l: "Dəq" }, { v: s, l: "San" }].map(({ v, l }) => (
        <div key={l} style={{ textAlign: "center" }}>
          <div style={{
            background: "#1a4a8a", color: "#fff", borderRadius: 8,
            padding: "10px 14px", fontSize: 22, fontWeight: 800, minWidth: 52,
            fontVariantNumeric: "tabular-nums",
          }}>{pad(v)}</div>
          <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function RankBadge({ rank }) {
  const colors = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };
  const icons = { 1: "🥇", 2: "🥈", 3: "🥉" };
  if (rank <= 3) return <span style={{ fontSize: 24 }}>{icons[rank]}</span>;
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%", background: "#e5e7eb",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: 700, color: "#666",
    }}>{rank}</div>
  );
}

export default function Contest() {
  const dark = useDarkMode();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [board, setBoard] = useState([]);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  const C = {
    bg: dark ? "#111827" : "#f3f4f6",
    card: dark ? "#1f2937" : "#ffffff",
    text: dark ? "#f3f4f6" : "#1a1a1a",
    muted: dark ? "#9ca3af" : "#666",
    border: dark ? "#374151" : "#e5e7eb",
  };

  useEffect(() => {
    Promise.all([api.get("/contest/info"), api.get("/contest/leaderboard")])
      .then(([inf, lb]) => {
        setInfo(inf.data);
        setRemaining(inf.data.remaining_seconds);
        setBoard(lb.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [remaining]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
      <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 48 }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1a4a8a 100%)",
        padding: "48px 16px 40px", textAlign: "center", color: "#fff",
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>
          {info?.title}
        </h1>
        <p style={{ fontSize: 14, opacity: 0.8, margin: "0 0 24px" }}>
          Ən çox bəyənilən paylaşımın sahibi qazanır
        </p>

        {/* Prize */}
        <div style={{
          display: "inline-block", background: "rgba(255,255,255,0.15)",
          borderRadius: 12, padding: "12px 28px", marginBottom: 28,
        }}>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 2 }}>Mükafat</div>
          <div style={{ fontSize: 32, fontWeight: 900 }}>{info?.prize}</div>
        </div>

        {/* Countdown */}
        {remaining > 0 ? (
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Clock size={12} /> Müsabiqə bitənə qədər
            </div>
            <Countdown seconds={remaining} />
          </div>
        ) : (
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fbbf24" }}>
            Müsabiqə bitib
          </div>
        )}

        {/* Tags */}
        <div style={{ marginTop: 20, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {info?.tags.map(t => (
            <span key={t} style={{
              background: "rgba(255,255,255,0.2)", borderRadius: 20,
              padding: "4px 12px", fontSize: 12, fontWeight: 600,
            }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px" }}>

        {/* CTA */}
        {remaining > 0 && (
          <button
            onClick={() => navigate("/feed")}
            style={{
              width: "100%", marginTop: 20, padding: "14px",
              background: "#1a4a8a", color: "#fff", border: "none",
              borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Camera size={18} /> Şəkil paylaş və iştirak et
            <ChevronRight size={16} />
          </button>
        )}

        {/* Leaderboard */}
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: "28px 0 14px" }}>
          Liderboard
        </h2>

        {board.length === 0 ? (
          <div style={{
            background: C.card, borderRadius: 12, padding: "48px 16px",
            textAlign: "center", color: C.muted, fontSize: 14,
          }}>
            Hələ heç bir iştirakçı yoxdur. İlk sən ol! 📸
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {board.map(entry => (
              <div key={entry.post_id} style={{
                background: C.card, borderRadius: 12, overflow: "hidden",
                border: entry.rank === 1 ? "2px solid #FFD700" : `1px solid ${C.border}`,
                boxShadow: entry.rank === 1 ? "0 4px 20px rgba(255,215,0,0.15)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
                  <RankBadge rank={entry.rank} />
                  <img
                    src={entry.author.profile_picture || "/logo.png"}
                    alt=""
                    style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{entry.author.full_name}</div>
                    {entry.author.major && (
                      <div style={{ fontSize: 12, color: C.muted }}>{entry.author.major}</div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#e11d48", fontWeight: 800, fontSize: 16 }}>
                    <Heart size={16} fill="#e11d48" />
                    {entry.like_count}
                  </div>
                </div>
                {entry.image_url && (
                  <img
                    src={entry.image_url}
                    alt=""
                    style={{ width: "100%", maxHeight: 320, objectFit: "cover", display: "block" }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
