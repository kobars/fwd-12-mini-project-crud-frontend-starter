import test from 'node:test'
import assert from 'node:assert/strict'
import { api } from '../src/api.js'

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
