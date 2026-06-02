import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Heart, MessageCircle, UserPlus, UserCheck, CheckCheck } from "lucide-react";
import api from "../api/client";
import { useLang } from "../hooks/useLang";
import { useDarkMode } from "../hooks/useTheme";

const ACCENT = "#1E90FF";

function timeAgo(dateStr, t) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return t("time_now");
  if (diff < 3600) return `${Math.floor(diff / 60)} ${t("time_min")}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${t("time_hour")}`;
  return `${Math.floor(diff / 86400)} ${t("time_day")}`;
}

const NOTIF_CONFIG = {
  connection_request:  { icon: UserPlus,      color: "#6366f1", textKey: "notif_connection_request" },
  connection_accepted: { icon: UserCheck,     color: "#22c55e", textKey: "notif_connection_accepted" },
  post_liked:          { icon: Heart,         color: "#ef4444", textKey: "notif_post_liked" },
  post_commented:      { icon: MessageCircle, color: ACCENT,    textKey: "notif_post_commented" },
};

export default function Notifications() {
  const { t } = useLang();
  const { dark } = useDarkMode();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "unread"

  const bg = dark ? "#060f1e" : "#f1f5f9";
  const cardBg = dark ? "#0a1c39" : "#ffffff";
  const border = dark ? "1px solid #1a2b49" : "1px solid #e4e9f1";
  const textColor = dark ? "#ffffff" : "#071428";
  const mutedColor = dark ? "#7d8ba3" : "#69768d";
  const unreadBg = dark ? "rgba(30,144,255,0.08)" : "rgba(30,144,255,0.05)";
  const hoverBg = dark ? "rgba(255,255,255,0.04)" : "#f8faff";

  useEffect(() => {
    api.get("/notifications")
      .then(res => setNotifs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    api.put("/notifications/read-all").catch(() => {});
  }, []);

  const filtered = filter === "unread" ? notifs.filter(n => !n.is_read) : notifs;

  const handleClick = (n) => {
    if (n.post_id) navigate(`/feed`);
    else if (n.from_user_id) navigate(`/profile/${n.from_user_id}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, paddingBottom: 40 }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 0" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(30,144,255,0.12)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={18} style={{ color: ACCENT }} />
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: textColor, fontFamily: "'Archivo', sans-serif" }}>
              {t("notif_title")}
            </h1>
            {notifs.filter(n => !n.is_read).length > 0 && (
              <span style={{ background: ACCENT, color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                {notifs.filter(n => !n.is_read).length}
              </span>
            )}
          </div>
          {notifs.some(n => !n.is_read) && (
            <button
              onClick={() => {
                api.put("/notifications/read-all").catch(() => {});
                setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
              }}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: ACCENT, fontFamily: "'Archivo', sans-serif" }}
            >
              <CheckCheck size={14} />
              Hamısını oxu
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[["all", "Hamısı"], ["unread", "Oxunmamış"]].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{
              background: filter === val ? ACCENT : cardBg,
              color: filter === val ? "#fff" : mutedColor,
              border: filter === val ? "none" : border,
              borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "'Archivo', sans-serif",
              transition: "all .15s",
            }}>{label}</button>
          ))}
        </div>

        {/* List */}
        <div style={{ background: cardBg, border, borderRadius: 16, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: mutedColor, fontSize: 13 }}>Yüklənir...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <Bell size={32} style={{ color: mutedColor, marginBottom: 12 }} />
              <p style={{ color: mutedColor, fontSize: 14, margin: 0, fontFamily: "'Archivo', sans-serif" }}>
                {filter === "unread" ? "Oxunmamış bildiriş yoxdur" : t("notif_empty")}
              </p>
            </div>
          ) : filtered.map((n, i) => {
            const cfg = NOTIF_CONFIG[n.type] || { icon: Bell, color: mutedColor, textKey: "" };
            const Icon = cfg.icon;
            const isLast = i === filtered.length - 1;
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  display: "flex", gap: 12, padding: "14px 18px",
                  borderBottom: isLast ? "none" : `1px solid ${dark ? "rgba(255,255,255,0.06)" : "#f0f4fa"}`,
                  background: n.is_read ? "transparent" : unreadBg,
                  cursor: "pointer", transition: "background .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = n.is_read ? hoverBg : unreadBg}
                onMouseLeave={e => e.currentTarget.style.background = n.is_read ? "transparent" : unreadBg}
              >
                {/* Icon */}
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                  background: `${cfg.color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={16} style={{ color: cfg.color }} />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13.5, color: textColor, lineHeight: 1.5, fontFamily: "'Archivo', sans-serif" }}>
                    <strong>{n.from_user_name}</strong>{" "}
                    <span style={{ fontWeight: 400 }}>{cfg.textKey ? t(cfg.textKey) : ""}</span>
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 11.5, color: mutedColor, fontFamily: "'JetBrains Mono', monospace" }}>
                    {timeAgo(n.created_at, t)}
                  </p>
                </div>

                {/* Unread dot */}
                {!n.is_read && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT, flexShrink: 0, marginTop: 6 }} />
                )}
              </div>
            );
          })}
        </div>

        {notifs.length > 0 && (
          <p style={{ textAlign: "center", color: mutedColor, fontSize: 12, marginTop: 16, fontFamily: "'JetBrains Mono', monospace" }}>
            {notifs.length} bildiriş
          </p>
        )}
      </div>
    </div>
  );
}
