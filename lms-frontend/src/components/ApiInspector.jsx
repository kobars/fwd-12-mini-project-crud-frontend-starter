import { useState, useSyncExternalStore } from 'react'
import config from '../config.js'
import { api } from '../api.js'
import { clearRequests, getRequests, subscribeRequests } from '../requestLog.js'

export default function ApiInspector({ actor }) {
  const requests = useSyncExternalStore(subscribeRequests, getRequests)
  const [busy, setBusy] = useState(false), [method, setMethod] = useState('GET')
  async function lookup(event) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    setBusy(true)
    const id = fields.get('id').trim()
    try { await api(fields.get('resource') + (id ? '/' + encodeURIComponent(id) : ''), { method, actor, ...(['POST', 'PUT'].includes(method) ? { rawBody: fields.get('body') } : {}) }) }
    catch { /* The actual error response is displayed in the request history. */ }
    finally { setBusy(false) }
  }
  return <details className="api-inspector">
    <summary>Request &amp; response API ({requests.length})</summary>
    <p>Periksa metode, URL, body, HTTP status, dan JSON dari backend. Pilih akun latihan untuk menguji hak akses; backend menentukan hasilnya.</p>
    <form className="api-lookup" onSubmit={lookup}>
      <label>Metode<select name="method" value={method} onChange={event => setMethod(event.target.value)}>{['GET', 'POST', 'PUT', 'DELETE'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Endpoint<select name="resource"><option value={config.caseKey === 'marketplace' ? '/products' : '/courses'}>{config.endpoint}</option><option value="/categories">/api/categories</option></select></label>
      <label>ID (kosong untuk daftar/tambah)<input name="id" placeholder="Contoh: 1 atau 999999999" /></label>
      {['POST', 'PUT'].includes(method) && <label className="api-raw-body">Body JSON<textarea name="body" rows={5} defaultValue="{}" spellCheck={false} /><small>Dikirim apa adanya untuk menguji validasi backend.</small></label>}
      <button className="button secondary" disabled={busy}>{busy ? 'Mengirim...' : 'Kirim request'}</button>
    </form>
    <button className="text-link" type="button" onClick={clearRequests}>Bersihkan riwayat</button>
    <ol className="api-history">{requests.map(entry => <li key={entry.id}>
      <details>
        <summary><code>{entry.method} {entry.url}</code> <strong>HTTP {entry.status ?? '—'}</strong></summary>
        <h3>Request</h3><pre>{JSON.stringify({ headers: entry.headers, ...(entry.body === undefined ? {} : { body: entry.body }) }, null, 2)}</pre>
        <h3>Response</h3><pre>{JSON.stringify(entry.response ?? { error: entry.error || 'Response bukan JSON.' }, null, 2)}</pre>
      </details>
    </li>)}</ol>
    {!requests.length && <p>Belum ada request. Gunakan form CRUD atau kirim request di atas.</p>}
  </details>
}
