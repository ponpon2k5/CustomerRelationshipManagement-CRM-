const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const API_BASE = `${API_BASE_URL}/api`
async function parseError(response) {
  try {
    const data = await response.json()
    return data.message || `Request failed (${response.status})`
  } catch {
    return `Request failed (${response.status})`
  }
}

export async function fetchIssues(limit = 500) {
  const response = await fetch(`${API_BASE}/interactions/issues?limit=${limit}`)
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

