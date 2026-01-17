import api from './api';

// Register new user
export const register = async (email, phoneNumber, password, confirmPassword, firstName, lastName) => {
  const response = await api.post('/users/register/', {
    email,
    phone_number: phoneNumber,
    password,
    confirm_password: confirmPassword,
    first_name: firstName,
    last_name: lastName,
  });
  return response.data;
};

// Verify OTP
export const verifyOTP = async (email, otp) => {
  const response = await api.post('/users/verify-otp/', {
    email,
    otp,
  });
  return response.data;
};

// Resend OTP
export const resendOTP = async email => {
  const response = await api.post('/users/resend-otp/', {email});
  return response.data;
};

// Login
export const login = async (email, password) => {
  try {
    console.log('Login API call - Email:', email, 'Password length:', password?.length);
    const response = await api.post('/users/login/', {
      email_or_phone: email,  // Backend expects 'email_or_phone' not 'email'
      password,
    });
    console.log('Login API response:', response.data);
    return response.data;
  } catch (error) {
    console.log('Login API error:', error.response?.data);
    throw error;
  }
};

// Get current user profile
export const getUserProfile = async () => {
  const response = await api.get('/users/profile/');
  return response.data;
};

// Update user profile
export const updateUserProfile = async (data) => {
  const response = await api.put('/users/profile/', data);
  return response.data;
};

// Request password reset OTP
export const requestPasswordReset = async (emailOrPhone) => {
  try {
    console.log('Request password reset - Email/Phone:', emailOrPhone);
    const response = await api.post('/users/password-reset/request/', {
      email_or_phone: emailOrPhone,
    });
    console.log('Password reset request response:', response.data);
    return response.data;
  } catch (error) {
    console.log('Password reset request error:', error.response?.data);
    throw error;
  }
};

// Verify password reset OTP
export const verifyPasswordResetOTP = async (emailOrPhone, otp) => {
  try {
    console.log('Verify password reset OTP - Email/Phone:', emailOrPhone);
    const response = await api.post('/users/password-reset/verify/', {
      email_or_phone: emailOrPhone,
      otp,
    });
    console.log('Password reset OTP verification response:', response.data);
    return response.data;
  } catch (error) {
    console.log('Password reset OTP verification error:', error.response?.data);
    throw error;
  }
};

// Confirm password reset with new password
export const confirmPasswordReset = async (emailOrPhone, newPassword) => {
  try {
    console.log('Confirm password reset - Email/Phone:', emailOrPhone);
    const response = await api.post('/users/password-reset/confirm/', {
      email_or_phone: emailOrPhone,
      new_password: newPassword,
    });
    console.log('Password reset confirmation response:', response.data);
    return response.data;
  } catch (error) {
    console.log('Password reset confirmation error:', error.response?.data);
    throw error;
  }
};
