/**
 * Middleware to detect address changes
 * Compares old and new address fields
 */

const detectAddressChange = (oldUser, newData) => {
  const addressFields = ['address', 'city', 'postalCode'];
  
  let hasChanged = false;
  const changes = {};
  
  addressFields.forEach(field => {
    if (newData[field] !== undefined && newData[field] !== oldUser[field]) {
      hasChanged = true;
      changes[field] = {
        old: oldUser[field] || '',
        new: newData[field]
      };
    }
  });
  
  return {
    hasChanged,
    changes,
    oldAddress: {
      address: oldUser.address || '',
      city: oldUser.city || '',
      postalCode: oldUser.postalCode || ''
    },
    newAddress: {
      address: newData.address || oldUser.address || '',
      city: newData.city || oldUser.city || '',
      postalCode: newData.postalCode || oldUser.postalCode || ''
    }
  };
};

module.exports = detectAddressChange;
