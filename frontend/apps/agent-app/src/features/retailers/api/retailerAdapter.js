export function mapRetailerFromApi(item = {}) {
    return {
      id: item.id || item.retailer_id || '',
      shopName: item.shop_name || '',
      ownerName: item.owner_name || '',
      mobile: item.mobile || '',
      alternateMobile: item.alternate_mobile || '',
      email: item.email || '',
      gstNumber: item.gst_number || '',
      panNumber: item.pan_number || '',
      addressLine1: item.address_line_1 || '',
      addressLine2: item.address_line_2 || '',
      city: item.city || '',
      state: item.state || '',
      pincode: item.pincode || '',
      status: item.status || 'Pending',
    }
  }
  
  export function mapRetailerToApi(values = {}) {
    return {
      shop_name: values.shopName || '',
      owner_name: values.ownerName || '',
      mobile: values.mobile || '',
      alternate_mobile: values.alternateMobile || '',
      email: values.email || '',
      gst_number: values.gstNumber || '',
      pan_number: values.panNumber || '',
      address_line_1: values.addressLine1 || '',
      address_line_2: values.addressLine2 || '',
      city: values.city || '',
      state: values.state || '',
      pincode: values.pincode || '',
    }
  }