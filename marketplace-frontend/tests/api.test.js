import test from "node:test";
import assert from "node:assert/strict";
import { api, saveData } from "../src/api.js";

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

  await assert.rejects(api("/products"), {
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

for (const countKey of ["enrolled_count", "download_count"]) {
  test(`${countKey}: basic saves do not send a count or request verification`, async (t) => {
    const fetchMock = t.mock.method(globalThis, "fetch", async () => ({
      ok: true,
      json: async () => ({ success: true, data: { id: 1 } }),
    }));

    const notice = await saveData("/courses", {
      method: "POST",
      body: { title: "Basic CRUD" },
      countKey,
      countLabel: "Jumlah",
    });

    assert.equal(notice, "");
    assert.equal(fetchMock.mock.callCount(), 1);
    assert.deepEqual(JSON.parse(fetchMock.mock.calls[0].arguments[1].body), {
      title: "Basic CRUD",
    });
  });

  for (const method of ["POST", "PUT"]) {
    for (const [label, returnedCount, expected] of [
      ["saved", 12, ""],
      ["numeric string", "12", ""],
      ["ignored", 0, "tidak tersimpan"],
      ["omitted", undefined, "belum dapat diverifikasi"],
      ["null", null, "belum dapat diverifikasi"],
      ["invalid", false, "belum dapat diverifikasi"],
    ]) {
      test(`${countKey}: ${method} checks persisted state (${label})`, async (t) => {
        const path = method === "POST" ? "/courses" : "/courses/7";
        const calls = [];

        t.mock.method(globalThis, "fetch", async (url, options) => {
          calls.push({ url, options });

          return {
            ok: true,
            json: async () => ({
              success: true,
              data:
                options.method === "GET"
                  ? { id: 7, [countKey]: returnedCount }
                  : { id: 7, [countKey]: 12 },
            }),
          };
        });

        const notice = await saveData(path, {
          method,
          body: { [countKey]: 12 },
          countKey,
          countLabel: "Jumlah",
        });

        if (expected) assert(notice.includes(expected));
        else assert.equal(notice, "");

        assert.deepEqual(
          calls.map(({ url, options }) => [url, options.method]),
          [
            ["/api" + path, method],
            ["/api/courses/7", "GET"],
          ],
        );
      });
    }
  }

  test(`${countKey}: verification failure never repeats a successful POST`, async (t) => {
    let writes = 0;

    t.mock.method(globalThis, "fetch", async (url, options) => {
      if (options.method === "GET") throw new TypeError("Offline");

      writes++;

      return {
        ok: true,
        json: async () => ({ success: true, data: { id: 7 } }),
      };
    });

    const notice = await saveData("/courses", {
      method: "POST",
      body: { [countKey]: 0 },
      countKey,
      countLabel: "Jumlah",
    });

    assert(notice.includes("Data tersimpan"));
    assert(notice.includes("belum dapat diverifikasi"));
    assert.equal(writes, 1);
  });

  test(`${countKey}: strict backend rejection keeps the original error and never retries`, async (t) => {
    const fields = { [countKey]: ["Field belum didukung."] };

    const fetchMock = t.mock.method(globalThis, "fetch", async () => ({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        message: "Validasi gagal",
        errors: fields,
      }),
    }));

    await assert.rejects(
      saveData("/courses", {
        method: "POST",
        body: { [countKey]: 12 },
        countKey,
        countLabel: "Jumlah",
      }),
      { status: 400, fields },
    );

    assert.equal(fetchMock.mock.callCount(), 1);
  });
}
