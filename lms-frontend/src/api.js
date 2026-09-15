import config from './config.js'
import { recordRequest } from './requestLog.js'
export async function api(path, { method = 'GET', body, rawBody, actor, signal } = {}) {
  // Let synchronous effect cleanup cancel before starting network I/O.
  if (signal) {
    await Promise.resolve()
    signal.throwIfAborted()
  }
  let response
  const headers = { Accept: 'application/json', 'X-Case-Study': config.caseKey, ...(body !== undefined || rawBody !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(actor ? { 'X-Practice-User-Id': String(actor.id) } : {}) }
  const request = { method, url: '/api' + path, headers, body: rawBody !== undefined ? rawBody : body }
  try {
    response = await fetch('/api' + path, {
      method, signal, credentials: 'omit',
      headers,
      ...(rawBody !== undefined ? { body: rawBody } : body !== undefined ? { body: JSON.stringify(body) } : {})
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    if (!signal?.aborted) recordRequest({ ...request, status: null, error: 'Tidak dapat terhubung ke server.' })
    throw new Error('Tidak dapat terhubung ke server. Pastikan backend masih berjalan.')
  }
  const data = await response.json().catch(error => {
    if (error.name === 'AbortError') throw error
    return null
  })
  signal?.throwIfAborted()
  recordRequest({ ...request, status: response.status, response: data })
  if (!response.ok || !data?.success) {
    const error = new Error(data?.message || 'Respons server tidak dapat dibaca.')
    error.status = response.status
    error.fields = data?.errors || {}
    throw error
  }
  return data.data
}
