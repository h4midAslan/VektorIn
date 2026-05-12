import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, UserPlus, Users, X } from "lucide-react";
import api from "../api/client";
import { useDarkClasses } from "../hooks/useDarkClasses";
import { toast } from "../components/Toast";
import { useLang } from "../hooks/useLang";

const COURSES = [1, 2, 3, 4];

export default function Search() {
  const [query, setQuery]           = useState("");
  const [skill, setSkill]           = useState("");
  const [major, setMajor]           = useState("");
  const [faculty, setFaculty]       = useState("");
  const [course, setCourse]         = useState(null);
  const [openForTeam, setOpenForTeam] = useState(false);
  const [results, setResults]       = useState([]);
  const [searched, setSearched]     = useState(false);
  const [connectedIds, setConnectedIds] = useState(new Set());
  const [pendingIds, setPendingIds] = useState(new Set());
  const d = useDarkClasses();
  const { t } = useLang();
  const debounceRef = useRef(null);

  useEffect(() => {
    api.get("/connections/my").then(r => setConnectedIds(new Set(r.data.map(c => c.user_id)))).catch(() => {});
    api.get("/connections/sent").then(r => setPendingIds(new Set(r.data.map(c => c.receiver_id)))).catch(() => {});
  }, []);

  const doSearch = useCallback(async (params) => {
    try {
      const res = await api.get("/users/search", { params });
      setResults(res.data);
      setSearched(true);
    } catch {}
  }, []);

  const buildParams = () => ({
    q: query,
    skill,
    major,
    faculty,
    ...(course ? { course } : {}),
    ...(openForTeam ? { open_for_team: true } : {}),
  });

  useEffect(() => {
    const hasFilter = query || skill || major || faculty || course || openForTeam;
    if (!hasFilter) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(buildParams()), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, skill, major, faculty, course, openForTeam]);

  const handleSearch = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    doSearch(buildParams());
  };

  const clearFilters = () => {
    setMajor(""); setFaculty(""); setCourse(null); setOpenForTeam(false);
  };

  const activeFilterCount = [major, faculty, course, openForTeam].filter(Boolean).length;

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

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h2 className={`text-2xl font-bold ${d.heading}`}>{t("search_title")}</h2>
        <p className={`${d.textFaint} text-sm mt-1`}>{t("search_subtitle")}</p>
      </div>

      <form onSubmit={handleSearch} className={`${d.card} rounded-2xl shadow-sm p-5 mb-6`}>

        {/* Name + Skill inputs */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <SearchIcon size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${d.textFaint}`} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t("search_name")}
              className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${d.inputAlt}`}
            />
          </div>
          <div className="relative">
            <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold ${d.textFaint}`}>#</span>
            <input
              type="text"
              value={skill}
              onChange={e => setSkill(e.target.value)}
              placeholder={t("search_skill")}
              className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${d.inputAlt}`}
            />
          </div>
        </div>

        {/* Filter section */}
        <div className={`rounded-xl p-3.5 mb-4 space-y-3 ${d.dark ? "bg-white/[0.03] border border-white/[0.07]" : "bg-gray-50 border border-gray-100"}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${d.textFaint}`}>Filtrlər</span>
            {activeFilterCount > 0 && (
              <button type="button" onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 transition">
                <X size={12} /> Təmizlə ({activeFilterCount})
              </button>
            )}
          </div>

          {/* Major + Faculty */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={major}
              onChange={e => setMajor(e.target.value)}
              placeholder="İxtisas"
              className={`px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${d.inputAlt}`}
            />
            <input
              type="text"
              value={faculty}
              onChange={e => setFaculty(e.target.value)}
              placeholder="Fakültə"
              className={`px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${d.inputAlt}`}
            />
          </div>

          {/* Course chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs ${d.textFaint} shrink-0`}>Kurs:</span>
            {COURSES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCourse(course === c ? null : c)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                  course === c
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                    : d.dark
                      ? "bg-white/5 text-gray-400 border-white/10 hover:border-blue-500 hover:text-blue-400"
                      : "bg-white text-gray-500 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                {c}-ci
              </button>
            ))}
          </div>

          {/* Open for team toggle */}
          <button
            type="button"
            onClick={() => setOpenForTeam(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border w-full justify-center ${
              openForTeam
                ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                : d.dark
                  ? "bg-white/5 text-gray-400 border-white/10 hover:border-emerald-500 hover:text-emerald-400"
                  : "bg-white text-gray-500 border-gray-200 hover:border-emerald-400 hover:text-emerald-600"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${openForTeam ? "bg-white" : "bg-emerald-500"}`} />
            Komanda axtaranlar
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
        >
          <SearchIcon size={16} /> {t("search_btn")}
        </button>
      </form>

      {/* Results count */}
      {searched && results.length > 0 && (
        <p className={`text-sm ${d.textFaint} mb-4 font-medium`}>{results.length} {t("search_results")}</p>
      )}

      {/* Results */}
      <div className="space-y-3">
        {results.map((user) => (
          <div key={user.id}
            className={`${d.card} rounded-2xl shadow-sm p-5 flex items-center hover:shadow-md transition-all duration-300 group`}>
            <Link to={`/profile/${user.id}`}
              className="w-13 h-13 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-md shadow-blue-100">
              {user.profile_picture
                ? <img src={user.profile_picture} alt="" className="w-12 h-12 rounded-2xl object-cover" />
                : user.full_name?.charAt(0)}
            </Link>
            <div className="ml-4 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link to={`/profile/${user.id}`}
                  className={`font-semibold ${d.text} text-sm hover:text-blue-600 transition`}>
                  {user.full_name}
                </Link>
                {user.is_open_for_team && (
                  <span className="text-[10px] font-semibold text-emerald-500 border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                    Komanda axtarır
                  </span>
                )}
              </div>
              <p className={`text-xs ${d.textFaint} mt-0.5`}>
                {[user.major, user.faculty, user.course && `${user.course}-ci kurs`].filter(Boolean).join(" · ")}
              </p>
              {user.skills && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {user.skills.split(",").slice(0, 4).map((s, i) => (
                    <span key={i} className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${
                      d.dark ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-600 border-blue-100"
                    }`}>{s.trim()}</span>
                  ))}
                  {user.skills.split(",").length > 4 && (
                    <span className={`px-2 py-0.5 rounded-lg text-xs ${d.textFaint}`}>
                      +{user.skills.split(",").length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="shrink-0 ml-3">
              {connectedIds.has(user.id) ? (
                <span className={`text-xs px-2.5 py-1.5 rounded-xl font-medium border ${
                  d.dark ? "text-gray-500 border-gray-700" : "text-gray-400 border-gray-200"
                }`}>Bağlı</span>
              ) : pendingIds.has(user.id) ? (
                <span className={`text-xs px-2.5 py-1.5 rounded-xl font-medium ${
                  d.dark ? "text-amber-400 bg-amber-500/10 border border-amber-500/20" : "text-amber-600 bg-amber-50 border border-amber-200"
                }`}>Gözləyir</span>
              ) : (
                <button onClick={() => sendConnection(user.id)}
                  className={`p-2.5 rounded-xl transition-all border ${
                    d.dark ? "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20" : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                  }`}
                  title={t("search_connect")}>
                  <UserPlus size={17} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {searched && results.length === 0 && (
        <div className="text-center py-16">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${d.dark ? "bg-gray-800" : "bg-gray-100"}`}>
            <Users size={28} className="text-gray-400" />
          </div>
          <p className={`${d.text} font-semibold`}>{t("search_empty")}</p>
          <p className={`${d.textFaint} text-sm mt-1`}>{t("search_empty_sub")}</p>
        </div>
      )}
    </div>
  );
}
