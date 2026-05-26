const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim()
const API_URL = `${API_BASE_URL}/api/customers`
export async function searchCustomers(keyword) {
  const response = await fetch(
    `${API_URL}/search?keyword=${encodeURIComponent(keyword)}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch customers')
  }

  return response.json()
}
