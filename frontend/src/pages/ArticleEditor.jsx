import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "../components/Toast";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, List, ListOrdered, Quote, ImageIcon, Minus, Undo, Redo, Code } from "lucide-react";
import api from "../api/client";
import { useDarkClasses } from "../hooks/useDarkClasses";

function MenuBar({ editor, d }) {
  if (!editor) return null;
  const btn = (active) =>
    `p-2 rounded-lg transition ${active ? "bg-blue-100 text-blue-600" : `${d.dark ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"}`}`;

  return (
    <div className={`flex flex-wrap gap-1 px-4 py-2 border-b ${d.border} sticky top-16 z-10 ${d.dark ? "bg-gray-800/95" : "bg-white/95"} backdrop-blur-sm`}>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn(editor.isActive("heading", { level: 1 }))} title="Böyük başlıq"><Heading1 size={18} /></button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive("heading", { level: 2 }))} title="Orta başlıq"><Heading2 size={18} /></button>
      <div className={`w-px h-6 self-center ${d.dark ? "bg-gray-700" : "bg-gray-200"} mx-1`} />
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))} title="Qalın"><Bold size={18} /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))} title="Kursiv"><Italic size={18} /></button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive("underline"))} title="Altxətt"><UnderlineIcon size={18} /></button>
      <button onClick={() => editor.chain().focus().toggleCode().run()} className={btn(editor.isActive("code"))} title="Kod"><Code size={18} /></button>
      <div className={`w-px h-6 self-center ${d.dark ? "bg-gray-700" : "bg-gray-200"} mx-1`} />
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))} title="Siyahı"><List size={18} /></button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))} title="Nömrəli siyahı"><ListOrdered size={18} /></button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive("blockquote"))} title="Sitat"><Quote size={18} /></button>
      <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btn(false)} title="Xətt"><Minus size={18} /></button>
      <button onClick={() => { const url = prompt("Şəkil URL:"); if (url) editor.chain().focus().setImage({ src: url }).run(); }} className={btn(false)} title="Şəkil"><ImageIcon size={18} /></button>
      <div className={`w-px h-6 self-center ${d.dark ? "bg-gray-700" : "bg-gray-200"} mx-1`} />
      <button onClick={() => editor.chain().focus().undo().run()} className={btn(false)} title="Geri al"><Undo size={18} /></button>
      <button onClick={() => editor.chain().focus().redo().run()} className={btn(false)} title="İrəli al"><Redo size={18} /></button>
    </div>
  );
}

export default function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const d = useDarkClasses();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image,
      Placeholder.configure({ placeholder: "Məqalənizi buradan yazmağa başlayın..." }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-[400px] px-4 py-6",
      },
    },
  });

  useEffect(() => {
    if (id && editor) {
      api.get(`/articles/${id}`).then((res) => {
        setTitle(res.data.title);
        setSubtitle(res.data.subtitle || "");
        setCoverImage(res.data.cover_image || "");
        editor.commands.setContent(res.data.content);
      }).catch(() => navigate("/feed"));
    }
  }, [id, editor]);

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setCoverImage(res.data.url);
    } catch (err) { toast.error("Şəkil yüklənmədi"); }
    setUploading(false);
  };

  const handlePublish = async () => {
    if (!title.trim() || !editor?.getHTML()) return;
    setSaving(true);
    try {
      const data = { title: title.trim(), subtitle: subtitle.trim() || null, content: editor.getHTML(), cover_image: coverImage || null };
      if (id) {
        await api.put(`/articles/${id}`, data);
        navigate(`/article/${id}`);
      } else {
        const res = await api.post("/articles", data);
        navigate(`/article/${res.data.id}`);
      }
    } catch (err) { toast.error(err.response?.data?.detail || "Xəta baş verdi"); }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className={`text-sm ${d.textMuted} hover:${d.text} transition`}>Geri</button>
        <button onClick={handlePublish} disabled={!title.trim() || saving} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:shadow-lg transition disabled:opacity-40">
          {saving ? "Yüklənir..." : id ? "Yenilə" : "Dərc et"}
        </button>
      </div>

      {/* Cover image */}
      {coverImage ? (
        <div className="relative mb-6 rounded-2xl overflow-hidden">
          <img src={coverImage} alt="cover" className="w-full h-72 object-cover" />
          <button onClick={() => setCoverImage("")} className="absolute top-3 right-3 bg-black/50 text-white px-3 py-1.5 rounded-full text-xs hover:bg-black/70 transition">Sil</button>
        </div>
      ) : (
        <label className={`flex items-center gap-2 mb-6 cursor-pointer ${d.textFaint} hover:text-blue-500 transition text-sm`}>
          <ImageIcon size={18} /> Üz qabığı şəkli əlavə et
          <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
          {uploading && <span className="text-xs ml-2">Yüklənir...</span>}
        </label>
      )}

      {/* Title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Başlıq"
        className={`w-full text-4xl font-bold ${d.heading} bg-transparent border-0 focus:outline-none placeholder-gray-300 mb-2`}
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      />
      <input
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        placeholder="Alt başlıq (istəyə bağlı)"
        className={`w-full text-xl ${d.textMuted} bg-transparent border-0 focus:outline-none placeholder-gray-300 mb-6`}
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      />

      {/* Editor */}
      <div className={`${d.card} rounded-2xl shadow-sm overflow-hidden`}>
        <MenuBar editor={editor} d={d} />
        <div className={`article-editor ${d.dark ? "dark-editor" : ""}`} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
