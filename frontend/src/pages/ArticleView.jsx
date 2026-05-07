import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Clock, Edit3, Trash2, Send, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import api from "../api/client";
import UserAvatar from "../components/UserAvatar";
import { formatBakuDate, formatBakuHM } from "../utils/time";
import { useDarkClasses } from "../hooks/useDarkClasses";

function useBgTheme() {
  const [theme, setTheme] = useState(localStorage.getItem("bg_theme") || "default");
  useEffect(() => {
    const handler = () => setTheme(localStorage.getItem("bg_theme") || "default");
    window.addEventListener("bg_theme_change", handler);
    return () => window.removeEventListener("bg_theme_change", handler);
  }, []);
  return theme;
}

export default function ArticleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [me, setMe] = useState(null);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const d = useDarkClasses();
  const bgTheme = useBgTheme();
  const isDark = bgTheme !== "default";

  useEffect(() => {
    api.get(`/articles/${id}`).then(r => setArticle(r.data)).catch(() => navigate("/feed"));
    api.get("/users/me").then(r => setMe(r.data)).catch(() => {});
  }, [id]);

  const handleLike = async () => {
    setArticle(prev => ({ ...prev, is_liked: !prev.is_liked, like_count: prev.is_liked ? prev.like_count - 1 : prev.like_count + 1 }));
    try { await api.post(`/articles/${id}/like`); } catch { api.get(`/articles/${id}`).then(r => setArticle(r.data)); }
  };

  const toggleComments = async () => {
    if (!showComments) {
      const res = await api.get(`/articles/${id}/comments`);
      setComments(res.data);
    }
    setShowComments(!showComments);
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    await api.post(`/articles/${id}/comment`, { content: commentText.trim() });
    setCommentText("");
    const res = await api.get(`/articles/${id}/comments`);
    setComments(res.data);
    setArticle(prev => ({ ...prev, comment_count: prev.comment_count + 1 }));
  };

  const handleDelete = async () => {
    if (!confirm("Bu məqaləni silmək istəyirsən?")) return;
    await api.delete(`/articles/${id}`);
    navigate("/feed");
  };

  if (!article) return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-pulse">
      <div className={`h-72 rounded-2xl ${isDark ? "bg-gray-700" : "bg-gray-200"} mb-8`} />
      <div className={`h-10 w-3/4 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} mb-4`} />
      <div className={`h-6 w-1/2 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} mb-8`} />
      {[1,2,3,4].map(i => <div key={i} className={`h-4 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} mb-3`} />)}
    </div>
  );

  const isOwn = me?.id === article.author_id;
  const txt = isDark ? "text-white" : "text-gray-900";
  const txtMuted = isDark ? "text-gray-400" : "text-gray-500";
  const txtFaint = isDark ? "text-gray-500" : "text-gray-400";
  const border = isDark ? "border-gray-700" : "border-gray-100";

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
      <div className="max-w-3xl mx-auto py-10 px-4">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-xl text-sm font-medium transition
            ${isDark ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200" : "text-gray-500 hover:bg-gray-200 hover:text-gray-800"}`}
        >
          <ArrowLeft size={16} /> Geri
        </button>
        <div className={`rounded-3xl shadow-sm overflow-hidden ${isDark ? "bg-gray-900" : "bg-white"}`}>

          {article.cover_image && (
            <img src={article.cover_image} alt="cover" className="w-full h-72 object-cover" />
          )}

          <div className="px-8 py-10">
            <h1 className={`text-4xl font-bold ${txt} mb-3 leading-tight`} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              {article.title}
            </h1>
            {article.subtitle && (
              <p className={`text-xl ${txtMuted} mb-6`} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                {article.subtitle}
              </p>
            )}

            <div className={`flex items-center justify-between py-5 border-y ${border} mb-8`}>
              <div className="flex items-center gap-3">
                <Link to={`/profile/${article.author_id}`}>
                  <UserAvatar user={{ full_name: article.author_name, profile_picture: article.author_picture }} size="md" />
                </Link>
                <div>
                  <Link to={`/profile/${article.author_id}`} className={`font-semibold ${txt} hover:text-blue-600 transition text-sm`}>{article.author_name}</Link>
                  <div className={`flex items-center gap-2 text-xs ${txtFaint}`}>
                    <span>{formatBakuDate(article.created_at)}</span>
                    <span>·</span>
                    <Clock size={12} />
                    <span>{article.read_time} dəq oxuma</span>
                  </div>
                </div>
              </div>
              {isOwn && (
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/article/${id}/edit`)} className="flex items-center gap-1.5 text-blue-500 text-sm hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"><Edit3 size={15} /> Redaktə</button>
                  <button onClick={handleDelete} className="flex items-center gap-1.5 text-red-500 text-sm hover:bg-red-50 px-3 py-1.5 rounded-lg transition"><Trash2 size={15} /> Sil</button>
                </div>
              )}
            </div>

            <div
              className={`article-content prose prose-lg max-w-none ${isDark ? "prose-invert" : ""} mb-10`}
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                color: isDark ? "#e5e7eb" : "#1f2937",
              }}
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            <div className={`flex items-center gap-4 py-4 border-t ${border}`}>
              <button onClick={handleLike} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${article.is_liked ? "text-red-500 bg-red-50" : `${txtFaint} hover:text-red-500 hover:bg-red-50`}`}>
                <Heart size={18} fill={article.is_liked ? "currentColor" : "none"} /> {article.like_count}
              </button>
              <button onClick={toggleComments} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${showComments ? "text-blue-500 bg-blue-50" : `${txtFaint} hover:text-blue-500 hover:bg-blue-50`}`}>
                <MessageCircle size={18} /> {article.comment_count}
                {showComments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showComments && (
              <div className="mt-6">
                <div className="flex gap-3 mb-6">
                  <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === "Enter" && submitComment()} placeholder="Şərh yaz..."
                    className={`flex-1 px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 ${isDark ? "bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400" : "bg-white border-gray-200 text-gray-700"}`} />
                  <button onClick={submitComment} disabled={!commentText.trim()} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-30 transition"><Send size={14} /></button>
                </div>
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className={`${txtFaint} text-sm text-center py-4`}>Hələ şərh yoxdur</p>
                  ) : comments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <Link to={`/profile/${c.user_id}`} className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">{c.user_name?.charAt(0)}</Link>
                      <div className={`flex-1 ${isDark ? "bg-gray-800" : "bg-gray-50"} rounded-xl px-4 py-3`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Link to={`/profile/${c.user_id}`} className={`text-sm font-semibold ${txt} hover:text-blue-600`}>{c.user_name}</Link>
                          <span className={`text-xs ${txtFaint}`}>{formatBakuHM(c.created_at)}</span>
                        </div>
                        <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
