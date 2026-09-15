let entries = [], nextId = 0
const listeners = new Set()
export const getRequests = () => entries
export function subscribeRequests(listener) { listeners.add(listener); return () => listeners.delete(listener) }
export function recordRequest(entry) {
  entries = [{ ...entry, id: ++nextId }, ...entries].slice(0, 20)
  for (const listener of listeners) listener()
}
export function clearRequests() {
  entries = []
  for (const listener of listeners) listener()
}
