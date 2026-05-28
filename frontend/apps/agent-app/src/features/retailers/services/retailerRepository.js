import { retailerService } from '../../../services/retailerService'

export const retailerRepository = {
  async list() {
    const response = await retailerService.getRetailers()
    return response.data ?? []
  },

  async getById(retailerId) {
    if (!retailerId) {
      throw new Error('Retailer ID is missing')
    }

    const response = await retailerService.getRetailerById(retailerId)
    return response.data ?? null
  },
}