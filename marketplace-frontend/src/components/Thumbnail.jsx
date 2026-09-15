import { useEffect, useState } from "react";

export default function Thumbnail({ item }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [item.thumbnail]);

  let src = "";

  try {
    const candidate = new URL(
      item.thumbnail,
      new URL(import.meta.env.BASE_URL, window.location.origin),
    );

    if (item.thumbnail && ["http:", "https:"].includes(candidate.protocol))
      src = candidate.href;
  } catch {
    /* Unsupported image paths use the fallback. */
  }

  return src && !failed ? (
    <img
      src={src}
      alt={"Ilustrasi " + item.title}
      width="1536"
      height="1024"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="thumbnail-empty">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="4" y="5" width="24" height="22" rx="2" />
        <circle cx="11" cy="12" r="2" />
        <path d="m5 23 7-7 5 5 4-4 7 7" />
      </svg>
      <span>Gambar belum tersedia</span>
    </div>
  );
}
