const API_BASE = '/api'

async function parseError(response) {
  try {
    const data = await response.json()
    return data.message || `Request failed (${response.status})`
  } catch {
    return `Request failed (${response.status})`
  }
}

export async function fetchInteractions(customerId) {
  const response = await fetch(`${API_BASE}/customers/${customerId}/interactions`)
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export async function createInteraction(customerId, payload) {
  const response = await fetch(`${API_BASE}/customers/${customerId}/interactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export async function updateInteraction(id, payload) {
  const response = await fetch(`${API_BASE}/interactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}
