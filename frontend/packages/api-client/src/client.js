import { API_CONFIG } from './config'
import { getAuthToken } from './storage'

async function request(path, options = {}) {
  const token = getAuthToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')

  const data = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    throw {
      status: response.status,
      message: data?.message || 'API request failed',
      data,
    }
  }

  return data
}

export const apiClient = {
  get(path, options = {}) {
    return request(path, { ...options, method: 'GET' })
  },

  post(path, body = {}, options = {}) {
    return request(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  put(path, body = {}, options = {}) {
    return request(path, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    })
  },

  patch(path, body = {}, options = {}) {
    return request(path, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  delete(path, options = {}) {
    return request(path, {
      ...options,
      method: 'DELETE',
    })
  },
}