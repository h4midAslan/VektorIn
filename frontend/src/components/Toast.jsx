import { useState, useEffect, useCallback, useRef } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

let addToastGlobal = null;

export function toast(message, type = "info") {
  if (addToastGlobal) addToastGlobal({ message, type, id: Date.now() + Math.random() });
}
toast.success = (msg) => toast(msg, "success");
toast.error   = (msg) => toast(msg, "error");
toast.info    = (msg) => toast(msg, "info");

const ICONS = {
  success: <CheckCircle size={20} />,
  error:   <XCircle size={20} />,
  info:    <Info size={20} />,
};

const COLORS = {
  success: {
    bar:  "bg-emerald-500",
    icon: "text-emerald-500",
    ring: "ring-emerald-100",
  },
  error: {
    bar:  "bg-red-500",
    icon: "text-red-500",
    ring: "ring-red-100",
  },
  info: {
    bar:  "bg-blue-500",
    icon: "text-blue-500",
    ring: "ring-blue-100",
  },
};

const DURATION = 3500;

function ToastItem({ toast: t, onRemove }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const startRef = useRef(null);
  const rafRef = useRef(null);
  const c = COLORS[t.type] || COLORS.info;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    startRef.current = performance.now();
    const tick = (now) => {
      const elapsed = now - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        dismiss();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => onRemove(t.id), 350);
  };

  return (
    <div
      className={`relative flex items-start gap-3 bg-white rounded-2xl shadow-xl ring-1 ${c.ring}
        px-4 py-3.5 min-w-[280px] max-w-sm overflow-hidden cursor-pointer
        transition-all duration-350 ease-out
        ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-16"}`}
      onClick={dismiss}
    >
      {/* progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-[3px] ${c.bar} transition-none rounded-b-2xl`}
        style={{ width: `${progress}%` }}
      />

      <span className={`mt-0.5 shrink-0 ${c.icon}`}>{ICONS[t.type]}</span>
      <p className="text-sm text-gray-800 font-medium leading-snug flex-1 pr-2">{t.message}</p>
      <button onClick={dismiss} className="text-gray-300 hover:text-gray-500 transition shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((t) => {
    setToasts(prev => [...prev.slice(-4), t]);
  }, []);

  useEffect(() => {
    addToastGlobal = add;
    return () => { addToastGlobal = null; };
  }, [add]);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={remove} />
        </div>
      ))}
    </div>
  );
}
