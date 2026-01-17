/**
 * Delivery Zones Configuration
 * Defines serviceable areas and delivery charges for Vijayawada
 */

export const DELIVERY_ZONES = {
  core: {
    name: 'Core Delivery Zone',
    distance: '0-3 km',
    deliveryFee: 20,
    deliveryTime: '15-20 mins',
    pincodes: [
      '520010', // Moghalrajpuram, Labbipet, Patamata, Benz Circle, Punnamathota
      '520008', // Bharathi Nagar, Currency Nagar, Siddhartha Nagar, Loyola College
      '520004', // Machavaram, Gunadala, Christurajupuram
      '520002', // Governorpet, Buckinghampeta, Suryaraopet
    ],
  },
  secondary: {
    name: 'Secondary Delivery Zone',
    distance: '3-7 km',
    deliveryFee: 40,
    deliveryTime: '20-30 mins',
    pincodes: [
      '520003', // Gandhi Nagar, Satyanarayanapuram, Ayodhya Nagar
      '520007', // Auto Nagar, Kanuru, Sanath Nagar
      '520001', // One Town (Kaleswara Rao Market), Islampet
      '520013', // Krishna Lanka, Ranigarithota
      '520011', // Durga Puram, Madhura Nagar
      '521137', // Penamaluru
    ],
  },
};

/**
 * Validate if a pincode is in a serviceable area
 * @param {string} pincode - The pincode to validate
 * @returns {Object} Validation result with zone info or error
 */
export const validatePincode = pincode => {
  if (!pincode || typeof pincode !== 'string') {
    return {
      valid: false,
      message: 'Please enter a valid pincode',
    };
  }

  // Remove any spaces and convert to string
  const cleanPincode = pincode.trim();

  // Check core zone
  if (DELIVERY_ZONES.core.pincodes.includes(cleanPincode)) {
    return {
      valid: true,
      zone: 'core',
      zoneName: DELIVERY_ZONES.core.name,
      deliveryFee: DELIVERY_ZONES.core.deliveryFee,
      deliveryTime: DELIVERY_ZONES.core.deliveryTime,
      distance: DELIVERY_ZONES.core.distance,
    };
  }

  // Check secondary zone
  if (DELIVERY_ZONES.secondary.pincodes.includes(cleanPincode)) {
    return {
      valid: true,
      zone: 'secondary',
      zoneName: DELIVERY_ZONES.secondary.name,
      deliveryFee: DELIVERY_ZONES.secondary.deliveryFee,
      deliveryTime: DELIVERY_ZONES.secondary.deliveryTime,
      distance: DELIVERY_ZONES.secondary.distance,
    };
  }

  // Not in any serviceable zone
  return {
    valid: false,
    message:
      'Sorry, we don\'t deliver to this pincode yet. We currently serve Vijayawada areas only.',
    suggestedPincodes: [
      ...DELIVERY_ZONES.core.pincodes,
      ...DELIVERY_ZONES.secondary.pincodes,
    ],
  };
};

/**
 * Get all serviceable pincodes
 * @returns {Array} List of all pincodes we deliver to
 */
export const getAllServiceablePincodes = () => {
  return [
    ...DELIVERY_ZONES.core.pincodes,
    ...DELIVERY_ZONES.secondary.pincodes,
  ];
};

/**
 * Get zone color for UI
 * @param {string} zone - Zone name ('core' or 'secondary')
 * @returns {string} Hex color code
 */
export const getZoneColor = zone => {
  const colors = {
    core: '#4CAF50', // Green
    secondary: '#FF9800', // Orange
  };
  return colors[zone] || '#999';
};

/**
 * Format delivery fee for display
 * @param {number} fee - Delivery fee amount
 * @returns {string} Formatted fee string
 */
export const formatDeliveryFee = fee => {
  return fee === 0 ? 'FREE' : `₹${fee}`;
};
