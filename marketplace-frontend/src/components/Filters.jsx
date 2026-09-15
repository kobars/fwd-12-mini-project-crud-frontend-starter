import { useState } from "react";
import config from "../config.js";
const isMarketplace = config.caseKey === "marketplace";

export default function Filters({ categories, onApply }) {
  const [error, setError] = useState("");
  function submit(event) {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(event.currentTarget)),
      query = {};
    if (
      isMarketplace &&
      raw.min_price &&
      raw.max_price &&
      Number(raw.min_price) > Number(raw.max_price)
    ) {
      setError(
        "Harga maksimum harus sama dengan atau lebih besar dari harga minimum.",
      );
      return;
    }
    setError("");
    for (const [key, value] of Object.entries(raw))
      if (value.trim()) query[key] = value.trim();
    if (query.sort) {
      [query.sort_by, query.order] = query.sort.split(":");
      delete query.sort;
    }
    onApply(query);
  }
  return (
    <div className="bonus-panel">
      <form
        className="filter-form"
        onSubmit={submit}
        onReset={() => {
          setError("");
          onApply({});
        }}
        role="search"
      >
        <div className="filter search-field">
          <label htmlFor="search">Cari judul</label>
          <input
            id="search"
            name="search"
            type="search"
            placeholder="Masukkan judul"
          />
        </div>
        <div className="filter">
          <label htmlFor="filter-category">Kategori</label>
          <select id="filter-category" name="category_id">
            <option value="">Semua kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div className="case-filters">
          {isMarketplace ? (
            <>
              <div className="filter">
                <label htmlFor="min-price">Harga min.</label>
                <input
                  id="min-price"
                  name="min_price"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Rp"
                />
              </div>
              <div className="filter">
                <label htmlFor="max-price">Harga maks.</label>
                <input
                  id="max-price"
                  name="max_price"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Rp"
                />
              </div>
            </>
          ) : (
            <div className="filter">
              <label htmlFor="filter-level">Level</label>
              <select id="filter-level" name="level">
                <option value="">Semua level</option>
                <option value="beginner">Pemula</option>
                <option value="intermediate">Menengah</option>
                <option value="advanced">Lanjutan</option>
              </select>
            </div>
          )}
        </div>
        <div className="filter">
          <label htmlFor="sort">Urutkan</label>
          <select id="sort" name="sort">
            <option value="">Urutan awal</option>
            {(isMarketplace
              ? [
                  ["rating:desc", "Rating tertinggi"],
                  ["price:asc", "Harga terendah"],
                  ["download_count:desc", "Unduhan terbanyak"],
                ]
              : [
                  ["rating:desc", "Rating tertinggi"],
                  ["enrolled_count:desc", "Peserta terbanyak"],
                  ["duration:asc", "Durasi terpendek"],
                ]
            ).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button className="button secondary">Terapkan</button>
        <button className="text-link" type="reset">
          Reset
        </button>
      </form>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
