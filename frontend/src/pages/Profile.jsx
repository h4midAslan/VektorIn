import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "../components/Toast";
import {
  Edit3, Save, X, BookOpen, Award, GraduationCap, Sparkles, Plus, Trash2,
  ExternalLink, Camera, FolderGit2, Code2, Heart, ThumbsDown, MessageCircle,
  FileText, Send, Mail, Inbox, Github, Globe, Linkedin,
} from "lucide-react";
import api from "../api/client";
import UserAvatar from "../components/UserAvatar";
import { formatBakuDate, formatBakuHM } from "../utils/time";
import { useIsMobile } from "../hooks/useIsMobile";

const S = {
  page:        { maxWidth: 760, margin: "0 auto", padding: "20px 12px" },
  card:        { background: "#ffffff", border: "1px solid #d4d4d4", marginBottom: 12 },
  sectionPad:  { padding: "16px 20px" },
  label:       { display: "block", fontSize: 12, fontWeight: 600, color: "#1a1a1a", marginBottom: 6 },
  input:       { width: "100%", padding: "8px 10px", border: "1px solid #ccc", borderRadius: 2, fontSize: 14, color: "#1a1a1a", background: "#fff", outline: "none", boxSizing: "border-box" },
  textarea:    { width: "100%", padding: "8px 10px", border: "1px solid #ccc", borderRadius: 2, fontSize: 14, color: "#1a1a1a", background: "#fff", outline: "none", resize: "vertical", boxSizing: "border-box" },
  btnPrimary:  { background: "#1a4a8a", color: "#fff", border: "1px solid #1a4a8a", padding: "7px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: 2 },
  btnGhost:    { background: "#fff", color: "#333", border: "1px solid #ccc", padding: "7px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer", borderRadius: 2 },
  btnDanger:   { background: "transparent", border: "none", color: "#c0392b", cursor: "pointer", padding: 4, lineHeight: 1 },
  sectionTitle:{ fontSize: 12, fontWeight: 600, color: "#666", textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 },
  chip:        { border: "1px solid #ccc", padding: "2px 8px", fontSize: 11, color: "#333", background: "#fafafa", borderRadius: 2, display: "inline-block" },
  muted:       { color: "#666", fontSize: 13 },
  faint:       { color: "#999", fontSize: 12 },
  heading:     { color: "#1a1a1a", fontWeight: 700 },
};

const TABS = [
  { key: "about",   label: "Xülasə",      icon: BookOpen },
  { key: "posts",   label: "Postlar",      icon: FileText },
  { key: "projects",label: "Layihələr",    icon: FolderGit2 },
  { key: "certs",   label: "Sertifikatlar",icon: Award },
];

export default function Profile() {
  const { id } = useParams();
  const isMobile = useIsMobile();
  const [user, setUser]         = useState(null);
  const [isOwn, setIsOwn]       = useState(!id);
  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState({});
  const [activeTab, setActiveTab] = useState("about");
  const [certificates, setCertificates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certForm, setCertForm] = useState({ name: "", issuer: "", issue_date: "", credential_url: "", image_url: "" });
  const [certImageUploading, setCertImageUploading] = useState(false);
  const [projForm, setProjForm] = useState({ title: "", description: "", github_url: "", technologies: "" });
  const [showCertForm, setShowCertForm] = useState(false);
  const [showProjForm, setShowProjForm] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [showQuickMsg, setShowQuickMsg] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSent, setMsgSent]   = useState("");
  const [inbox, setInbox]       = useState([]);
  const [showInbox, setShowInbox] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfile(); loadCertificates(); loadProjects(); loadUserPosts(); loadTemplates();
  }, [id]);

  const loadProfile = async () => {
    try {
      if (id) {
        const [profileRes, meRes] = await Promise.all([api.get(`/users/${id}`), api.get("/users/me")]);
        setUser(profileRes.data); setForm(profileRes.data);
        setIsOwn(meRes.data.id === profileRes.data.id);
      } else {
        const res = await api.get("/users/me");
        setUser(res.data); setForm(res.data); setIsOwn(true);
      }
    } catch {}
  };

  const loadCertificates = async () => {
    try {
      const res = id ? await api.get(`/certificates/user/${id}`) : await api.get("/certificates/me");
      setCertificates(res.data);
    } catch {}
  };

  const loadProjects = async () => {
    try {
      const res = id ? await api.get(`/projects/user/${id}`) : await api.get("/projects/me");
      setProjects(res.data);
    } catch {}
  };

  const loadUserPosts = async () => {
    try {
      const userId = id || (await api.get("/users/me")).data.id;
      const res = await api.get(`/posts/user/${userId}`);
      setUserPosts(res.data);
    } catch {}
  };

  const loadTemplates = async () => {
    try { const res = await api.get("/messages/templates"); setTemplates(res.data); } catch {}
  };

  const loadInbox = async () => {
    try { const res = await api.get("/messages/inbox"); setInbox(res.data); setShowInbox(true); } catch {}
  };

  const sendQuickMessage = async (index) => {
    if (!user) return;
    setSendingMsg(true);
    try {
      await api.post(`/messages/${user.id}`, { template_index: index });
      setMsgSent(templates[index]);
      setTimeout(() => { setMsgSent(""); setShowQuickMsg(false); }, 1500);
    } catch (err) { toast.error(err.response?.data?.detail || "Mesaj göndərilmədi"); }
    setSendingMsg(false);
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("Bu postu silmək istədiyinə əminsən?")) return;
    try { await api.delete(`/posts/${postId}`); loadUserPosts(); } catch {}
  };

  const handleUploadPic = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingPic(true);
    try {
      const formData = new FormData(); formData.append("file", file);
      const uploadRes = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      await api.put("/users/me", { profile_picture: uploadRes.data.url });
      loadProfile();
    } catch {}
    setUploadingPic(false);
  };

  const handleCertImagePick = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setCertImageUploading(true);
    try {
      const formData = new FormData(); formData.append("file", file);
      const res = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setCertForm(prev => ({ ...prev, image_url: res.data.url }));
    } catch {}
    setCertImageUploading(false); e.target.value = "";
  };

  const handleAddCert = async () => {
    try {
      await api.post("/certificates", { ...certForm, issue_date: certForm.issue_date || null, credential_url: certForm.credential_url || null, image_url: certForm.image_url || null });
      setCertForm({ name: "", issuer: "", issue_date: "", credential_url: "", image_url: "" });
      setShowCertForm(false); loadCertificates();
    } catch {}
  };

  const handleDeleteCert = async (certId) => {
    try { await api.delete(`/certificates/${certId}`); loadCertificates(); } catch {}
  };

  const handleAddProject = async () => {
    try {
      await api.post("/projects", { ...projForm, technologies: projForm.technologies || null, github_url: projForm.github_url || null });
      setProjForm({ title: "", description: "", github_url: "", technologies: "" });
      setShowProjForm(false); loadProjects();
    } catch {}
  };

  const handleDeleteProject = async (projId) => {
    try { await api.delete(`/projects/${projId}`); loadProjects(); } catch {}
  };

  const handleSave = async () => {
    try {
      await api.put("/users/me", {
        full_name:     form.full_name,
        headline:      form.headline      || null,
        major:         form.major         || null,
        course:        form.course        || null,
        bio:           form.bio           || null,
        skills:        form.skills        || null,
        github_url:    form.github_url    || null,
        linkedin_url:  form.linkedin_url  || null,
        website_url:   form.website_url   || null,
        is_open_for_team: form.is_open_for_team,
      });
      setEditing(false); loadProfile();
    } catch {}
  };

  const getCompletionPercent = () => {
    if (!user) return 0;
    const checks = [!!user.full_name, !!user.headline, !!user.major, !!user.bio, !!user.skills, !!user.profile_picture, certificates.length > 0, projects.length > 0];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  };

  if (!user) return (
    <div style={{ ...S.page, paddingTop: 40 }}>
      <div style={{ ...S.card, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 72, height: 72, background: "#e8e8e8", border: "1px solid #d4d4d4" }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 16, background: "#e8e8e8", width: 160, marginBottom: 8 }} />
            <div style={{ height: 12, background: "#e8e8e8", width: 120 }} />
          </div>
        </div>
        {[1, 2, 3].map(i => <div key={i} style={{ height: 60, background: "#f0f0f0", border: "1px solid #e0e0e0", marginBottom: 8 }} />)}
      </div>
    </div>
  );

  const completionPercent = getCompletionPercent();
  const completionBarColor = completionPercent < 50 ? "#e67e22" : completionPercent < 80 ? "#2980b9" : "#27ae60";

  return (
    <div style={{ background: "#f2f2f2", minHeight: "100vh" }}>
      <div style={{ ...S.page, padding: isMobile ? "12px 10px" : S.page.padding }}>

        {/* ── HEADER CARD ── */}
        <div style={S.card}>
          <div style={{ padding: isMobile ? "16px 14px 0 14px" : "20px 20px 0 20px", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "center" : "flex-start", justifyContent: "space-between", gap: 16 }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{ width: 80, height: 80, border: "1px solid #d4d4d4", overflow: "hidden", cursor: isOwn ? "pointer" : "default" }}
                onClick={isOwn ? () => fileInputRef.current?.click() : undefined}
              >
                <UserAvatar user={user} size="lg" className="rounded-none" />
                {isOwn && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                    <Camera size={22} color="#fff" />
                  </div>
                )}
              </div>
              {isOwn && <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleUploadPic} />}
            </div>

            {/* Name / Info */}
            <div style={{ flex: 1, minWidth: 0, textAlign: isMobile ? "center" : "left" }}>
              <h2 style={{ ...S.heading, fontSize: 18, margin: "0 0 2px 0" }}>{user.full_name}</h2>
              {user.headline && (
                <p style={{ margin: "0 0 4px 0", fontSize: 14, color: "#444" }}>{user.headline}</p>
              )}
              <p style={{ ...S.faint, margin: "0 0 6px 0" }}>{user.email}</p>
              {user.major && (
                <p style={{ ...S.muted, margin: "0 0 6px 0" }}>
                  <GraduationCap size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, color: "#666" }} />
                  {user.major}{user.course && ` · ${user.course}-ci kurs`}
                </p>
              )}
              {/* Social links */}
              {(user.github_url || user.linkedin_url || user.website_url) && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start", marginBottom: 6 }}>
                  {user.github_url && (
                    <a href={user.github_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#444", textDecoration: "none" }}>
                      <Github size={13} /> GitHub
                    </a>
                  )}
                  {user.linkedin_url && (
                    <a href={user.linkedin_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#0077b5", textDecoration: "none" }}>
                      <Linkedin size={13} /> LinkedIn
                    </a>
                  )}
                  {user.website_url && (
                    <a href={user.website_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#444", textDecoration: "none" }}>
                      <Globe size={13} /> Website
                    </a>
                  )}
                </div>
              )}
              {user.is_open_for_team && (
                <span style={{ display: "inline-block", border: "1px solid #aac4e8", padding: "2px 10px", fontSize: 11, color: "#1a4a8a", background: "#edf3fb" }}>
                  Komanda üçün açıq
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: 6, alignItems: isMobile ? "stretch" : "flex-end", flexShrink: 0, width: isMobile ? "100%" : undefined, justifyContent: isMobile ? "center" : undefined }}>
              {isOwn ? (
                <>
                  <button onClick={() => setEditing(!editing)} style={{ ...S.btnGhost, flex: isMobile ? 1 : undefined }}>
                    {editing ? <><X size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Ləğv et</> : <><Edit3 size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Redaktə</>}
                  </button>
                  <button onClick={loadInbox} style={{ ...S.btnGhost, flex: isMobile ? 1 : undefined }}>
                    <Inbox size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Gələn qutusu
                  </button>
                </>
              ) : (
                <button onClick={() => setShowQuickMsg(true)} style={{ ...S.btnGhost, width: isMobile ? "100%" : undefined }}>
                  <Mail size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Mesaj
                </button>
              )}
            </div>
          </div>

          {/* Completion bar */}
          {isOwn && completionPercent < 100 && (
            <div style={{ margin: isMobile ? "12px 14px 0 14px" : "16px 20px 0 20px", padding: "12px 14px", background: "#fafafa", border: "1px solid #e0e0e0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>Profil tamamlanması</span>
                <span style={{ fontSize: 11, color: "#1a4a8a", fontWeight: 700 }}>{completionPercent}%</span>
              </div>
              <div style={{ height: 4, background: "#e0e0e0" }}>
                <div style={{ height: 4, background: completionBarColor, width: `${completionPercent}%`, transition: "width 0.4s" }} />
              </div>
              <p style={{ fontSize: 11, color: "#999", marginTop: 6, marginBottom: 0 }}>
                {!user.headline && "başlıq, "}{!user.profile_picture && "profil şəkli, "}{!user.bio && "haqqında, "}{!user.skills && "bacarıqlar, "}
                {certificates.length === 0 && "sertifikat, "}{projects.length === 0 && "layihə "}əlavə et
              </p>
            </div>
          )}

          {/* ── TABS ── */}
          <div style={{ display: "flex", borderTop: "1px solid #e0e0e0", marginTop: 16 }}>
            {TABS.map(({ key, label, icon: Icon }) => {
              const count = key === "posts" ? userPosts.length : key === "projects" ? projects.length : key === "certs" ? certificates.length : null;
              return (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); setEditing(false); }}
                  style={{
                    flex: 1,
                    padding: isMobile ? "10px 4px" : "12px 8px",
                    fontSize: isMobile ? 11 : 12,
                    fontWeight: activeTab === key ? 700 : 500,
                    color: activeTab === key ? "#1a4a8a" : "#888",
                    background: "none",
                    border: "none",
                    borderBottom: activeTab === key ? "2px solid #1a4a8a" : "2px solid transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    transition: "color 0.15s",
                  }}
                >
                  <Icon size={12} />
                  {label}
                  {count !== null && count > 0 && (
                    <span style={{ fontSize: 10, background: activeTab === key ? "#1a4a8a" : "#ccc", color: "#fff", borderRadius: 10, padding: "0 5px", lineHeight: "16px" }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── EDIT FORM ── */}
        {editing && (
          <div style={S.card}>
            <div style={S.sectionPad}>
              <p style={{ ...S.sectionTitle, marginBottom: 16 }}>Profili redaktə et</p>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={S.label}>Ad Soyad</label>
                  <input type="text" value={form.full_name || ""} onChange={e => setForm({ ...form, full_name: e.target.value })} style={S.input} />
                </div>
                <div>
                  <label style={S.label}>Başlıq (Headline)</label>
                  <input type="text" value={form.headline || ""} onChange={e => setForm({ ...form, headline: e.target.value })} placeholder="Frontend Dev · 3-cü kurs" style={S.input} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={S.label}>İxtisas</label>
                  <input type="text" value={form.major || ""} onChange={e => setForm({ ...form, major: e.target.value })} style={S.input} />
                </div>
                <div>
                  <label style={S.label}>Kurs</label>
                  <select value={form.course || ""} onChange={e => setForm({ ...form, course: parseInt(e.target.value) || null })} style={S.input}>
                    <option value="">Seçin</option>
                    {[1,2,3,4].map(c => <option key={c} value={c}>{c}-ci kurs</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>Haqqında</label>
                <textarea value={form.bio || ""} onChange={e => setForm({ ...form, bio: e.target.value })} style={S.textarea} rows={3} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>Bacarıqlar <span style={{ fontWeight: 400, color: "#999" }}>(vergüllə ayırın)</span></label>
                <input type="text" value={form.skills || ""} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="Python, React, Design" style={S.input} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ ...S.label, marginBottom: 10 }}>Sosial linklər</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Github size={15} color="#555" style={{ flexShrink: 0 }} />
                    <input type="url" value={form.github_url || ""} onChange={e => setForm({ ...form, github_url: e.target.value })} placeholder="https://github.com/username" style={{ ...S.input, flex: 1 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Linkedin size={15} color="#0077b5" style={{ flexShrink: 0 }} />
                    <input type="url" value={form.linkedin_url || ""} onChange={e => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/username" style={{ ...S.input, flex: 1 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Globe size={15} color="#555" style={{ flexShrink: 0 }} />
                    <input type="url" value={form.website_url || ""} onChange={e => setForm({ ...form, website_url: e.target.value })} placeholder="https://yoursite.com" style={{ ...S.input, flex: 1 }} />
                  </div>
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid #e0e0e0", background: "#fafafa", cursor: "pointer", marginBottom: 16 }}>
                <input type="checkbox" checked={form.is_open_for_team || false} onChange={e => setForm({ ...form, is_open_for_team: e.target.checked })} style={{ width: 15, height: 15 }} />
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>Komanda üçün açığam</span>
                  <p style={{ fontSize: 11, color: "#999", margin: "2px 0 0 0" }}>Başqaları sizi komandaya dəvət edə bilər</p>
                </div>
              </label>

              <button onClick={handleSave} style={S.btnPrimary}>
                <Save size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />Yadda saxla
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: XÜLASƏ ── */}
        {!editing && activeTab === "about" && (
          <>
            {user.bio && (
              <div style={S.card}>
                <div style={S.sectionPad}>
                  <p style={S.sectionTitle}><BookOpen size={13} color="#666" /> Haqqında</p>
                  <p style={{ ...S.muted, lineHeight: 1.6, margin: 0 }}>{user.bio}</p>
                </div>
              </div>
            )}
            {user.skills && (
              <div style={S.card}>
                <div style={S.sectionPad}>
                  <p style={S.sectionTitle}><Sparkles size={13} color="#666" /> Bacarıqlar</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {user.skills.split(",").map((s, i) => <span key={i} style={S.chip}>{s.trim()}</span>)}
                  </div>
                </div>
              </div>
            )}
            {!user.bio && !user.skills && isOwn && (
              <div style={{ ...S.card, ...S.sectionPad }}>
                <p style={{ ...S.faint, textAlign: "center", margin: 0 }}>Profili doldurmaq üçün "Redaktə" düyməsinə bas</p>
              </div>
            )}
          </>
        )}

        {/* ── TAB: POSTLAR ── */}
        {!editing && activeTab === "posts" && (
          <div style={S.card}>
            <div style={S.sectionPad}>
              <p style={S.sectionTitle}><FileText size={13} color="#666" /> Postlar <span style={{ color: "#bbb", fontSize: 11, fontWeight: 400 }}>({userPosts.length})</span></p>
              {userPosts.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {userPosts.map(post => (
                    <div key={post.id} style={{ border: "1px solid #d4d4d4", padding: "12px 14px", background: "#fff" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div style={{ flex: 1 }}>
                          {post.content && <p style={{ margin: "0 0 8px 0", fontSize: 13, color: "#333", whiteSpace: "pre-wrap", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.content}</p>}
                          {!post.content && post.image_url && <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "#999", fontStyle: "italic" }}>Şəkil post</p>}
                          {!post.content && post.video_url && <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "#999", fontStyle: "italic" }}>Video post</p>}
                          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#999" }}><Heart size={11} /> {post.like_count}</span>
                            {post.show_dislikes && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#999" }}><ThumbsDown size={11} /> {post.dislike_count}</span>}
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#999" }}><MessageCircle size={11} /> {post.comment_count}</span>
                            <span style={{ fontSize: 11, color: "#bbb" }}>{formatBakuDate(post.created_at)}</span>
                          </div>
                        </div>
                        {isOwn && <button onClick={() => handleDeletePost(post.id)} style={{ ...S.btnDanger, marginLeft: 12 }}><Trash2 size={15} /></button>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ ...S.faint, textAlign: "center", padding: "12px 0", margin: 0 }}>{isOwn ? "Hələ post paylaşmamısan" : "Post yoxdur"}</p>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: LAYİHƏLƏR ── */}
        {!editing && activeTab === "projects" && (
          <div style={S.card}>
            <div style={S.sectionPad}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <p style={{ ...S.sectionTitle, margin: 0 }}><FolderGit2 size={13} color="#666" /> Layihələr</p>
                {isOwn && (
                  <button onClick={() => setShowProjForm(!showProjForm)} style={{ ...S.btnGhost, padding: "4px 10px", fontSize: 12 }}>
                    <Plus size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />Əlavə et
                  </button>
                )}
              </div>
              {isOwn && showProjForm && (
                <div style={{ border: "1px solid #d4d4d4", padding: 14, marginBottom: 12, background: "#fafafa" }}>
                  <input type="text" placeholder="Layihə adı" value={projForm.title} onChange={e => setProjForm({ ...projForm, title: e.target.value })} style={{ ...S.input, marginBottom: 8 }} />
                  <textarea placeholder="Qısa təsvir" value={projForm.description} onChange={e => setProjForm({ ...projForm, description: e.target.value })} rows={2} style={{ ...S.textarea, marginBottom: 8 }} />
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <input type="text" placeholder="Texnologiyalar (React, Python...)" value={projForm.technologies} onChange={e => setProjForm({ ...projForm, technologies: e.target.value })} style={S.input} />
                    <input type="url" placeholder="GitHub linki" value={projForm.github_url} onChange={e => setProjForm({ ...projForm, github_url: e.target.value })} style={S.input} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleAddProject} disabled={!projForm.title} style={{ ...S.btnPrimary, opacity: !projForm.title ? 0.4 : 1 }}>Əlavə et</button>
                    <button onClick={() => setShowProjForm(false)} style={S.btnGhost}>Ləğv et</button>
                  </div>
                </div>
              )}
              {projects.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {projects.map(proj => (
                    <div key={proj.id} style={{ border: "1px solid #d4d4d4", padding: "12px 14px", background: "#fff" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: "0 0 4px 0", fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{proj.title}</p>
                          {proj.description && <p style={{ margin: "0 0 6px 0", fontSize: 12, color: "#666" }}>{proj.description}</p>}
                          {proj.technologies && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {proj.technologies.split(",").map((t, i) => <span key={i} style={S.chip}>{t.trim()}</span>)}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 12 }}>
                          {proj.github_url && <a href={proj.github_url} target="_blank" rel="noreferrer" style={{ color: "#666", lineHeight: 1 }}><Code2 size={15} /></a>}
                          {isOwn && <button onClick={() => handleDeleteProject(proj.id)} style={S.btnDanger}><Trash2 size={15} /></button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ ...S.faint, textAlign: "center", padding: "12px 0", margin: 0 }}>{isOwn ? "Hələ layihə əlavə olunmayıb" : "Layihə yoxdur"}</p>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: SERTİFİKATLAR ── */}
        {!editing && activeTab === "certs" && (
          <div style={S.card}>
            <div style={S.sectionPad}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <p style={{ ...S.sectionTitle, margin: 0 }}><Award size={13} color="#666" /> Sertifikatlar</p>
                {isOwn && (
                  <button onClick={() => setShowCertForm(!showCertForm)} style={{ ...S.btnGhost, padding: "4px 10px", fontSize: 12 }}>
                    <Plus size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />Əlavə et
                  </button>
                )}
              </div>
              {isOwn && showCertForm && (
                <div style={{ border: "1px solid #d4d4d4", padding: 14, marginBottom: 12, background: "#fafafa" }}>
                  <input type="text" placeholder="Sertifikat adı" value={certForm.name} onChange={e => setCertForm({ ...certForm, name: e.target.value })} style={{ ...S.input, marginBottom: 8 }} />
                  <input type="text" placeholder="Verən təşkilat (Google, ISC2...)" value={certForm.issuer} onChange={e => setCertForm({ ...certForm, issuer: e.target.value })} style={{ ...S.input, marginBottom: 8 }} />
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <input type="date" value={certForm.issue_date} onChange={e => setCertForm({ ...certForm, issue_date: e.target.value })} style={S.input} />
                    <input type="url" placeholder="Doğrulama linki" value={certForm.credential_url} onChange={e => setCertForm({ ...certForm, credential_url: e.target.value })} style={S.input} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Sertifikat şəkli (istəyə bağlı)</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <label style={{ ...S.btnGhost, padding: "5px 10px", fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <input type="file" accept="image/*" onChange={handleCertImagePick} style={{ display: "none" }} />
                        {certImageUploading ? "Yüklənir..." : "Şəkil seç"}
                      </label>
                      {certForm.image_url && <img src={certForm.image_url} alt="cert" style={{ height: 40, border: "1px solid #d4d4d4", objectFit: "cover" }} />}
                      {certForm.image_url && <button onClick={() => setCertForm(prev => ({ ...prev, image_url: "" }))} style={{ ...S.btnDanger, padding: "4px 6px" }}>✕</button>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleAddCert} disabled={!certForm.name || !certForm.issuer} style={{ ...S.btnPrimary, opacity: (!certForm.name || !certForm.issuer) ? 0.4 : 1 }}>Əlavə et</button>
                    <button onClick={() => setShowCertForm(false)} style={S.btnGhost}>Ləğv et</button>
                  </div>
                </div>
              )}
              {certificates.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {certificates.map(cert => (
                    <div key={cert.id} style={{ border: "1px solid #d4d4d4", background: "#fff" }}>
                      {cert.image_url && (
                        <a href={cert.image_url} target="_blank" rel="noreferrer">
                          <img src={cert.image_url} alt={cert.name} style={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block", borderBottom: "1px solid #d4d4d4" }} />
                        </a>
                      )}
                      <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: "0 0 2px 0", fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{cert.name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#999" }}>{cert.issuer}{cert.issue_date && ` · ${cert.issue_date}`}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {cert.credential_url && <a href={cert.credential_url} target="_blank" rel="noreferrer" style={{ color: "#1a4a8a", lineHeight: 1 }}><ExternalLink size={15} /></a>}
                          {isOwn && <button onClick={() => handleDeleteCert(cert.id)} style={S.btnDanger}><Trash2 size={15} /></button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ ...S.faint, textAlign: "center", padding: "12px 0", margin: 0 }}>{isOwn ? "Hələ sertifikat əlavə olunmayıb" : "Sertifikat yoxdur"}</p>
              )}
            </div>
          </div>
        )}

        {/* ── QUICK MESSAGE MODAL ── */}
        {showQuickMsg && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }} onClick={() => !sendingMsg && setShowQuickMsg(false)}>
            <div style={{ background: "#fff", border: "1px solid #d4d4d4", padding: isMobile ? 16 : 24, width: "100%", maxWidth: 420, boxSizing: "border-box" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Send size={16} color="#1a4a8a" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{user?.full_name}-a mesaj</h3>
                    <p style={{ margin: 0, fontSize: 11, color: "#999" }}>Şablon seçin və göndərin</p>
                  </div>
                </div>
                <button onClick={() => setShowQuickMsg(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#666", padding: 4 }}><X size={18} /></button>
              </div>
              {msgSent ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <Send size={28} color="#27ae60" style={{ marginBottom: 8 }} />
                  <p style={{ fontWeight: 600, color: "#27ae60", margin: "0 0 4px 0" }}>Göndərildi!</p>
                  <p style={{ fontSize: 12, color: "#999", margin: 0 }}>"{msgSent}"</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
                  {templates.map((msg, i) => (
                    <button key={i} onClick={() => sendQuickMessage(i)} disabled={sendingMsg} style={{ width: "100%", textAlign: "left", padding: "10px 12px", border: "1px solid #d4d4d4", background: "#fafafa", fontSize: 13, color: "#333", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", opacity: sendingMsg ? 0.5 : 1 }}>
                      <span>{msg}</span><Send size={12} color="#bbb" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── INBOX MODAL ── */}
        {showInbox && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }} onClick={() => setShowInbox(false)}>
            <div style={{ background: "#fff", border: "1px solid #d4d4d4", padding: isMobile ? 16 : 24, width: "100%", maxWidth: 420, boxSizing: "border-box" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Inbox size={16} color="#1a4a8a" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>Gələn mesajlar</h3>
                    <p style={{ margin: 0, fontSize: 11, color: "#999" }}>{inbox.length} mesaj</p>
                  </div>
                </div>
                <button onClick={() => setShowInbox(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#666", padding: 4 }}><X size={18} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto" }}>
                {inbox.length === 0 ? (
                  <p style={{ ...S.faint, textAlign: "center", padding: "24px 0", margin: 0 }}>Hələ mesaj yoxdur</p>
                ) : inbox.map(m => (
                  <div key={m.id} style={{ display: "flex", gap: 12, padding: "10px 12px", border: "1px solid #e8e8e8", background: "#fafafa" }}>
                    <Link to={`/profile/${m.sender_id}`} onClick={() => setShowInbox(false)} style={{ flexShrink: 0, textDecoration: "none" }}>
                      <div style={{ width: 38, height: 38, background: "#1a4a8a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700 }}>
                        {m.sender_name?.charAt(0)}
                      </div>
                    </Link>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <Link to={`/profile/${m.sender_id}`} onClick={() => setShowInbox(false)} style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.sender_name}</Link>
                        <span style={{ fontSize: 11, color: "#bbb", flexShrink: 0 }}>{formatBakuHM(m.created_at)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "#666" }}>{m.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
