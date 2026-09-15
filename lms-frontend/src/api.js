import config from './config.js'
export async function api(path, { method = 'GET', body, actor, signal } = {}) {
  let response
  try {
    response = await fetch('/api' + path, {
      method, signal, credentials: 'omit',
      headers: { Accept: 'application/json', 'X-Case-Study': config.caseKey, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(actor ? { 'X-Practice-User-Id': String(actor.id) } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Tidak dapat terhubung ke server. Pastikan backend masih berjalan.')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.success) {
    const error = new Error(data?.message || 'Respons server tidak dapat dibaca.')
    error.status = response.status
    error.fields = data?.errors || {}
    throw error
  }
  return data.data
}
