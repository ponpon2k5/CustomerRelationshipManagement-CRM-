const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const CACHE_TTL_MS = 30_000

let cachedStats = null
let cachedAt = 0

function buildUrl(path) {
  return `${API_BASE_URL}${path}`
}

async function parseJsonSafe(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function getDashboardStats({ force = false } = {}) {
  const now = Date.now()
  if (!force && cachedStats && now - cachedAt < CACHE_TTL_MS) {
    return cachedStats
  }

  const response = await fetch(buildUrl('/api/dashboard/stats'))

  if (!response.ok) {
    const errorBody = await parseJsonSafe(response)
    throw new Error(errorBody?.message || `Request failed with status ${response.status}`)
  }

  cachedStats = await response.json()
  cachedAt = Date.now()
  return cachedStats
}
