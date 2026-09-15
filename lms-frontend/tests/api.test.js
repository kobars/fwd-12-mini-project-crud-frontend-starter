import test from "node:test";
import assert from "node:assert/strict";
import { api } from "../src/api.js";

test("canceling while reading the response preserves AbortError", async (t) => {
  const controller = new AbortController();

  t.mock.method(globalThis, "fetch", async () => ({
    ok: true,
    status: 200,
    async json() {
      controller.abort();

      throw controller.signal.reason;
    },
  }));

  await assert.rejects(api("/categories", { signal: controller.signal }), {
    name: "AbortError",
  });
});

test("an invalid JSON response still reports a readable server error", async (t) => {
  t.mock.method(globalThis, "fetch", async () => ({
    ok: true,
    status: 200,
    async json() {
      throw new SyntaxError("Invalid JSON");
    },
  }));

  await assert.rejects(api("/categories"), {
    message: "Respons server tidak dapat dibaca.",
    status: 200,
  });
});

test("backend validation errors retain their status and field messages", async (t) => {
  const fields = { title: ["Judul wajib diisi."] };

  t.mock.method(globalThis, "fetch", async () => ({
    ok: false,
    status: 400,
    async json() {
      return { success: false, message: "Data tidak valid.", errors: fields };
    },
  }));

  await assert.rejects(api("/courses"), {
    message: "Data tidak valid.",
    status: 400,
    fields,
  });
});

test("effect cleanup cancels before any network request starts", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => ({
    ok: true,
    status: 200,
    async json() {
      return { success: true, data: [] };
    },
  }));

  const controller = new AbortController();
  const pending = api("/categories", { signal: controller.signal });

  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("a replacement effect sends one request and receives the API data", async (t) => {
  const categories = [{ id: 1, name: "Design" }];

  const fetchMock = t.mock.method(globalThis, "fetch", async () => ({
    ok: true,
    status: 200,
    async json() {
      return { success: true, data: categories };
    },
  }));

  const canceled = new AbortController();
  const discarded = api("/categories", { signal: canceled.signal });

  canceled.abort();

  const replacement = api("/categories", {
    signal: new AbortController().signal,
  });

  await assert.rejects(discarded, { name: "AbortError" });
  assert.deepEqual(await replacement, categories);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("documented endpoints work without any custom account or case headers", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => ({
    ok: true,
    status: 200,
    async json() {
      return { success: true, data: [] };
    },
  }));

  assert.deepEqual(await api("/categories"), []);

  const [url, options] = fetchMock.mock.calls[0].arguments;

  assert.equal(url, "/api/categories");
  assert.deepEqual(options.headers, { Accept: "application/json" });
});
