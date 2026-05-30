import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Check, Moon, Sun, Image as ImageIcon, Globe, Lock, Eye, EyeOff, MessageSquare } from "lucide-react";
import { useLang, setLang } from "../hooks/useLang";
import { useIsMobile } from "../hooks/useIsMobile";
import { useDarkMode } from "../hooks/useTheme";
import api from "../api/client";
import { toast } from "../components/Toast";

const ACCENT = "#1E90FF";

function useFonts() {
  useEffect(() => {
    if (document.getElementById("hash-fonts")) return;
    const link = document.createElement("link");
    link.id = "hash-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,800&family=JetBrains+Mono:wght@500;600&display=swap";
    document.head.appendChild(link);
  }, []);
}

function useColors(dark) {
  return {
    bg:       dark ? "#050f1f" : "#f0f4fa",
    surface:  dark ? "#0a1c39" : "#ffffff",
    surface2: dark ? "#0d2248" : "#f8faff",
    border:   dark ? "rgba(255,255,255,0.07)" : "#e4e9f1",
    text:     dark ? "#ffffff" : "#071428",
    muted:    dark ? "#7d8ba3" : "#69768d",
    accentWash: dark ? "rgba(30,144,255,0.12)" : "rgba(30,144,255,0.07)",
  };
}

const BG_OPTIONS = [
  { id: "default",  labelKey: "bg_default",  previewColor: "#f9f9f9" },
  { id: "navy",     labelKey: "bg_navy",      previewColor: "#0f172a" },
  { id: "vectors",  labelKey: "bg_vectors",   previewColor: "#1a1a2e", local: true },
];

const LANG_OPTIONS = [
  { id: "az", flag: "🇦🇿", labelKey: "settings_lang_az" },
  { id: "en", flag: "🇬🇧", labelKey: "settings_lang_en" },
];

function SectionCard({ C, children, style }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 18,
      padding: "22px 22px",
      marginBottom: 14,
      fontFamily: "'Archivo', sans-serif",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionHead({ C, icon: Icon, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: "rgba(30,144,255,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={14} color={ACCENT} />
      </div>
      <span style={{ fontWeight: 800, fontSize: 14, color: C.text, fontFamily: "'Archivo', sans-serif" }}>
        {label}
      </span>
    </div>
  );
}

export default function Settings() {
  const dark = useDarkMode();
  const C = useColors(dark);
  const [selected, setSelected] = useState(localStorage.getItem("bg_theme") || "default");
  const [darkMode, setDarkMode] = useState(localStorage.getItem("dark_mode") === "true");
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [fbText, setFbText] = useState("");
  const [fbCat, setFbCat] = useState("idea");
  const [fbLoading, setFbLoading] = useState(false);
  const { lang, t } = useLang();
  const isMobile = useIsMobile();
  useFonts();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { toast.error("Yeni şifrələr uyğun gəlmir"); return; }
    if (pwForm.newPw.length < 6) { toast.error("Şifrə ən az 6 simvol olmalıdır"); return; }
    setPwLoading(true);
    try {
      await api.put("/users/me/password", { current_password: pwForm.current, new_password: pwForm.newPw });
      toast.success("Şifrə uğurla dəyişdirildi");
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch (err) { toast.error(err.response?.data?.detail || "Xəta baş verdi"); }
    setPwLoading(false);
  };

  const handleSelect = (id) => {
    setSelected(id);
    localStorage.setItem("bg_theme", id);
    window.dispatchEvent(new Event("bg_theme_change"));
  };

  const toggleDarkMode = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem("dark_mode", String(newVal));
    window.dispatchEvent(new Event("dark_mode_change"));
  };

  const inputStyle = (id) => ({
    width: "100%", padding: "11px 14px",
    border: `1px solid ${focusedInput === id ? ACCENT : C.border}`,
    borderRadius: 11, fontSize: 14,
    color: C.text, background: C.surface2,
    outline: "none", boxSizing: "border-box",
    fontFamily: "'Archivo', sans-serif",
    transition: "border-color 0.15s, box-shadow 0.15s",
    boxShadow: focusedInput === id ? "0 0 0 3px rgba(30,144,255,0.12)" : "none",
  });

  const submitDisabled = pwLoading || !pwForm.current || !pwForm.newPw || !pwForm.confirm;

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      fontFamily: "'Archivo', sans-serif",
    }}>
      <div style={{ maxWidth: 660, margin: "0 auto", padding: isMobile ? "20px 12px" : "32px 20px" }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
              color: ACCENT, fontFamily: "'JetBrains Mono', monospace",
              textTransform: "uppercase",
            }}>CONFIG</span>
          </div>
          <h1 style={{
            fontSize: isMobile ? 22 : 26, fontWeight: 900,
            color: C.text, margin: 0, letterSpacing: "-0.02em",
          }}>
            {t("settings_title")}
          </h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 5 }}>
            {t("settings_subtitle")}
          </p>
        </div>

        {/* Dark mode toggle */}
        <SectionCard C={C}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11,
                background: "rgba(30,144,255,0.10)",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid rgba(30,144,255,0.15)",
              }}>
                {darkMode ? <Moon size={17} color={ACCENT} /> : <Sun size={17} color={ACCENT} />}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{t("settings_dark_mode")}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{t("settings_dark_desc")}</div>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              style={{
                width: 48, height: 26, borderRadius: 13,
                background: darkMode ? ACCENT : C.border,
                border: "none", cursor: "pointer", position: "relative",
                transition: "background 0.2s",
                boxShadow: darkMode ? "0 2px 8px rgba(30,144,255,0.35)" : "none",
                flexShrink: 0,
              }}
            >
              <span style={{
                position: "absolute", top: 3,
                left: darkMode ? 25 : 3,
                width: 20, height: 20, borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.20)",
              }} />
            </button>
          </div>
        </SectionCard>

        {/* Password change */}
        <SectionCard C={C}>
          <SectionHead C={C} icon={Lock} label="Şifrəni dəyişdir" />
          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            <div style={{ position: "relative" }}>
              <input
                type={showCurrent ? "text" : "password"}
                placeholder="Cari şifrə"
                value={pwForm.current}
                onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                onFocus={() => setFocusedInput("current")}
                onBlur={() => setFocusedInput(null)}
                style={{ ...inputStyle("current"), paddingRight: 42 }}
                required
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: C.muted,
                padding: 0, display: "flex", alignItems: "center",
              }}>
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showNew ? "text" : "password"}
                placeholder="Yeni şifrə (min. 6 simvol)"
                value={pwForm.newPw}
                onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
                onFocus={() => setFocusedInput("newPw")}
                onBlur={() => setFocusedInput(null)}
                style={{ ...inputStyle("newPw"), paddingRight: 42 }}
                required
              />
              <button type="button" onClick={() => setShowNew(v => !v)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: C.muted,
                padding: 0, display: "flex", alignItems: "center",
              }}>
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <input
              type="password"
              placeholder="Yeni şifrəni təkrarla"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              onFocus={() => setFocusedInput("confirm")}
              onBlur={() => setFocusedInput(null)}
              style={inputStyle("confirm")}
              required
            />
            {pwForm.newPw && pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
              <p style={{ fontSize: 12, color: "#f87171", margin: 0, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                ✗ Şifrələr uyğun gəlmir
              </p>
            )}
            <button
              type="submit"
              disabled={submitDisabled}
              style={{
                background: submitDisabled ? "rgba(30,144,255,0.35)" : ACCENT,
                color: "#fff", border: "none",
                padding: "12px 0", borderRadius: 11,
                fontSize: 14, fontWeight: 800,
                cursor: submitDisabled ? "not-allowed" : "pointer",
                width: "100%", marginTop: 2,
                boxShadow: submitDisabled ? "none" : "0 6px 20px rgba(30,144,255,0.35)",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => { if (!submitDisabled) e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              {pwLoading ? "Dəyişdirilir..." : "Şifrəni dəyişdir"}
            </button>
          </form>
        </SectionCard>

        {/* Language */}
        <SectionCard C={C}>
          <SectionHead C={C} icon={Globe} label={t("settings_lang")} />
          <p style={{ fontSize: 12, color: C.muted, margin: "0 0 14px", lineHeight: 1.5 }}>{t("settings_lang_desc")}</p>
          <div style={{ display: "flex", gap: 10 }}>
            {LANG_OPTIONS.map((opt) => {
              const isActive = lang === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setLang(opt.id)}
                  style={{
                    flex: 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "11px 0", borderRadius: 12,
                    border: `${isActive ? 2 : 1}px solid ${isActive ? ACCENT : C.border}`,
                    background: isActive ? "rgba(30,144,255,0.10)" : C.surface2,
                    color: isActive ? ACCENT : C.muted,
                    fontSize: 13, fontWeight: isActive ? 800 : 600,
                    cursor: "pointer",
                    fontFamily: "'Archivo', sans-serif",
                    transition: "all 0.15s",
                    boxShadow: isActive ? "0 0 0 1px rgba(30,144,255,0.20)" : "none",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{opt.flag}</span>
                  <span>{t(opt.labelKey)}</span>
                  {isActive && <Check size={12} color={ACCENT} />}
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* Background */}
        <SectionCard C={C}>
          <SectionHead C={C} icon={ImageIcon} label={t("settings_bg")} />
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
            {BG_OPTIONS.map((opt) => {
              const isActive = selected === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  style={{
                    border: `${isActive ? 2 : 1}px solid ${isActive ? ACCENT : C.border}`,
                    background: C.surface2,
                    padding: 0,
                    cursor: "pointer",
                    borderRadius: 14,
                    overflow: "hidden",
                    outline: "none",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    boxShadow: isActive ? "0 0 0 3px rgba(30,144,255,0.18)" : "none",
                  }}
                >
                  <div style={{
                    height: 64,
                    background: opt.previewColor,
                    position: "relative",
                    ...(opt.local ? { backgroundImage: "url('/bg-vectors.png')", backgroundSize: "300px", backgroundRepeat: "repeat" } : {}),
                  }}>
                    {isActive && (
                      <div style={{
                        position: "absolute", top: 6, right: 6,
                        width: 22, height: 22, background: ACCENT, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(30,144,255,0.40)",
                      }}>
                        <Check size={12} color="#fff" />
                      </div>
                    )}
                  </div>
                  <div style={{
                    padding: "7px 10px",
                    borderTop: `1px solid ${C.border}`,
                    textAlign: "center",
                  }}>
                    <span style={{
                      fontSize: 12, color: isActive ? ACCENT : C.muted,
                      fontWeight: isActive ? 700 : 500,
                      fontFamily: "'Archivo', sans-serif",
                    }}>{t(opt.labelKey)}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 12, textAlign: "center" }}>
            {t("settings_bg_note")}
          </p>
        </SectionCard>

        {/* Feedback */}
        <SectionCard C={C} style={{ marginBottom: 0 }}>
          <SectionHead C={C} icon={MessageSquare} label="Rəy və təklif" />
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[{ val: "idea", label: "💡 Təklif" }, { val: "bug", label: "🐛 Xəta" }, { val: "other", label: "💬 Digər" }].map(c => (
              <button
                key={c.val}
                onClick={() => setFbCat(c.val)}
                style={{
                  padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  borderRadius: 99,
                  border: `1px solid ${fbCat === c.val ? ACCENT : C.border}`,
                  background: fbCat === c.val ? "rgba(30,144,255,0.12)" : C.surface2,
                  color: fbCat === c.val ? ACCENT : C.muted,
                  fontFamily: "'Archivo', sans-serif",
                  transition: "all 0.15s",
                }}
              >{c.label}</button>
            ))}
          </div>
          <textarea
            value={fbText}
            onChange={e => setFbText(e.target.value)}
            placeholder="Platformaya dair fikirlərinizi yazın..."
            rows={4}
            style={{
              width: "100%", boxSizing: "border-box", padding: "11px 14px",
              fontSize: 13, lineHeight: 1.6,
              border: `1px solid ${C.border}`,
              borderRadius: 11,
              background: C.surface2,
              color: C.text,
              outline: "none",
              resize: "vertical",
              fontFamily: "'Archivo', sans-serif",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = "0 0 0 3px rgba(30,144,255,0.12)"; }}
            onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
          />
          <button
            disabled={fbLoading || !fbText.trim()}
            onClick={async () => {
              if (!fbText.trim()) return;
              setFbLoading(true);
              try {
                await api.post("/feedback", { content: fbText.trim(), category: fbCat });
                toast.success("Rəyiniz göndərildi, təşəkkür edirik!");
                setFbText("");
              } catch { toast.error("Göndərilmədi, yenidən cəhd edin"); }
              finally { setFbLoading(false); }
            }}
            style={{
              marginTop: 12, padding: "10px 24px",
              background: fbLoading || !fbText.trim() ? "rgba(30,144,255,0.35)" : ACCENT,
              color: "#fff", border: "none",
              borderRadius: 10,
              fontSize: 13, fontWeight: 800,
              cursor: fbLoading || !fbText.trim() ? "not-allowed" : "pointer",
              fontFamily: "'Archivo', sans-serif",
              boxShadow: (!fbLoading && fbText.trim()) ? "0 4px 14px rgba(30,144,255,0.30)" : "none",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => { if (!fbLoading && fbText.trim()) e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            {fbLoading ? "Göndərilir..." : "Göndər"}
          </button>
        </SectionCard>

      </div>
    </div>
  );
}
