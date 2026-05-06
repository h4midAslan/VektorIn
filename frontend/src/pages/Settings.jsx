import { useState } from "react";
import { Settings as SettingsIcon, Check, Moon, Sun, Image as ImageIcon, Globe, Lock, Eye, EyeOff } from "lucide-react";
import { useDarkClasses } from "../hooks/useDarkClasses";
import { useLang, setLang } from "../hooks/useLang";
import api from "../api/client";
import { toast } from "../components/Toast";

const BG_OPTIONS = [
  { id: "default", labelKey: "bg_default", preview: "bg-gray-50" },
  { id: "navy", labelKey: "bg_navy", preview: "bg-[#0f172a]" },
  { id: "vectors", labelKey: "bg_vectors", preview: "bg-[#1a1a2e]", local: true },
];

const LANG_OPTIONS = [
  { id: "az", flag: "🇦🇿", labelKey: "settings_lang_az" },
  { id: "en", flag: "🇬🇧", labelKey: "settings_lang_en" },
];

export default function Settings() {
  const [selected, setSelected] = useState(localStorage.getItem("bg_theme") || "default");
  const [darkMode, setDarkMode] = useState(localStorage.getItem("dark_mode") === "true");
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const { lang, t } = useLang();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) {
      toast.error("Yeni şifrələr uyğun gəlmir");
      return;
    }
    if (pwForm.newPw.length < 6) {
      toast.error("Şifrə ən az 6 simvol olmalıdır");
      return;
    }
    setPwLoading(true);
    try {
      await api.put("/users/me/password", {
        current_password: pwForm.current,
        new_password: pwForm.newPw,
      });
      toast.success("Şifrə uğurla dəyişdirildi");
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
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

  const d = useDarkClasses();

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
          <SettingsIcon size={24} className="text-white" />
        </div>
        <div>
          <h1 className={`text-2xl font-bold ${d.heading}`}>{t("settings_title")}</h1>
          <p className={d.textFaint + " text-sm"}>{t("settings_subtitle")}</p>
        </div>
      </div>

      {/* Dark Mode Toggle */}
      <div className={`${d.card} rounded-2xl shadow-sm p-6 mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon size={20} className="text-indigo-500" /> : <Sun size={20} className="text-amber-500" />}
            <div>
              <h2 className={`text-lg font-semibold ${d.text}`}>{t("settings_dark_mode")}</h2>
              <p className={`text-xs ${d.textFaint}`}>{t("settings_dark_desc")}</p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
              darkMode ? "bg-indigo-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
                darkMode ? "left-7" : "left-1"
              }`}
            >
              {darkMode ? <Moon size={12} className="text-indigo-500" /> : <Sun size={12} className="text-amber-500" />}
            </div>
          </button>
        </div>
      </div>

      {/* Password Change */}
      <div className={`${d.card} rounded-2xl shadow-sm p-6 mb-6`}>
        <div className="flex items-center gap-2 mb-5">
          <Lock size={18} className={d.textMuted} />
          <h2 className={`text-lg font-semibold ${d.text}`}>Şifrəni dəyişdir</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              placeholder="Cari şifrə"
              value={pwForm.current}
              onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
              className={`w-full px-4 py-3 pr-11 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${d.inputAlt}`}
              required
            />
            <button type="button" onClick={() => setShowCurrent(v => !v)} className={`absolute right-3 top-3.5 ${d.textFaint} hover:opacity-80`}>
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              placeholder="Yeni şifrə (min. 6 simvol)"
              value={pwForm.newPw}
              onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
              className={`w-full px-4 py-3 pr-11 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${d.inputAlt}`}
              required
            />
            <button type="button" onClick={() => setShowNew(v => !v)} className={`absolute right-3 top-3.5 ${d.textFaint} hover:opacity-80`}>
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <input
            type="password"
            placeholder="Yeni şifrəni təkrarla"
            value={pwForm.confirm}
            onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
            className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${d.inputAlt}`}
            required
          />
          {pwForm.newPw && pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
            <p className="text-xs text-red-500 mt-1">Şifrələr uyğun gəlmir</p>
          )}
          <button
            type="submit"
            disabled={pwLoading || !pwForm.current || !pwForm.newPw || !pwForm.confirm}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-blue-200 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {pwLoading ? "Dəyişdirilir..." : "Şifrəni dəyişdir"}
          </button>
        </form>
      </div>

      {/* Language Selector */}
      <div className={`${d.card} rounded-2xl shadow-sm p-6 mb-6`}>
        <div className="flex items-center gap-2 mb-5">
          <Globe size={18} className={d.textMuted} />
          <h2 className={`text-lg font-semibold ${d.text}`}>{t("settings_lang")}</h2>
        </div>
        <p className={`text-xs ${d.textFaint} mb-4`}>{t("settings_lang_desc")}</p>
        <div className="flex gap-3">
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setLang(opt.id)}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl border-2 font-semibold text-sm transition-all duration-200 ${
                lang === opt.id
                  ? "border-blue-500 shadow-md shadow-blue-100 " + (d.dark ? "bg-blue-500/10 text-blue-400" : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600")
                  : (d.dark ? "border-gray-700 text-gray-400 hover:border-gray-600" : "border-gray-200 text-gray-500 hover:border-gray-300")
              }`}
            >
              <span className="text-lg">{opt.flag}</span>
              <span>{t(opt.labelKey)}</span>
              {lang === opt.id && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Background */}
      <div className={`${d.card} rounded-2xl shadow-sm p-6`}>
        <div className="flex items-center gap-2 mb-5">
          <ImageIcon size={18} className={d.textMuted} />
          <h2 className={`text-lg font-semibold ${d.text}`}>{t("settings_bg")}</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BG_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
                selected === opt.id
                  ? "border-blue-500 shadow-lg shadow-blue-100 scale-[1.02]"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"
              }`}
            >
              <div className={`h-24 ${opt.preview || ""} relative`}>
                {opt.local && (
                  <div
                    className="absolute inset-0 bg-[#1a1a2e]"
                    style={{
                      backgroundImage: "url('/bg-vectors.png')",
                      backgroundSize: "300px",
                      backgroundRepeat: "repeat",
                    }}
                  />
                )}
                {selected === opt.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </div>
              <div className={`px-3 py-2 ${d.dark ? "bg-gray-800" : "bg-white"}`}>
                <span className={`text-xs font-medium ${d.textSecondary}`}>{t(opt.labelKey)}</span>
              </div>
            </button>
          ))}
        </div>

        <p className={`text-xs ${d.textFaint} mt-4 text-center`}>{t("settings_bg_note")}</p>
      </div>
    </div>
  );
}
