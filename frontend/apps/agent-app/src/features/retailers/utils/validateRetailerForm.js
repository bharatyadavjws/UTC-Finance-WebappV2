export function validateRetailerForm(values) {
    const errors = {}
  
    if (!values.shopName.trim()) {
      errors.shopName = 'Shop name is required'
    }
  
    if (!values.ownerName.trim()) {
      errors.ownerName = 'Owner name is required'
    }
  
    if (!values.mobile.trim()) {
      errors.mobile = 'Mobile number is required'
    } else if (!/^[0-9]{10}$/.test(values.mobile.trim())) {
      errors.mobile = 'Mobile number must be 10 digits'
    }
  
    if (values.alternateMobile.trim() && !/^[0-9]{10}$/.test(values.alternateMobile.trim())) {
      errors.alternateMobile = 'Alternate mobile must be 10 digits'
    }
  
    if (values.email.trim() && !/^\S+@\S+\.\S+$/.test(values.email.trim())) {
      errors.email = 'Enter a valid email address'
    }
  
    if (!values.city.trim()) {
      errors.city = 'City is required'
    }
  
    if (!values.state.trim()) {
      errors.state = 'State is required'
    }
  
    if (!values.pincode.trim()) {
      errors.pincode = 'Pincode is required'
    } else if (!/^[0-9]{6}$/.test(values.pincode.trim())) {
      errors.pincode = 'Pincode must be 6 digits'
    }
  
    return errors
  }