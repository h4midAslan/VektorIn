import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Heart, MessageCircle, Clock, PenSquare, BookOpen, Home, User, FileText, BarChart2, Bookmark } from "lucide-react";
import api from "../api/client";
import UserAvatar from "../components/UserAvatar";
import { useDarkClasses } from "../hooks/useDarkClasses";

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "indicə";
  if (diff < 3600) return `${Math.floor(diff / 60)} dəq əvvəl`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat əvvəl`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} gün əvvəl`;
  return new Date(dateStr).toLocaleDateString("az-AZ", { day: "numeric", month: "short" });
}

function ArticleCard({ article, dark, d }) {
  return (
    <Link
      to={`/article/${article.id}`}
      className={`group flex gap-4 p-5 rounded-2xl border transition-all duration-200 hover:shadow-md
        ${dark ? "bg-gray-800/60 border-gray-700/50 hover:bg-gray-800" : "bg-white border-gray-100 hover:border-gray-200"}`}
    >
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
        <div className="flex items-center gap-2">
          <UserAvatar name={article.author_name} picture={article.author_picture} size={22} />
          <span className={`text-xs font-medium ${dark ? "text-gray-300" : "text-gray-700"}`}>{article.author_name}</span>
        </div>

        <div>
          <h2 className={`text-base font-bold leading-snug line-clamp-2 mb-1 ${dark ? "text-white" : "text-gray-900"}`}>
            {article.title}
          </h2>
          {(article.subtitle || article.preview) && (
            <p className={`text-sm line-clamp-2 ${dark ? "text-gray-400" : "text-gray-500"}`}>
              {article.subtitle || article.preview}
            </p>
          )}
        </div>

        <div className={`flex items-center gap-3 text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>
          <span>{timeAgo(article.created_at)}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Clock size={11} /> {article.read_time} dəq</span>
          <span className="flex items-center gap-1"><Heart size={11} /> {article.like_count}</span>
          <span className="flex items-center gap-1"><MessageCircle size={11} /> {article.comment_count}</span>
        </div>
      </div>

      {article.cover_image && (
        <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden">
          <img
            src={article.cover_image}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
    </Link>
  );
}

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [myArticles, setMyArticles] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all"); // "all" | "mine"
  const navigate = useNavigate();
  const d = useDarkClasses();
  const dark = d.dark;

  useEffect(() => {
    Promise.all([
      api.get("/articles"),
      api.get("/users/me"),
    ]).then(([art, user]) => {
      setArticles(art.data);
      setMe(user.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (me && tab === "mine") {
      api.get(`/articles/user/${me.id}`).then(r => setMyArticles(r.data)).catch(() => {});
    }
  }, [tab, me]);

  const displayed = tab === "mine" ? myArticles : articles;

  const navItems = [
    { id: "all",  icon: Home,      label: "Ana səhifə" },
    { id: "mine", icon: FileText,  label: "Mənim yazılarım" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex gap-8">

        {/* Left sidebar — Medium style */}
        <aside className="hidden md:flex flex-col gap-1 w-52 shrink-0 sticky top-24 self-start">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full
                ${tab === id
                  ? dark ? "bg-blue-500/15 text-blue-400" : "bg-gray-100 text-gray-900"
                  : dark ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
            >
              <Icon size={18} strokeWidth={tab === id ? 2.5 : 2} />
              {label}
            </button>
          ))}

          <div className={`my-3 border-t ${dark ? "border-gray-700" : "border-gray-100"}`} />

          <button
            onClick={() => navigate("/article/new")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full
              ${dark ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
          >
            <PenSquare size={18} strokeWidth={2} />
            Yeni məqalə yaz
          </button>

          {me && (
            <div className={`mt-4 p-4 rounded-2xl border ${dark ? "bg-gray-800/60 border-gray-700/50" : "bg-gray-50 border-gray-100"}`}>
              <div className="flex items-center gap-3 mb-2">
                <UserAvatar name={me.full_name} picture={me.profile_picture} size={36} />
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${dark ? "text-white" : "text-gray-900"}`}>{me.full_name}</p>
                  <p className={`text-[11px] truncate ${dark ? "text-gray-500" : "text-gray-400"}`}>{me.major}</p>
                </div>
              </div>
              <p className={`text-[11px] ${dark ? "text-gray-500" : "text-gray-400"}`}>
                {articles.filter(a => a.author_id === me.id).length} yazı
              </p>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Mobile top bar */}
          <div className="flex md:hidden items-center justify-between mb-5">
            <div className="flex gap-1">
              {navItems.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition
                    ${tab === id
                      ? "bg-gray-900 text-white"
                      : dark ? "text-gray-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-100"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate("/article/new")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold"
            >
              <PenSquare size={13} /> Yaz
            </button>
          </div>

          {/* Desktop tab header */}
          <div className="hidden md:flex items-center justify-between mb-6">
            <h1 className={`text-xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>
              {tab === "mine" ? "Mənim yazılarım" : "Bütün məqalələr"}
            </h1>
            <button
              onClick={() => navigate("/article/new")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition"
            >
              <PenSquare size={15} /> Yeni məqalə
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-28 rounded-2xl animate-pulse ${dark ? "bg-gray-800" : "bg-gray-100"}`} />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border ${dark ? "border-gray-700/50 text-gray-500" : "border-gray-100 text-gray-400"}`}>
              <BookOpen size={40} className="mb-3 opacity-30" />
              <p className="font-medium text-sm">
                {tab === "mine" ? "Hələ məqalən yoxdur" : "Hələ məqalə yoxdur"}
              </p>
              <p className="text-xs mt-1 opacity-70">İlk məqaləni sən yaz!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayed.map(a => (
                <ArticleCard key={a.id} article={a} dark={dark} d={d} />
              ))}
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
