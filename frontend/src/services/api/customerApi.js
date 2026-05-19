const API_URL = 'http://localhost:8080/api/customers'

export async function searchCustomers(keyword) {
  const response = await fetch(
    `${API_URL}/search?keyword=${encodeURIComponent(keyword)}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch customers')
  }

  return response.json()
}