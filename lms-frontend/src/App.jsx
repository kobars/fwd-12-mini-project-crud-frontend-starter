import { useEffect, useRef, useState } from "react";
import config from "./config.js";
import { api, saveData } from "./api.js";
import Dialog from "./components/Dialog.jsx";
import Editor from "./components/Editor.jsx";
import Filters from "./components/Filters.jsx";
import Thumbnail from "./components/Thumbnail.jsx";

const isMarketplace = config.caseKey === "marketplace";
const resourcePath = isMarketplace ? "/products" : "/courses";

const formatNumber = (value) =>
  value == null ? "—" : new Intl.NumberFormat("id-ID").format(value);

const formatPrice = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 2,
  }).format(value);

const statusLabel = (value) =>
  ({
    active: "Aktif",
    inactive: "Tidak aktif",
    draft: "Draf",
    published: "Terbit",
  })[value] || value;

const levelLabel = (value) =>
  ({ beginner: "Pemula", intermediate: "Menengah", advanced: "Lanjutan" })[
    value
  ] || value;

function getRoute(hash = window.location.hash) {
  const [page, id] = hash.slice(1).split("/");

  if (page === "categories") return { type: "categories" };

  if (page === "category") return { type: "category", id };

  return { type: "catalog" };
}

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [bonus, setBonus] = useState(false);
  const [query, setQuery] = useState({});
  const [revision, setRevision] = useState(0);

  const [loadedPage, setLoadedPage] = useState({
    requestKey: null,
    loading: true,
    error: null,
    items: [],
    categories: [],
    category: null,
  });

  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [saveNotice, setSaveNotice] = useState("");
  const modalRequest = useRef(0);

  function closeModal() {
    modalRequest.current++;
    setModal(null);
  }

  useEffect(() => {
    document.body.dataset.case = config.caseKey;

    const changed = (event) => {
      const previousRoute = getRoute(new URL(event.oldURL).hash);
      const nextRoute = getRoute();

      closeModal();

      if (
        previousRoute.type !== nextRoute.type ||
        previousRoute.id !== nextRoute.id
      ) {
        setQuery({});
      }

      setRoute(nextRoute);
    };

    window.addEventListener("hashchange", changed);

    return () => window.removeEventListener("hashchange", changed);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [route.type, route.id]);

  const queryString = new URLSearchParams(bonus ? query : {}).toString();

  const requestKey = JSON.stringify([
    route.type,
    route.id,
    queryString,
    revision,
  ]);

  // A new route renders before its effect runs; only show data for the current request.
  const state =
    loadedPage.requestKey === requestKey
      ? loadedPage
      : {
          ...loadedPage,
          loading: true,
          error: null,
          items: [],
          category: null,
        };

  useEffect(() => {
    const controller = new AbortController();

    setLoadedPage((previous) => ({
      ...previous,
      requestKey,
      loading: true,
      error: null,
      items: [],
      category: null,
    }));

    async function load() {
      try {
        const categories = await api("/categories", {
          signal: controller.signal,
        });

        let items = [];
        let category = null;

        if (route.type === "catalog")
          items = await api(
            resourcePath + (queryString ? "?" + queryString : ""),
            { signal: controller.signal },
          );

        if (route.type === "category") {
          category = await api("/categories/" + encodeURIComponent(route.id), {
            signal: controller.signal,
          });

          items = category[isMarketplace ? "products" : "courses"];
        }

        if (!controller.signal.aborted)
          setLoadedPage({
            requestKey,
            loading: false,
            error: null,
            items,
            categories,
            category,
          });
      } catch (error) {
        if (!controller.signal.aborted)
          setLoadedPage((previous) => ({
            ...previous,
            requestKey,
            loading: false,
            error,
          }));
      }
    }

    load();

    return () => controller.abort();
  }, [route.type, route.id, queryString, revision]);

  useEffect(() => {
    if (!toast) return;

    const timeout = setTimeout(() => setToast(""), 3600);

    return () => clearTimeout(timeout);
  }, [toast]);

  async function openItem(id, mode = "detail", type = "item") {
    const ticket = ++modalRequest.current;

    setModal({ mode: "loading" });

    try {
      const item = await api(
        (type === "category" ? "/categories" : resourcePath) + "/" + id,
      );

      if (ticket === modalRequest.current) setModal({ mode, item, type });
    } catch (error) {
      if (ticket === modalRequest.current) setModal({ mode: "error", error });
    }
  }

  function create(type) {
    setModal({ mode: "edit", type, item: {} });
  }

  async function save(body) {
    const path = modal.type === "category" ? "/categories" : resourcePath;

    const notice = await saveData(
      path + (modal.item.id ? "/" + modal.item.id : ""),
      {
        method: modal.item.id ? "PUT" : "POST",
        body,
        countKey: isMarketplace ? "download_count" : "enrolled_count",
        countLabel: isMarketplace ? "Jumlah unduhan" : "Jumlah peserta",
      },
    );

    closeModal();
    setRevision((value) => value + 1);
    setSaveNotice(notice);
    setToast(notice ? "" : "Data berhasil disimpan.");
  }

  async function remove() {
    const target = modal;

    setModal({ ...target, busy: true, error: null });

    try {
      await api(
        (target.type === "category" ? "/categories" : resourcePath) +
          "/" +
          target.item.id,
        { method: "DELETE" },
      );

      closeModal();
      setRevision((value) => value + 1);
      setSaveNotice("");
      setToast("Data berhasil dihapus.");

      if (
        target.type === "category" &&
        route.type === "category" &&
        String(target.item.id) === route.id
      )
        window.location.hash = "categories";
    } catch (error) {
      setModal({ ...target, busy: false, error });
    }
  }

  function actions(item) {
    return (
      <div className="card-actions">
        <button
          onClick={() => openItem(item.id, "edit")}
          aria-label={"Edit " + item.title}
        >
          Edit {config.singular}
        </button>
        <button
          className="delete"
          onClick={() => openItem(item.id, "delete")}
          aria-label={"Hapus " + item.title}
        >
          Hapus
        </button>
      </div>
    );
  }

  function categoryActions(category) {
    return (
      <div className="card-actions">
        <button
          onClick={() => openItem(category.id, "edit", "category")}
          aria-label={"Edit kategori " + category.name}
        >
          Edit
        </button>
        <button
          className="delete"
          onClick={() => openItem(category.id, "delete", "category")}
          aria-label={"Hapus kategori " + category.name}
        >
          Hapus
        </button>
      </div>
    );
  }

  function renderPageContent() {
    if (state.loading)
      return (
        <div className="empty" aria-busy="true">
          <p>Memuat data...</p>
        </div>
      );

    if (state.error)
      return (
        <div className="empty">
          <h2>
            {state.error.status === 404
              ? "Data tidak ditemukan"
              : "Data belum dapat dimuat"}
          </h2>
          <p role="alert">{state.error.message}</p>
          <button
            className="button secondary"
            onClick={() => setRevision((value) => value + 1)}
          >
            Coba lagi
          </button>
        </div>
      );

    if (route.type === "categories")
      return (
        <div className="category-list">
          {state.categories.length ? (
            state.categories.map((category, index) => (
              <article className="category-card" key={category.id}>
                <a className="category-link" href={"#category/" + category.id}>
                  <span className="category-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2>{category.name}</h2>
                  <p>{category.description || "Belum ada deskripsi."}</p>
                </a>
                <div className="category-footer">
                  <a className="text-link" href={"#category/" + category.id}>
                    Lihat {config.singular}
                  </a>
                  {categoryActions(category)}
                </div>
              </article>
            ))
          ) : (
            <div className="empty">
              <h2>Belum ada kategori</h2>
              <p>Tambahkan kategori pertama.</p>
            </div>
          )}
        </div>
      );

    return (
      <>
        {route.type === "category" && (
          <>
            <a href="#categories" className="back-link">
              ← Semua kategori
            </a>
            <div className="category-context">
              <p>Kelola kategori {state.category.name}</p>
              {categoryActions(state.category)}
            </div>
          </>
        )}
        <div className="grid">
          {state.items.length ? (
            state.items.map((item) => (
              <article className="item-card" key={item.id}>
                <button
                  className="item-link"
                  onClick={() => openItem(item.id)}
                  aria-label={"Lihat detail " + item.title}
                >
                  <div className="item-visual">
                    <Thumbnail item={item} />
                    {item.status && (
                      <span className="status-badge">
                        {statusLabel(item.status)}
                      </span>
                    )}
                  </div>
                  <div className="item-meta">
                    <span>{item.category.name}</span>
                    <span className="rating">
                      {formatNumber(item.rating)}{" "}
                      <span className="muted">/ 10</span>
                    </span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="item-description">{item.description}</p>
                  {item[config.ownerKey]?.name && (
                    <p className="owner-line">
                      {config.ownerLabel} · {item[config.ownerKey].name}
                    </p>
                  )}
                  <div className="item-bottom">
                    <strong>
                      {isMarketplace
                        ? formatPrice(item.price)
                        : levelLabel(item.level)}
                    </strong>
                    <span className="count-label">
                      {formatNumber(
                        isMarketplace
                          ? item.download_count
                          : item.enrolled_count,
                      )}{" "}
                      {isMarketplace ? "unduhan" : "peserta"}
                    </span>
                  </div>
                  {!isMarketplace && (
                    <p className="count-label">
                      Durasi: {formatNumber(item.duration)}
                    </p>
                  )}
                  {bonus && item.rating_class && (
                    <span className="rating-class">{item.rating_class}</span>
                  )}
                </button>
                {actions(item)}
              </article>
            ))
          ) : (
            <div className="empty">
              <h2>Belum ada {config.singular}</h2>
              <p>
                {bonus
                  ? "Tidak ada data yang sesuai dengan pencarian ini."
                  : "Data akan tampil setelah ditambahkan."}
              </p>
            </div>
          )}
        </div>
      </>
    );
  }

  let title = config.title;
  let description = config.description;

  if (route.type === "categories") {
    title = "Kategori";
    description = "";
  } else if (route.type === "category") {
    title = state.category?.name || "Kategori";
    description = state.category?.description || "";
  }

  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main").focus();
        }}
      >
        Langsung ke konten
      </a>
      <header className="header">
        <div className="shell header-inner">
          <a href="#catalog" className="wordmark" aria-label="FWD 12 LMS">
            <span className="brand-prefix">FWD 12</span>
            <span className="brand-name">LMS</span>
          </a>
          <nav className="main-nav" aria-label="Navigasi utama">
            <a
              href="#catalog"
              aria-current={route.type === "catalog" ? "page" : undefined}
            >
              Katalog
            </a>
            <a
              href="#categories"
              aria-current={route.type !== "catalog" ? "page" : undefined}
            >
              Kategori
            </a>
          </nav>
        </div>
      </header>
      <main className="shell app-main" id="main" tabIndex={-1}>
        <div className="page-heading">
          <div>
            <h1>{title}</h1>
            {description && <p className="intro-text">{description}</p>}
          </div>
          <button
            className="button primary"
            disabled={state.loading || !!state.error}
            onClick={() =>
              create(route.type === "categories" ? "category" : "item")
            }
          >
            + Tambah{" "}
            {route.type === "categories" ? "kategori" : config.singular}
          </button>
        </div>
        {saveNotice && (
          <div className="save-notice" role="status">
            <p>{saveNotice}</p>
            <button
              type="button"
              className="text-link"
              onClick={() => setSaveNotice("")}
              aria-label="Tutup pemberitahuan"
            >
              Tutup
            </button>
          </div>
        )}
        {route.type === "catalog" && (
          <div className="bonus-switch">
            <label>
              <input
                type="checkbox"
                checked={bonus}
                onChange={(event) => {
                  setBonus(event.target.checked);
                  setQuery({});
                }}
              />{" "}
              Fitur bonus
            </label>
          </div>
        )}
        {bonus && route.type === "catalog" && (
          <Filters categories={state.categories} onApply={setQuery} />
        )}
        <div className="collection-bar">
          <p role="status">
            {state.loading
              ? "Memuat data..."
              : state.error
                ? "Data belum tersedia"
                : route.type === "categories"
                  ? state.categories.length + " kategori"
                  : state.items.length + " " + config.singular}
          </p>
        </div>
        {renderPageContent()}
      </main>
      <footer className="footer">
        <div className="shell footer-inner">
          <a href="#catalog" className="footer-brand">
            {config.name}
          </a>
          <a href="#catalog" className="text-link">
            Kembali ke katalog
          </a>
        </div>
      </footer>
      {modal?.mode === "loading" && (
        <Dialog title="Memuat detail" onClose={closeModal}>
          <p role="status">Mengambil data terbaru...</p>
        </Dialog>
      )}
      {modal?.mode === "error" && (
        <Dialog title="Data belum dapat dibuka" onClose={closeModal}>
          <p role="alert">{modal.error.message}</p>
        </Dialog>
      )}
      {modal?.mode === "edit" && (
        <Editor
          key={modal.type + (modal.item.id || "new")}
          type={modal.type}
          bonus={bonus}
          item={modal.item}
          categories={state.categories}
          categoryId={route.type === "category" ? route.id : undefined}
          onSave={save}
          onClose={closeModal}
        />
      )}
      {modal?.mode === "delete" && (
        <Dialog
          title={
            "Hapus " +
            (modal.type === "category" ? "kategori" : config.singular) +
            "?"
          }
          onClose={closeModal}
          busy={modal.busy}
          className="delete-dialog"
        >
          <p>
            <strong>{modal.item.title || modal.item.name}</strong> akan dihapus.{" "}
            {modal.type === "category"
              ? "Kategori yang masih digunakan tidak dapat dihapus."
              : "Tindakan ini tidak dapat dibatalkan."}
          </p>
          {modal.error && (
            <div role="alert" className="error-summary">
              {modal.error.message}
            </div>
          )}
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={closeModal}
              disabled={modal.busy}
            >
              Batal
            </button>
            <button
              className="button danger"
              onClick={remove}
              disabled={modal.busy}
            >
              {modal.busy ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </Dialog>
      )}
      {modal?.mode === "detail" && (
        <Dialog
          title={modal.item.title}
          onClose={closeModal}
          className="detail-dialog"
        >
          <Detail
            item={modal.item}
            bonus={bonus}
            actions={actions}
            onClose={closeModal}
          />
        </Dialog>
      )}
      <div
        className={"toast" + (toast ? " show" : "")}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </>
  );
}

function Detail({ item, bonus, actions, onClose }) {
  const facts = [
    ["Rating", formatNumber(item.rating) + " / 10"],
    ...(item.status ? [["Status", statusLabel(item.status)]] : []),
    ...(isMarketplace
      ? [
          ["Harga", formatPrice(item.price)],
          ["Jumlah unduhan", formatNumber(item.download_count)],
          ["Lokasi berkas", item.file_path],
        ]
      : [
          ["Level", levelLabel(item.level)],
          ["Durasi", formatNumber(item.duration)],
          ["Jumlah peserta", formatNumber(item.enrolled_count)],
        ]),
  ];

  return (
    <div className="detail-layout">
      <div className="detail-image">
        <Thumbnail item={item} />
      </div>
      <div className="detail-copy">
        <p className="eyebrow">{item.category.name}</p>
        {item[config.ownerKey]?.name && (
          <p className="detail-owner">
            {config.ownerLabel} · {item[config.ownerKey].name}
          </p>
        )}
        <p className="detail-description">{item.description}</p>
        <dl className="detail-facts">
          {facts.map(([label, value]) => (
            <div
              key={label}
              className={label === "Lokasi berkas" ? "full" : ""}
            >
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {bonus && item.rating_class && (
          <span className="rating-class">{item.rating_class}</span>
        )}
        <a
          href={"#category/" + item.category.id}
          className="text-link"
          onClick={onClose}
        >
          Lihat kategori {item.category.name}
        </a>
        {actions(item)}
      </div>
    </div>
  );
}
