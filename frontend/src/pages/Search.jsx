import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, UserPlus, UserCheck, Users, SlidersHorizontal, X } from "lucide-react";
import api from "../api/client";
import { toast } from "../components/Toast";
import { useLang } from "../hooks/useLang";
import { useIsMobile } from "../hooks/useIsMobile";
import { useDarkMode } from "../hooks/useTheme";

const ACCENT = "#1E90FF";

const COURSES = [
  { val: 1, label: "I" },
  { val: 2, label: "II" },
  { val: 3, label: "III" },
  { val: 4, label: "IV" },
];

function useColors(dark) {
  return dark ? {
    bg: "#050f1f", surface: "#0a1c39", border: "1px solid #1a2b49", borderColor: "#1a2b49",
    text: "#ffffff", textBody: "#e6edf7", textSoft: "#c4d0e0", muted: "#7d8ba3",
    divider: "rgba(255,255,255,0.07)", accent: ACCENT,
    accentWash: "rgba(30,144,255,0.12)", accentGlow: "rgba(30,144,255,0.4)",
    rowHover: "rgba(255,255,255,0.025)", inputBg: "#071428",
    btnPrimary: { background: ACCENT, color: "#fff", border: `1px solid ${ACCENT}` },
    btnGhost: { background: "transparent", color: "#c4d0e0", border: "1px solid #1a2b49" },
  } : {
    bg: "#ffffff", surface: "#f5f7fb", border: "1px solid #e4e9f1", borderColor: "#e4e9f1",
    text: "#071428", textBody: "#16243c", textSoft: "#3a4861", muted: "#69768d",
    divider: "#edf1f6", accent: ACCENT,
    accentWash: "rgba(30,144,255,0.08)", accentGlow: "rgba(30,144,255,0.28)",
    rowHover: "#f8fafd", inputBg: "#ffffff",
    btnPrimary: { background: ACCENT, color: "#fff", border: `1px solid ${ACCENT}` },
    btnGhost: { background: "#f5f7fb", color: "#3a4861", border: "1px solid #e4e9f1" },
  };
}

function UserRow({ user, C, connectedIds, pendingIds, onConnect, t }) {
  const [hover, setHover] = useState(false);
  const connected = connectedIds.has(user.id);
  const pending = pendingIds.has(user.id);
  const courseLabel = COURSES.find(c => c.val === user.course)?.label;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 18px",
        borderBottom: `1px solid ${C.divider}`,
        background: hover ? C.rowHover : "transparent",
        transition: "background .12s",
      }}
    >
      <Link to={`/profile/${user.id}`} style={{
        width: 48, height: 48, borderRadius: "50%", background: ACCENT,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: 900, fontSize: 18,
        flexShrink: 0, overflow: "hidden", textDecoration: "none",
        fontFamily: "'Archivo', sans-serif",
      }}>
        {user.profile_picture
          ? <img src={user.profile_picture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : user.full_name?.charAt(0)}
      </Link>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Link to={`/profile/${user.id}`} style={{ fontWeight: 800, fontSize: 15, color: C.text, textDecoration: "none", fontFamily: "'Archivo', sans-serif" }}>
            {user.full_name}
          </Link>
          {user.is_open_for_team && (
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
              color: "#22c55e", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
              padding: "2px 8px", borderRadius: 6, fontFamily: "'JetBrains Mono', monospace",
            }}>Komanda</span>
          )}
        </div>
        <p style={{ fontSize: 13, color: C.muted, margin: "3px 0 0" }}>
          {[user.major, courseLabel && `${courseLabel} kurs`].filter(Boolean).join(" · ")}
        </p>
        {user.skills && (
          <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
            {user.skills.split(",").slice(0, 3).map((s, i) => (
              <span key={i} style={{
                padding: "2px 9px", borderRadius: 6, fontSize: 11.5, fontWeight: 600,
                background: C.accentWash, color: ACCENT, border: `1px solid rgba(30,144,255,0.2)`,
                fontFamily: "'JetBrains Mono', monospace",
              }}>{s.trim()}</span>
            ))}
            {user.skills.split(",").length > 3 && (
              <span style={{ fontSize: 11.5, color: C.muted, alignSelf: "center" }}>+{user.skills.split(",").length - 3}</span>
            )}
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0 }}>
        {connected ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px",
            borderRadius: 999, border: C.border, color: C.muted, fontSize: 13, fontWeight: 700,
            fontFamily: "'Archivo', sans-serif",
          }}>
            <UserCheck size={14} /> Bağlı
          </span>
        ) : pending ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px",
            borderRadius: 999, border: "1px solid rgba(30,144,255,0.35)",
            color: ACCENT, background: "rgba(30,144,255,0.08)",
            fontSize: 13, fontWeight: 700, fontFamily: "'Archivo', sans-serif",
          }}>Gözləyir</span>
        ) : (
          <button onClick={() => onConnect(user.id)} style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px",
            borderRadius: 999, border: "none", background: ACCENT, color: "#fff",
            fontSize: 13, fontWeight: 800, cursor: "pointer",
            boxShadow: "0 4px 14px rgba(30,144,255,0.35)",
            fontFamily: "'Archivo', sans-serif",
          }}>
            <UserPlus size={14} /> {t("search_connect") || "Əlaqə"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Search() {
  const dark = useDarkMode();
  const C = useColors(dark);
  const [query, setQuery]               = useState("");
  const [skill, setSkill]               = useState("");
  const [course, setCourse]             = useState(null);
  const [openForTeam, setOpenForTeam]   = useState(false);
  const [showFilters, setShowFilters]   = useState(false);
  const [results, setResults]           = useState([]);
  const [searched, setSearched]         = useState(false);
  const [connectedIds, setConnectedIds] = useState(new Set());
  const [pendingIds, setPendingIds]     = useState(new Set());
  const [queryFocus, setQueryFocus]     = useState(false);
  const [skillFocus, setSkillFocus]     = useState(false);
  const { t } = useLang();
  const isMobile = useIsMobile();
  const debounceRef = useRef(null);

  useEffect(() => {
    api.get("/connections/my").then(r => setConnectedIds(new Set(r.data.map(c => c.user_id)))).catch(() => {});
    api.get("/connections/sent").then(r => setPendingIds(new Set(r.data.map(c => c.receiver_id)))).catch(() => {});
  }, []);

  const doSearch = useCallback(async (q, s, c, oft) => {
    try {
      const params = { q, skill: s };
      if (c) params.course = c;
      if (oft) params.open_for_team = true;
      const res = await api.get("/users/search", { params });
      setResults(res.data);
      setSearched(true);
    } catch {}
  }, []);

  useEffect(() => {
    const hasAny = query || skill || course || openForTeam;
    if (!hasAny) { setResults([]); setSearched(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query, skill, course, openForTeam), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, skill, course, openForTeam, doSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query && !skill && !course && !openForTeam) return;
    clearTimeout(debounceRef.current);
    doSearch(query, skill, course, openForTeam);
  };

  const activeFilterCount = [course, openForTeam].filter(Boolean).length;
  const clearFilters = () => { setCourse(null); setOpenForTeam(false); };

  const sendConnection = async (userId) => {
    setPendingIds(prev => new Set([...prev, userId]));
    try {
      await api.post(`/connections/${userId}`);
      toast.success("Bağlantı istəyi göndərildi!");
    } catch (err) {
      setPendingIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const inputStyle = (focused) => ({
    width: "100%", border: `1px solid ${focused ? ACCENT : C.borderColor}`,
    borderRadius: 12, padding: "10px 14px 10px 38px",
    fontSize: 14.5, outline: "none", boxSizing: "border-box",
    background: C.inputBg, color: C.text,
    fontFamily: "'Archivo', sans-serif", fontWeight: 500,
    transition: "border-color .15s",
    boxShadow: focused ? `0 0 0 3px rgba(30,144,255,0.12)` : "none",
  });

  return (
    <div style={{
      maxWidth: 740, margin: "0 auto",
      padding: isMobile ? "16px 12px" : "24px 16px",
      minHeight: "100vh",
      background: C.bg,
      fontFamily: "'Archivo', sans-serif",
      WebkitFontSmoothing: "antialiased",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: C.text, margin: 0, letterSpacing: "0.02em" }}>
          {t("search_title") || "İstifadəçi axtar"}
        </h1>
        <p style={{ fontSize: 13.5, color: C.muted, marginTop: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em" }}>
          {t("search_subtitle") || "Ad, bacarıq və ya kurs üzrə axtar"}
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} style={{
        background: C.surface, border: C.border,
        borderRadius: 18, padding: "18px 18px 14px", marginBottom: 20,
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          {/* Name input */}
          <div style={{ position: "relative", flex: 1, minWidth: isMobile ? "100%" : 180 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: queryFocus ? ACCENT : C.muted, display: "flex", pointerEvents: "none" }}>
              <SearchIcon size={15} />
            </span>
            <input
              type="text" value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t("search_name") || "Ad, soyad..."}
              style={inputStyle(queryFocus)}
              onFocus={() => setQueryFocus(true)}
              onBlur={() => setQueryFocus(false)}
            />
          </div>

          {/* Skill input */}
          <div style={{ position: "relative", flex: 1, minWidth: isMobile ? "100%" : 180 }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: skillFocus ? ACCENT : C.muted, fontWeight: 900, fontSize: 16, pointerEvents: "none", fontFamily: "'Archivo', sans-serif" }}>#</span>
            <input
              type="text" value={skill}
              onChange={e => setSkill(e.target.value)}
              placeholder={t("search_skill") || "Bacarıq (React, Python...)"}
              style={inputStyle(skillFocus)}
              onFocus={() => setSkillFocus(true)}
              onBlur={() => setSkillFocus(false)}
            />
          </div>

          {/* Filter toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "10px 16px",
              borderRadius: 12, border: (showFilters || activeFilterCount > 0) ? `1px solid ${ACCENT}` : C.border,
              background: (showFilters || activeFilterCount > 0) ? "rgba(30,144,255,0.12)" : "transparent",
              color: (showFilters || activeFilterCount > 0) ? ACCENT : C.muted,
              fontSize: 14, fontWeight: 700, cursor: "pointer", position: "relative",
              fontFamily: "inherit", flexShrink: 0,
            }}>
            <SlidersHorizontal size={16} />
            {activeFilterCount > 0 && (
              <span style={{
                position: "absolute", top: -6, right: -6, width: 18, height: 18,
                background: ACCENT, color: "#fff", fontSize: 10, fontWeight: 800,
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'JetBrains Mono', monospace",
              }}>{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div style={{ border: C.border, borderRadius: 12, padding: "14px 16px", marginBottom: 12, background: C.bg }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.muted, fontFamily: "'JetBrains Mono', monospace" }}>■ Filtrlər</span>
              {activeFilterCount > 0 && (
                <button type="button" onClick={clearFilters} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: ACCENT, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", fontWeight: 700 }}>
                  <X size={12} /> Təmizlə
                </button>
              )}
            </div>

            {/* Course chips */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: C.muted, flexShrink: 0, fontWeight: 600 }}>Kurs:</span>
              <div style={{ display: "flex", gap: 6 }}>
                {COURSES.map(({ val, label }) => {
                  const active = course === val;
                  return (
                    <button key={val} type="button" onClick={() => setCourse(active ? null : val)} style={{
                      width: 40, height: 36, borderRadius: 9,
                      border: `1px solid ${active ? ACCENT : C.borderColor}`,
                      background: active ? "rgba(30,144,255,0.14)" : "transparent",
                      color: active ? ACCENT : C.muted,
                      fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
                    }}>{label}</button>
                  );
                })}
              </div>
            </div>

            {/* Open for team */}
            <button type="button" onClick={() => setOpenForTeam(v => !v)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px",
              borderRadius: 10, border: openForTeam ? "1px solid rgba(34,197,94,0.5)" : C.border,
              background: openForTeam ? "rgba(34,197,94,0.10)" : "transparent",
              color: openForTeam ? "#22c55e" : C.muted,
              fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: openForTeam ? "#22c55e" : C.borderColor, display: "inline-block", flexShrink: 0 }} />
              Komanda axtaranlar
            </button>
          </div>
        )}

        <button type="submit" style={{
          ...C.btnPrimary, width: "100%", padding: "11px 0", fontSize: 15, fontWeight: 800,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, borderRadius: 12, fontFamily: "inherit",
          boxShadow: `0 4px 18px rgba(30,144,255,0.35)`,
        }}>
          <SearchIcon size={16} /> {t("search_btn") || "Axtar"}
        </button>
      </form>

      {/* Results count */}
      {searched && results.length > 0 && (
        <p style={{ fontSize: 12.5, color: C.muted, marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em" }}>
          {results.length} {t("search_results") || "nəticə"}
        </p>
      )}

      {/* Results list */}
      {results.length > 0 && (
        <div style={{ background: C.surface, border: C.border, borderRadius: 18, overflow: "hidden" }}>
          {results.map(user => (
            <UserRow key={user.id} user={user} C={C} connectedIds={connectedIds} pendingIds={pendingIds} onConnect={sendConnection} t={t} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {searched && results.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: C.surface, border: C.border, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Users size={24} style={{ color: C.muted }} />
          </div>
          <p style={{ fontWeight: 900, fontSize: 17, color: C.text, margin: "0 0 6px" }}>{t("search_empty") || "Nəticə tapılmadı"}</p>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{t("search_empty_sub") || "Başqa açar söz sına"}</p>
        </div>
      )}
    </div>
  );
}
