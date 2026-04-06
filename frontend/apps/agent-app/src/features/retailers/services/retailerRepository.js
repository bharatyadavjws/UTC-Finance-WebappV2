import { retailerMockData } from '../data/retailerMockData'
import {
  createRetailerApi,
  fetchRetailerByIdApi,
  fetchRetailerListApi,
  updateRetailerApi,
} from '../api/retailerApi'

const USE_MOCK_RETAILER_API = true

function buildMockRetailer(values, retailerId = null) {
  return {
    id: retailerId || `RET${Date.now()}`,
    shopName: values.shopName.trim(),
    ownerName: values.ownerName.trim(),
    mobile: values.mobile.trim(),
    alternateMobile: values.alternateMobile.trim(),
    email: values.email.trim(),
    gstNumber: values.gstNumber.trim(),
    panNumber: values.panNumber.trim().toUpperCase(),
    addressLine1: values.addressLine1.trim(),
    addressLine2: values.addressLine2.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    pincode: values.pincode.trim(),
    status: 'Active',
  }
}

export const retailerRepository = {
  async list() {
    if (USE_MOCK_RETAILER_API) {
      return Promise.resolve(retailerMockData)
    }

    return fetchRetailerListApi()
  },

  async getById(retailerId) {
    if (USE_MOCK_RETAILER_API) {
      const item = retailerMockData.find((retailer) => retailer.id === retailerId) || null
      return Promise.resolve(item)
    }

    return fetchRetailerByIdApi(retailerId)
  },

  async create(values) {
    if (USE_MOCK_RETAILER_API) {
      return Promise.resolve(buildMockRetailer(values))
    }

    return createRetailerApi(values)
  },

  async update(retailerId, values) {
    if (USE_MOCK_RETAILER_API) {
      return Promise.resolve(buildMockRetailer(values, retailerId))
    }

    return updateRetailerApi(retailerId, values)
  },
}