import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Clock, PenSquare, BookOpen } from "lucide-react";
import api from "../api/client";
import UserAvatar from "../components/UserAvatar";
import { useDarkClasses } from "../hooks/useDarkClasses";

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "indicə";
  if (diff < 3600) return `${Math.floor(diff / 60)} dəq`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} gün`;
  return new Date(dateStr).toLocaleDateString("az-AZ", { day: "numeric", month: "short" });
}

function ArticleCard({ article, dark, d }) {
  return (
    <Link
      to={`/article/${article.id}`}
      className={`group flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border transition-all duration-200 hover:shadow-md
        ${dark ? "bg-gray-800/60 border-gray-700/50 hover:bg-gray-800" : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-gray-100"}`}
    >
      {article.cover_image && (
        <div className="sm:w-40 sm:h-28 w-full h-44 shrink-0 rounded-xl overflow-hidden">
          <img
            src={article.cover_image}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
        <div>
          <h2 className={`text-base font-bold leading-snug line-clamp-2 mb-1 ${dark ? "text-white" : "text-gray-900"}`}>
            {article.title}
          </h2>
          {article.subtitle && (
            <p className={`text-sm line-clamp-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>{article.subtitle}</p>
          )}
          {article.preview && !article.subtitle && (
            <p className={`text-sm line-clamp-2 ${dark ? "text-gray-400" : "text-gray-500"}`}>{article.preview}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <UserAvatar name={article.author_name} picture={article.author_picture} size={22} />
            <span className={`text-xs font-medium ${dark ? "text-gray-300" : "text-gray-700"}`}>{article.author_name}</span>
            <span className={`text-xs ${dark ? "text-gray-600" : "text-gray-300"}`}>·</span>
            <span className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>{timeAgo(article.created_at)}</span>
          </div>
          <div className={`flex items-center gap-3 text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>
            <span className="flex items-center gap-1"><Clock size={12} /> {article.read_time} dəq</span>
            <span className="flex items-center gap-1"><Heart size={12} /> {article.like_count}</span>
            <span className="flex items-center gap-1"><MessageCircle size={12} /> {article.comment_count}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const d = useDarkClasses();
  const dark = d.dark;

  useEffect(() => {
    api.get("/articles")
      .then(r => setArticles(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-extrabold ${dark ? "text-white" : "text-gray-900"}`}>Məqalələr</h1>
          <p className={`text-sm mt-0.5 ${dark ? "text-gray-400" : "text-gray-500"}`}>Tələbə yazıları və paylaşımlar</p>
        </div>
        <button
          onClick={() => navigate("/article/new")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-sm hover:opacity-90 transition"
        >
          <PenSquare size={16} />
          Yaz
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-28 rounded-2xl animate-pulse ${dark ? "bg-gray-800" : "bg-gray-100"}`} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border ${dark ? "border-gray-700/50 text-gray-500" : "border-gray-100 text-gray-400"}`}>
          <BookOpen size={40} className="mb-3 opacity-30" />
          <p className="font-medium text-sm">Hələ məqalə yoxdur</p>
          <p className="text-xs mt-1 opacity-70">İlk məqaləni sən yaz!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map(a => (
            <ArticleCard key={a.id} article={a} dark={dark} d={d} />
          ))}
        </div>
      )}
    </div>
  );
}
