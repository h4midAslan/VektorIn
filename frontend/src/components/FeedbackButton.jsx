import { useState } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import api from "../api/client";
import { toast } from "./Toast";
import { useDarkMode } from "../hooks/useTheme";

const ACCENT = "#1E90FF";

const CATEGORIES = [
  { val: "idea", label: "Təklif" },
  { val: "bug",  label: "Xəta"   },
  { val: "other",label: "Digər"  },
];

export default function FeedbackModal({ open, onClose }) {
  const dark = useDarkMode();
  const [cat, setCat] = useState("idea");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const C = {
    bg:      dark ? "#0a1c39" : "#ffffff",
    border:  dark ? "#1a2b49" : "#e4e9f1",
    text:    dark ? "#ffffff" : "#071428",
    muted:   dark ? "#7d8ba3" : "#69768d",
    input:   dark ? "#071428" : "#f5f7fb",
    overlay: "rgba(0,0,0,0.55)",
  };

  const send = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await api.post("/feedback", { content: text.trim(), category: cat });
      toast.success("Rəyiniz göndərildi, təşəkkür edirik!");
      setText(""); setCat("idea"); onClose();
    } catch {
      toast.error("Göndərilmədi, yenidən cəhd edin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1200,
        background: C.overlay,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 400,
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px 14px",
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <MessageSquare size={16} color={ACCENT} />
            <span style={{
              fontSize: 14, fontWeight: 800, color: C.text,
              fontFamily: "'Archivo', sans-serif",
            }}>
              Rəy və Təklif
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.muted, padding: 4, display: "flex",
              borderRadius: 8, transition: "color .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = C.text}
            onMouseLeave={e => e.currentTarget.style.color = C.muted}
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 22px 22px" }}>
          {/* Category tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {CATEGORIES.map(c => (
              <button
                key={c.val}
                onClick={() => setCat(c.val)}
                style={{
                  flex: 1, padding: "7px 0", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", borderRadius: 10, transition: "all .15s",
                  border: `1px solid ${cat === c.val ? ACCENT : C.border}`,
                  background: cat === c.val ? ACCENT : "transparent",
                  color: cat === c.val ? "#fff" : C.muted,
                  fontFamily: "'Archivo', sans-serif",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Fikirlərinizi yazın..."
            rows={4}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "11px 14px", fontSize: 13.5,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              background: C.input,
              color: C.text,
              resize: "none", outline: "none",
              fontFamily: "'Archivo', sans-serif",
              lineHeight: 1.55,
              transition: "border-color .15s",
            }}
            onFocus={e => e.target.style.borderColor = ACCENT}
            onBlur={e => e.target.style.borderColor = C.border}
          />

          {/* Send button */}
          <button
            onClick={send}
            disabled={loading || !text.trim()}
            style={{
              marginTop: 12, width: "100%", padding: "11px",
              background: text.trim() && !loading ? ACCENT : C.input,
              border: `1px solid ${text.trim() && !loading ? ACCENT : C.border}`,
              color: text.trim() && !loading ? "#fff" : C.muted,
              borderRadius: 12, fontSize: 13.5, fontWeight: 700,
              cursor: text.trim() && !loading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              fontFamily: "'Archivo', sans-serif",
              transition: "all .15s",
              boxShadow: text.trim() && !loading ? "0 4px 14px rgba(30,144,255,0.30)" : "none",
            }}
          >
            <Send size={14} />
            {loading ? "Göndərilir..." : "Göndər"}
          </button>
        </div>
      </div>
    </div>
  );
}
