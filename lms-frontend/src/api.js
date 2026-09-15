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
