import test from 'node:test'
import assert from 'node:assert/strict'
import { api } from '../src/api.js'
import { clearRequests, getRequests } from '../src/requestLog.js'

test('canceling while reading the response preserves AbortError', async t => {
  const controller = new AbortController()
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true, status: 200,
    async json() { controller.abort(); throw controller.signal.reason }
  }))
  await assert.rejects(api('/categories', { signal: controller.signal }), { name: 'AbortError' })
})

test('an invalid JSON response still reports a readable server error', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true, status: 200,
    async json() { throw new SyntaxError('Invalid JSON') }
  }))
  await assert.rejects(api('/categories'), { message: 'Respons server tidak dapat dibaca.', status: 200 })
})

test('backend validation errors retain their status and field messages', async t => {
  const fields = { title: ['Judul wajib diisi.'] }
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: false, status: 400,
    async json() { return { success: false, message: 'Data tidak valid.', errors: fields } }
  }))
  await assert.rejects(api('/courses'), { message: 'Data tidak valid.', status: 400, fields })
})


test('effect cleanup cancels before any network request starts', async t => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => ({
    ok: true, status: 200,
    async json() { return { success: true, data: [] } }
  }))
  const controller = new AbortController()
  const pending = api('/categories', { signal: controller.signal })
  controller.abort()
  await assert.rejects(pending, { name: 'AbortError' })
  assert.equal(fetchMock.mock.callCount(), 0)
})

test('a replacement effect sends one request and receives the API data', async t => {
  const categories = [{ id: 1, name: 'Design' }]
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => ({
    ok: true, status: 200,
    async json() { return { success: true, data: categories } }
  }))
  const canceled = new AbortController()
  const discarded = api('/categories', { signal: canceled.signal })
  canceled.abort()
  const replacement = api('/categories', { signal: new AbortController().signal })
  await assert.rejects(discarded, { name: 'AbortError' })
  assert.deepEqual(await replacement, categories)
  assert.equal(fetchMock.mock.callCount(), 1)
})


test('the inspector retains the actual HTTP response and submitted identity/body', async t => {
  clearRequests()
  const payload = { success: false, message: 'Forbidden' }
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 403, async json() { return payload } }))
  await assert.rejects(api('/categories', { method: 'POST', body: { name: 'Test' }, actor: { id: 42 } }), { status: 403 })
  const [entry] = getRequests()
  assert.equal(entry.method, 'POST')
  assert.equal(entry.url, '/api/categories')
  assert.equal(entry.headers['X-Practice-User-Id'], '42')
  assert.deepEqual(entry.body, { name: 'Test' })
  assert.equal(entry.status, 403)
  assert.deepEqual(entry.response, payload)
})

test('requests canceled before fetching do not enter the inspector history', async () => {
  clearRequests()
  const controller = new AbortController()
  const pending = api('/categories', { signal: controller.signal })
  controller.abort()
  await assert.rejects(pending, { name: 'AbortError' })
  assert.equal(getRequests().length, 0)
})


test('manual JSON is sent unchanged so backend validation can be tested', async t => {
  clearRequests()
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 400, async json() { return { success: false, message: 'JSON tidak valid.' } } }))
  await assert.rejects(api('/categories', { method: 'POST', rawBody: '{' }), { status: 400 })
  const options = fetchMock.mock.calls[0].arguments[1]
  assert.equal(options.body, '{')
  assert.equal(options.headers['Content-Type'], 'application/json')
  assert.equal(getRequests()[0].body, '{')
})
