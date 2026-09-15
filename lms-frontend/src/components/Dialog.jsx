import { useEffect, useRef } from "react";

export default function Dialog({
  title,
  onClose,
  className = "",
  children,
  busy = false,
}) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current.showModal();
    return () => {
      ref.current?.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={className}
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="dialog-header">
        <p className="eyebrow">FWD 12</p>
        <button
          className="close"
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Tutup"
        >
          ×
        </button>
      </div>
      <div className="dialog-body">
        <h2 id="dialog-title">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
