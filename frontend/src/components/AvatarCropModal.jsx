import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, Check, ZoomIn, ZoomOut } from "lucide-react";

function getCroppedImg(imageSrc, pixelCrop) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => {
      const canvas = document.createElement("canvas");
      const size = Math.min(pixelCrop.width, pixelCrop.height);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        size,
        size
      );
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("Canvas boşdur")); return; }
        resolve(blob);
      }, "image/jpeg", 0.92);
    });
    image.addEventListener("error", reject);
    image.src = imageSrc;
  });
}

export default function AvatarCropModal({ imageSrc, onConfirm, onCancel, dark }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } catch {
      setLoading(false);
    }
  };

  const bg = dark ? "#1a1a2e" : "#fff";
  const text = dark ? "#e2e8f0" : "#1e293b";
  const sub = dark ? "#94a3b8" : "#64748b";
  const border = dark ? "1px solid #2d3748" : "1px solid #e2e8f0";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1200,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{
        background: bg, borderRadius: 20, border,
        width: "100%", maxWidth: 420,
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px 14px",
          borderBottom: border,
        }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: text }}>Profil şəklini tənzimlə</span>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: sub, padding: 4, display: "flex" }}>
            <X size={20} />
          </button>
        </div>

        {/* Crop area */}
        <div style={{ position: "relative", width: "100%", height: 320, background: "#000" }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom slider */}
        <div style={{ padding: "16px 20px 4px", display: "flex", alignItems: "center", gap: 12 }}>
          <ZoomOut size={16} color={sub} />
          <input
            type="range" min={1} max={3} step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: "#1e90ff" }}
          />
          <ZoomIn size={16} color={sub} />
        </div>
        <p style={{ textAlign: "center", fontSize: 12, color: sub, margin: "4px 0 16px" }}>
          Sürüşdür • Zoom et
        </p>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, padding: "0 20px 20px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10,
              border: border, background: "transparent",
              color: text, fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            Ləğv et
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10,
              border: "none", background: loading ? "#4a90d9" : "#1e90ff",
              color: "#fff", fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Check size={16} />
            {loading ? "Yüklənir..." : "Təsdiqlə"}
          </button>
        </div>
      </div>
    </div>
  );
}
