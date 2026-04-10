import { useState } from "react";

export function PhotoImg({ src, alt = "", className = "" }) {
  const [open, setOpen] = useState(false);

  if (!src) return null;

  return (
    <>
      <img src={src} alt={alt} className={`photo-tappable ${className}`} onClick={() => setOpen(true)} />
      {open && <PhotoModal src={src} onClose={() => setOpen(false)} />}
    </>
  );
}

function PhotoModal({ src, onClose }) {
  function handleSave() {
    const link = document.createElement("a");
    link.href = src;
    link.download = `vibecheck-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="photo-modal-overlay fade-in" onClick={onClose}>
      <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="" className="photo-modal-img" />
        <div className="photo-modal-actions">
          <button className="btn btn-secondary" onClick={handleSave}>
            💾 Save
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
