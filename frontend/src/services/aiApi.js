const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim()

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

export async function sendChatMessage(message) {
  const response = await fetch(buildUrl('/api/ai/chat'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  })

  if (!response.ok) {
    const errorBody = await parseJsonSafe(response)
    const errorMsg = errorBody?.message || 'Không thể kết nối với chatbot AI.'
    throw new Error(errorMsg)
  }

  return response.json()
}
