import { retailerService } from '../../../services/retailerService'

export const retailerRepository = {
  async list() {
    const response = await retailerService.getRetailers()
    return response.data ?? []
  },

  async getById(retailerId) {
    const response = await retailerService.getRetailerByCode(retailerId)
    return response.data ?? null
  },
}
