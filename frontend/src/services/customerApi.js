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

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
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

export function getCustomers() {
  return request('/api/customers')
}

export function getCustomerById(customerId) {
  return request(`/api/customers/${customerId}`)
}

export function createCustomer(payload) {
  return request('/api/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateCustomer(customerId, payload) {
  return request(`/api/customers/${customerId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deactivateCustomer(customerId) {
  return request(`/api/customers/${customerId}/deactivate`, {
    method: 'PATCH',
  })
}
