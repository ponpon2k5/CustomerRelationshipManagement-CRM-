const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim()
const API_BASE = `${API_BASE_URL}/api`

async function parseError(response) {
  try {
    const data = await response.json()
    return data.message || `Request failed (${response.status})`
  } catch {
    return `Request failed (${response.status})`
  }
}

export async function fetchInteractions(customerId, actorId) {
  const params = new URLSearchParams()
  if (actorId != null) {
    params.set('actorId', String(actorId))
  }
  const query = params.toString()
  const response = await fetch(`${API_BASE}/customers/${customerId}/interactions${query ? `?${query}` : ''}`)
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

export async function fetchInteractionSummary(id) {
  const response = await fetch(`${API_BASE}/interactions/${id}/summary`)
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export async function regenerateInteractionSummary(id) {
  const response = await fetch(`${API_BASE}/notes/${id}/regenerate-summary`, {
    method: 'PATCH',
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export async function batchProcessInteractionSummaries(noteIds, action = 'generate') {
  const response = await fetch(`${API_BASE}/notes/summaries/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ noteIds, action }),
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

