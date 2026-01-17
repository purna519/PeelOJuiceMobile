import api from './api';

// Checkout and create order
export const checkout = async (paymentMethod, addressId, branchId) => {
  const response = await api.post('/orders/checkout/', {
    payment_method: paymentMethod,
    address_id: addressId,
    branch_id: branchId,
  });
  return response.data;
};

// Alias for checkout
export const placeOrder = checkout;

// Get user's orders
export const getMyOrders = async () => {
  const response = await api.get('/orders/my-orders/');
  return response.data;
};

// Get order detail by ID
export const getOrderDetail = async id => {
  const response = await api.get(`/orders/my-orders/${id}/`);
  return response.data;
};

// Cancel order
export const cancelOrder = async id => {
  const response = await api.delete(`/orders/my-orders/${id}/cancel/`);
  return response.data;
};
