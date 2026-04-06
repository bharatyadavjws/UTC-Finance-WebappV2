import { apiClient, ENDPOINTS } from '@utc/api-client'
import { mapRetailerFromApi, mapRetailerToApi } from './retailerAdapter'

export async function fetchRetailerListApi() {
  const response = await apiClient.get(ENDPOINTS.RETAILERS.LIST)

  const items = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response)
    ? response
    : []

  return items.map(mapRetailerFromApi)
}

export async function fetchRetailerByIdApi(retailerId) {
  const response = await apiClient.get(ENDPOINTS.RETAILERS.DETAILS(retailerId))
  const item = response?.data || response
  return mapRetailerFromApi(item)
}

export async function createRetailerApi(values) {
  const payload = mapRetailerToApi(values)
  const response = await apiClient.post(ENDPOINTS.RETAILERS.CREATE, payload)
  const item = response?.data || response
  return mapRetailerFromApi(item)
}

export async function updateRetailerApi(retailerId, values) {
  const payload = mapRetailerToApi(values)
  const response = await apiClient.put(ENDPOINTS.RETAILERS.DETAILS(retailerId), payload)
  const item = response?.data || response
  return mapRetailerFromApi(item)
}