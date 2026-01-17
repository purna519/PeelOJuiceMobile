import api from './api';

// Get cart details
export const getCart = async () => {
  const response = await api.get('/cart/');
  return response.data;
};

// Add item to cart
export const addToCart = async (juiceId, quantity = 1) => {
  const response = await api.post('/cart/add/', {
    juice_id: juiceId,
    quantity,
  });
  return response.data;
};

// Update cart item quantity
export const updateCartItem = async (juiceId, action) => {
  const response = await api.post('/cart/update/', {
    juice_id: juiceId,
    action, // 'increment' or 'decrement'
  });
  return response.data;
};

// Update cart item instructions
export const updateCartItemInstructions = async (juiceId, instructions) => {
  const response = await api.post('/cart/update-instructions/', {
    juice_id: juiceId,
    instructions,
  });
  return response.data;
};

// Remove item from cart
export const removeFromCart = async juiceId => {
  const response = await api.delete('/cart/remove/', {
    data: {
      juice_id: juiceId,
    },
  });
  return response.data;
};

// Apply coupon
export const applyCoupon = async code => {
  const response = await api.post('/cart/apply-coupon/', {code});
  return response.data;
};

// Remove coupon
export const removeCoupon = async () => {
  const response = await api.post('/cart/remove-coupon/', {});
  return response.data;
};

// Clear cart
export const clearCart = async () => {
  const response = await api.delete('/cart/clear/');
  return response.data;
};
