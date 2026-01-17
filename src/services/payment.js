import api from './api';

// Create Razorpay payment order
export const createRazorpayOrder = async orderId => {
  const response = await api.post('/payments/razorpay/create-order/', {
    order_id: orderId,
  });
  return response.data;
};

// Verify Razorpay payment
export const verifyRazorpayPayment = async (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const response = await api.post('/payments/razorpay/verify/', {
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  });
  return response.data;
};
