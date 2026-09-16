export async function api(path, { method = "GET", body, signal } = {}) {
  // Let synchronous effect cleanup cancel before starting network I/O.
  if (signal) {
    await Promise.resolve();
    signal.throwIfAborted();
  }

  let response;

  const headers = {
    Accept: "application/json",
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
  };

  try {
    response = await fetch("/api" + path, {
      method,
      signal,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;

    throw new Error("Tidak dapat terhubung ke server. Coba lagi.");
  }

  const data = await response.json().catch((error) => {
    if (error.name === "AbortError") throw error;

    return null;
  });

  signal?.throwIfAborted();

  if (!response.ok || !data?.success) {
    const error = new Error(
      data?.message || "Respons server tidak dapat dibaca.",
    );

    error.status = response.status;
    error.fields = data?.errors || {};

    throw error;
  }

  return data.data;
}

// A successful write is never retried when checking an optional count fails.
export async function saveData(path, { method, body, countKey, countLabel }) {
  const saved = await api(path, { method, body });

  if (!Object.hasOwn(body, countKey)) return "";

  const unverified = `Data tersimpan. ${countLabel} belum dapat diverifikasi.`;
  const detailPath =
    method === "PUT"
      ? path
      : saved?.id != null
        ? path + "/" + encodeURIComponent(saved.id)
        : null;

  if (!detailPath) return unverified;

  try {
    const current = await api(detailPath);
    const count = current?.[countKey];

    if (
      count == null ||
      (typeof count !== "number" && typeof count !== "string") ||
      String(count).trim() === "" ||
      !Number.isSafeInteger(Number(count)) ||
      Number(count) < 0
    )
      return unverified;

    if (Number(count) !== body[countKey])
      return `Data tersimpan, tetapi ${countLabel.toLowerCase()} yang diminta tidak tersimpan.`;
  } catch {
    return unverified;
  }

  return "";
}
