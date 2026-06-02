import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ExternalLink, Globe, Award, FolderGit2, Share2, Check, Printer, Mail, Phone, MapPin, Briefcase, GraduationCap, Code2, Languages } from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const GithubIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

function formatDate(d) {
  if (!d) return "";
  const [y, m] = d.split("-");
  const months = ["", "Yan", "Fev", "Mar", "Apr", "May", "İyn", "İyl", "Avq", "Sen", "Okt", "Noy", "Dek"];
  return `${months[parseInt(m)] || m} ${y}`;
}

function Section({ title, icon, children }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 8, borderBottom: "2px solid #e5e7eb" }}>
        <span style={{ color: "#1a4a8a" }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#374151" }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SkillTag({ label }) {
  return (
    <span style={{
      display: "inline-block", padding: "4px 12px", borderRadius: 4,
      fontSize: 12, fontWeight: 500, background: "#eff6ff",
      color: "#1e40af", border: "1px solid #bfdbfe",
    }}>
      {label}
    </span>
  );
}

export default function PublicCV() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    axios.get(`${API}/public/u/${username}`)
      .then(r => setProfile(r.data))
      .catch(() => setNotFound(true));
  }, [username]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("Profil linki:", window.location.href);
    }
  };

  if (notFound) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", background: "#f9fafb" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>404</div>
      <p style={{ fontSize: 18, color: "#6b7280", margin: "0 0 20px" }}>Bu profil tapılmadı</p>
      <Link to="/" style={{ color: "#1a4a8a", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Hash Campus-a qayıt →</Link>
    </div>
  );

  if (!profile) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #1a4a8a", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  let skills = [];
  try { skills = profile.skills ? JSON.parse(profile.skills) : []; } catch { skills = profile.skills?.split(",").map(s => s.trim()).filter(Boolean) || []; }

  let langs = [];
  try { langs = profile.languages ? JSON.parse(profile.languages) : []; } catch {}

  const hasContact = profile.email || profile.phone || profile.github_url || profile.linkedin_url || profile.website_url;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @media print {
          .cv-topbar { display: none !important; }
          .cv-footer { display: none !important; }
          body { background: #fff !important; }
          .cv-wrap { padding: 0 !important; background: #fff !important; }
          .cv-paper { box-shadow: none !important; max-width: 100% !important; margin: 0 !important; border-radius: 0 !important; }
        }
        @page { margin: 1.5cm; size: A4; }
      `}</style>

      {/* Top bar */}
      <div className="cv-topbar" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "#fff", borderBottom: "1px solid #e5e7eb",
        padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
        fontFamily: "system-ui, sans-serif",
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 28, height: 28, background: "#1a4a8a", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 14 }}>#</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1a4a8a" }}>Hash Campus</span>
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleShare} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}>
            {copied ? <Check size={14} color="#22c55e" /> : <Share2 size={14} />}
            {copied ? "Kopyalandı!" : "Paylaş"}
          </button>
          <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, border: "none", background: "#1a4a8a", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#fff" }}>
            <Printer size={14} /> PDF / Çap
          </button>
        </div>
      </div>

      {/* CV wrapper */}
      <div className="cv-wrap" style={{ minHeight: "100vh", background: "#f3f4f6", padding: "72px 16px 48px", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
        <div className="cv-paper" style={{ maxWidth: 820, margin: "0 auto", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 4px 32px rgba(0,0,0,0.10)" }}>

          {/* ── HEADER ── */}
          <div style={{ background: "linear-gradient(135deg, #0f2d5e 0%, #1a4a8a 60%, #1d5fa8 100%)", padding: "36px 44px", display: "flex", alignItems: "flex-start", gap: 28, position: "relative" }}>
            {/* Avatar */}
            {profile.profile_picture ? (
              <img src={profile.profile_picture} alt={profile.full_name} style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "3px solid rgba(255,255,255,0.4)", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }} />
            ) : (
              <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(255,255,255,0.15)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, fontWeight: 800, color: "#fff", border: "3px solid rgba(255,255,255,0.3)" }}>
                {profile.full_name?.charAt(0)?.toUpperCase()}
              </div>
            )}

            {/* Name + info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em", lineHeight: 1.15 }}>{profile.full_name}</h1>
                  {profile.headline && <p style={{ margin: "6px 0 0", fontSize: 15.5, color: "rgba(255,255,255,0.88)", fontWeight: 500 }}>{profile.headline}</p>}
                  {(profile.major || profile.faculty) && (
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 5 }}>
                      <GraduationCap size={13} />
                      {profile.faculty}{profile.faculty && profile.major ? " · " : ""}{profile.major}{profile.course ? ` · ${profile.course}-ci kurs` : ""}
                    </p>
                  )}
                  {profile.gpa && (
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.65)" }}>GPA: <strong style={{ color: "rgba(255,255,255,0.9)" }}>{profile.gpa}</strong></p>
                  )}
                </div>
                {profile.is_open_for_team && (
                  <div style={{ background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.5)", padding: "5px 14px", borderRadius: 99, fontSize: 11.5, color: "#86efac", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
                    Komanda üçün açıq
                  </div>
                )}
              </div>

              {/* Contact row */}
              {hasContact && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", marginTop: 14 }}>
                  {profile.email && (
                    <a href={`mailto:${profile.email}`} style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 12.5 }}>
                      <Mail size={12} />{profile.email}
                    </a>
                  )}
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`} style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 12.5 }}>
                      <Phone size={12} />{profile.phone}
                    </a>
                  )}
                  {profile.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 12.5 }}>
                      <GithubIcon />{profile.github_url.replace(/^https?:\/\/(www\.)?github\.com\//, "")}
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 12.5 }}>
                      <LinkedinIcon />LinkedIn
                    </a>
                  )}
                  {profile.website_url && (
                    <a href={profile.website_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 12.5 }}>
                      <Globe size={12} />{profile.website_url.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── BODY: two-column ── */}
          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 0 }}>

            {/* LEFT COLUMN */}
            <div style={{ background: "#f8fafc", borderRight: "1px solid #e5e7eb", padding: "32px 24px" }}>

              {/* Skills */}
              {skills.length > 0 && (
                <Section title="Bacarıqlar" icon={<Code2 size={14} />}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {skills.map((s, i) => <SkillTag key={i} label={s} />)}
                  </div>
                </Section>
              )}

              {/* Education */}
              {(profile.major || profile.faculty) && (
                <Section title="Təhsil" icon={<GraduationCap size={14} />}>
                  <div style={{ fontSize: 13.5, color: "#111827", fontWeight: 700 }}>{profile.faculty || profile.major}</div>
                  {profile.faculty && profile.major && <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 2 }}>{profile.major}</div>}
                  {profile.course && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{profile.course}-ci kurs</div>}
                  {profile.gpa && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>GPA: <strong>{profile.gpa}</strong></div>}
                </Section>
              )}

              {/* Languages */}
              {langs.length > 0 && (
                <Section title="Dil bilikləri" icon={<Languages size={14} />}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {langs.map((l, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{l.lang}</span>
                        <span style={{ fontSize: 11.5, color: "#6b7280", background: "#f3f4f6", padding: "2px 8px", borderRadius: 99, border: "1px solid #e5e7eb" }}>{l.level}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Contact (left column duplicate for print) */}
              <Section title="Əlaqə" icon={<Mail size={14} />}>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {profile.email && (
                    <a href={`mailto:${profile.email}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#374151", textDecoration: "none", wordBreak: "break-all" }}>
                      <Mail size={12} color="#1a4a8a" />{profile.email}
                    </a>
                  )}
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#374151", textDecoration: "none" }}>
                      <Phone size={12} color="#1a4a8a" />{profile.phone}
                    </a>
                  )}
                  {profile.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#374151", textDecoration: "none", wordBreak: "break-all" }}>
                      <span style={{ color: "#1a4a8a" }}><GithubIcon /></span>{profile.github_url.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#374151", textDecoration: "none" }}>
                      <span style={{ color: "#0077b5" }}><LinkedinIcon /></span>LinkedIn
                    </a>
                  )}
                  {profile.website_url && (
                    <a href={profile.website_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#374151", textDecoration: "none", wordBreak: "break-all" }}>
                      <Globe size={12} color="#1a4a8a" />{profile.website_url.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  )}
                </div>
              </Section>
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ padding: "32px 36px" }}>

              {/* About */}
              {profile.bio && (
                <Section title="Haqqımda" icon={<MapPin size={14} />}>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.75, color: "#374151" }}>{profile.bio}</p>
                </Section>
              )}

              {/* Experience */}
              {profile.experiences?.length > 0 && (
                <Section title="İş Təcrübəsi" icon={<Briefcase size={14} />}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {profile.experiences.map(exp => (
                      <div key={exp.id} style={{ position: "relative", paddingLeft: 16, borderLeft: "2px solid #dbeafe" }}>
                        <div style={{ position: "absolute", left: -5, top: 4, width: 8, height: 8, borderRadius: "50%", background: "#1a4a8a" }} />
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{exp.role}</div>
                            <div style={{ fontSize: 13, color: "#1a4a8a", fontWeight: 600 }}>{exp.company}</div>
                          </div>
                          <div style={{ fontSize: 11.5, color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0 }}>
                            {formatDate(exp.start_date)} — {exp.is_current ? "İndiyədək" : formatDate(exp.end_date)}
                          </div>
                        </div>
                        {exp.description && <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "#6b7280", lineHeight: 1.6 }}>{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Projects */}
              {profile.projects?.length > 0 && (
                <Section title="Layihələr" icon={<FolderGit2 size={14} />}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {profile.projects.map(p => (
                      <div key={p.id} style={{ padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fafafa" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                              <FolderGit2 size={13} color="#1a4a8a" />
                              <strong style={{ fontSize: 13.5, color: "#111827" }}>{p.title}</strong>
                            </div>
                            {p.description && <p style={{ margin: "0 0 8px", fontSize: 12.5, color: "#6b7280", lineHeight: 1.55 }}>{p.description}</p>}
                            {p.technologies && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {p.technologies.split(",").map((t, i) => (
                                  <span key={i} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" }}>{t.trim()}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          {p.github_url && (
                            <a href={p.github_url} target="_blank" rel="noreferrer" style={{ color: "#6b7280", flexShrink: 0, marginTop: 2 }} title="GitHub">
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Certificates */}
              {profile.certificates?.length > 0 && (
                <Section title="Sertifikatlar" icon={<Award size={14} />}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {profile.certificates.map(c => (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fafafa" }}>
                        <Award size={15} color="#1a4a8a" style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{c.name}</div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>{c.issuer}{c.issue_date ? ` · ${c.issue_date}` : ""}</div>
                        </div>
                        {c.credential_url && (
                          <a href={c.credential_url} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, color: "#1a4a8a", textDecoration: "none", fontWeight: 600, flexShrink: 0 }}>
                            Bax →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="cv-footer" style={{ borderTop: "1px solid #e5e7eb", padding: "14px 44px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa" }}>
            <span style={{ fontSize: 11.5, color: "#9ca3af" }}>
              Bu profil <strong style={{ color: "#1a4a8a" }}>Hash Campus</strong>-da yaradılıb · hashcampus.site
            </span>
            <Link to="/register" style={{ fontSize: 12, color: "#1a4a8a", textDecoration: "none", fontWeight: 700 }}>
              Sən də qoşul →
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
