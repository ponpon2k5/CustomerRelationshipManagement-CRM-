const API_BASE = '/api'

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

