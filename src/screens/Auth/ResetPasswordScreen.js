import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {verifyPasswordResetOTP, confirmPasswordReset} from '../../services/auth';
import {useNotification} from '../../contexts/NotificationContext';
import {useToast} from '../../contexts/ToastContext';
import PremiumInput from '../../components/PremiumInput';
import GradientButton from '../../components/GradientButton';
import OTPInput from '../../components/OTPInput';
import BrandLogo from '../../components/BrandLogo';

const ResetPasswordScreen = ({navigation, route}) => {
  const {showNotification} = useNotification();
  const {showToast} = useToast();
  const {emailOrPhone, otp: devOtp} = route.params || {};
  
  const [otp, setOtp] = useState(devOtp || '');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      showToast('Please enter the 6-digit OTP', 'info');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyPasswordResetOTP(emailOrPhone, otp.trim());
      setLoading(false);
      setOtpVerified(true);
      showToast(response.message || 'OTP verified successfully', 'success');
    } catch (error) {
      setLoading(false);
      const errorMessage =
        error.response?.data?.message || 'Invalid OTP. Please try again.';
      showToast(errorMessage, 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      showToast('Please enter a new password', 'info');
      return;
    }

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'info');
      return;
    }

    setLoading(true);
    try {
      const response = await confirmPasswordReset(emailOrPhone, newPassword);
      setLoading(false);
      
      showNotification(
        'Success',
        response.message || 'Password reset successful. Please login with your new password',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Login');
            },
          },
        ]
      );
    } catch (error) {
      setLoading(false);
      const errorMessage =
        error.response?.data?.message || 'Failed to reset password. Please try again.';
      showToast(errorMessage, 'error');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/doodle-pattern.png')}
      style={styles.background}
      resizeMode="repeat">
      {/* White Overlay */}
      <View style={styles.overlay} />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <BrandLogo showTagline={false} size="small" />
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                {!otpVerified
                  ? 'Enter the OTP sent to your email'
                  : 'Create a new strong password'}
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              {!otpVerified ? (
                <>
                  <Text style={styles.otpLabel}>Enter 6-Digit OTP</Text>
                  <OTPInput value={otp} onChange={setOtp} length={6} />

                  <GradientButton
                    title="Verify OTP"
                    onPress={handleVerifyOTP}
                    loading={loading}
                    style={styles.submitButton}
                  />
                </>
              ) : (
                <>
                  <PremiumInput
                    icon="lock-closed-outline"
                    placeholder="New Password (min 8 characters)"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    rightComponent={
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}>
                        <Icon
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={22}
                          color="#999"
                        />
                      </TouchableOpacity>
                    }
                  />

                  {/* Password Requirements */}
                  <View style={styles.requirementsContainer}>
                    <Icon name="information-circle-outline" size={16} color="#666" />
                    <Text style={styles.requirementsText}>
                      Password must be at least 8 characters long
                    </Text>
                  </View>

                  <GradientButton
                    title="Reset Password"
                    onPress={handleResetPassword}
                    loading={loading}
                    style={styles.submitButton}
                  />
                </>
              )}

              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={styles.backContainer}>
                <Icon name="arrow-back" size={18} color="#FF6B35" style={{marginRight: 6}} />
                <Text style={styles.backText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  eyeButton: {
    padding: 8,
  },
  requirementsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  requirementsText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  submitButton: {
    marginBottom: 20,
  },
  backContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  backText: {
    color: '#FF6B35',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ResetPasswordScreen;
