const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

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

async function request(path, actorId, options = {}) {
  const response = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': String(actorId || ''),
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorBody = await parseJsonSafe(response)
    const message = errorBody?.message || `Request failed with status ${response.status}`
    throw new Error(message)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export function getUsers(actorId, { page = 0, size = 10, role = '', status = '' } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  if (role) params.set('role', role)
  if (status) params.set('status', status)

  return request(`/api/users?${params.toString()}`, actorId)
}

export function createUser(actorId, payload) {
  return request('/api/users', actorId, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateUserRoleStatus(actorId, userId, payload) {
  return request(`/api/users/${userId}/role-status`, actorId, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
