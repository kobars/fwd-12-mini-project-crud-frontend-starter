import { useState } from "react";
import Dialog from "./Dialog.jsx";
import config from "../config.js";
const isMarketplace = config.caseKey === "marketplace";
function Field({
  name,
  label,
  errors,
  required = false,
  full = false,
  help,
  children,
  ...props
}) {
  return (
    <div className={"form-field" + (full ? " full" : "")}>
      <label htmlFor={"field-" + name}>
        {label}
        {!required && <small>Opsional</small>}
      </label>
      {children ? (
        <select
          id={"field-" + name}
          name={name}
          className="field"
          required={required}
          aria-invalid={errors[name] ? true : undefined}
          aria-describedby={"error-" + name}
          {...props}
        >
          {children}
        </select>
      ) : props.rows ? (
        <textarea
          id={"field-" + name}
          name={name}
          className="field"
          required={required}
          aria-invalid={errors[name] ? true : undefined}
          aria-describedby={"error-" + name}
          {...props}
        />
      ) : (
        <input
          id={"field-" + name}
          name={name}
          className="field"
          required={required}
          aria-invalid={errors[name] ? true : undefined}
          aria-describedby={"error-" + name}
          {...props}
        />
      )}
      {help && <p className="field-help">{help}</p>}
      <p className="field-error" id={"error-" + name} hidden={!errors[name]}>
        {errors[name]?.join(" ")}
      </p>
    </div>
  );
}

export default function Editor({
  type,
  item = {},
  categories,
  categoryId,
  onSave,
  onClose,
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  const fields = error?.fields || {},
    category = type === "category";
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    if (!category) {
      for (const key of [
        "category_id",
        "rating",
        ...(isMarketplace ? ["price"] : ["duration"]),
      ])
        body[key] = body[key] === "" ? null : Number(body[key]);
      if (!body.status) delete body.status;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave(body);
    } catch (failure) {
      setError(failure);
      const focusedElement = document.activeElement;
      requestAnimationFrame(() => {
        if (document.activeElement === focusedElement) {
          form.querySelector("[aria-invalid=true]")?.focus();
        }
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title={`${item.id ? "Edit" : "Tambah"} ${category ? "kategori" : config.singular}`}
      onClose={onClose}
      busy={busy}
      className="form-dialog"
    >
      <form onSubmit={submit} noValidate>
        {error && (
          <div className="error-summary" role="alert">
            {error.message}
            {fields._request && <p>{fields._request.join(" ")}</p>}
          </div>
        )}
        <fieldset disabled={busy} className="form-grid">
          {category ? (
            <>
              <Field
                name="name"
                label="Nama kategori"
                defaultValue={item.name || ""}
                required
                full
                maxLength={100}
                errors={fields}
              />
              <Field
                name="description"
                label="Deskripsi"
                defaultValue={item.description || ""}
                rows={4}
                full
                errors={fields}
              />
            </>
          ) : (
            <>
              <Field
                name="title"
                label="Judul"
                defaultValue={item.title || ""}
                required
                full
                maxLength={255}
                errors={fields}
              />
              <Field
                name="description"
                label="Deskripsi"
                defaultValue={item.description || ""}
                rows={4}
                required
                full
                errors={fields}
              />
              <Field
                name="category_id"
                label="Kategori"
                defaultValue={item.category?.id || categoryId || ""}
                required
                errors={fields}
              >
                <option value="">Pilih kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Field>
              <Field
                name="rating"
                label="Rating (0 sampai 10)"
                defaultValue={item.rating ?? ""}
                type="number"
                min="0"
                max="10"
                step="any"
                required
                errors={fields}
              />
              {isMarketplace ? (
                <>
                  <Field
                    name="price"
                    label="Harga (Rp)"
                    defaultValue={item.price ?? ""}
                    type="number"
                    min="0"
                    step="any"
                    required
                    errors={fields}
                  />
                  <Field
                    name="file_path"
                    label="Lokasi berkas"
                    defaultValue={item.file_path || ""}
                    required
                    help="Contoh: files/uikit.zip"
                    errors={fields}
                  />
                </>
              ) : (
                <>
                  <Field
                    name="level"
                    label="Level"
                    defaultValue={item.level || ""}
                    required
                    errors={fields}
                  >
                    <option value="">Pilih level</option>
                    <option value="beginner">Pemula</option>
                    <option value="intermediate">Menengah</option>
                    <option value="advanced">Lanjutan</option>
                  </Field>
                  <Field
                    name="duration"
                    label="Durasi"
                    defaultValue={item.duration ?? ""}
                    type="number"
                    min="1"
                    step="1"
                    required
                    errors={fields}
                  />
                </>
              )}
              <Field
                name="thumbnail"
                label="Thumbnail"
                defaultValue={item.thumbnail || ""}
                help="Lokasi gambar atau URL gambar."
                errors={fields}
              />
              <Field
                name="status"
                label="Status"
                defaultValue={item.status || ""}
                errors={fields}
              >
                <option value="">Tidak diisi</option>
                {(isMarketplace
                  ? [
                      ["active", "Aktif"],
                      ["inactive", "Tidak aktif"],
                    ]
                  : [
                      ["draft", "Draf"],
                      ["published", "Terbit"],
                    ]
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Field>
            </>
          )}
        </fieldset>
        <div className="form-actions">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={busy}
          >
            Batal
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
