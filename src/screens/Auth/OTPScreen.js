import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {verifyOTP, resendOTP} from '../../services/auth';
import {useAuth} from '../../contexts/AuthContext';
import {useNotification} from '../../contexts/NotificationContext';
import {useToast} from '../../contexts/ToastContext';
import OTPInput from '../../components/OTPInput';
import GradientButton from '../../components/GradientButton';
import BrandLogo from '../../components/BrandLogo';

const OTPScreen = ({route, navigation}) => {
  const {email} = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const {refreshUser} = useAuth();
  const {showNotification} = useNotification();
  const {showToast} = useToast();

  // Countdown timer for resend OTP
  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      showToast('Please enter a valid 6-digit OTP', 'info');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOTP(email, otp);
      
      // Save tokens
      if (response.access && response.refresh) {
        await AsyncStorage.multiSet([
          ['accessToken', response.access],
          ['refreshToken', response.refresh],
          ['user', JSON.stringify(response.user)],
        ]);
        
        await refreshUser();
      }
      
      setLoading(false);
      showToast('Account verified successfully!', 'success');
      // Navigation will happen automatically via AuthContext
    } catch (error) {
      setLoading(false);
      showNotification(
        'Verification Failed',
        error.response?.data?.message || 'Invalid OTP',
      );
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    try {
      await resendOTP(email);
      showToast('OTP sent successfully!', 'success');
      setResendTimer(60);
      setCanResend(false);
    } catch (error) {
      showToast('Failed to resend OTP', 'error');
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
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <BrandLogo showTagline={false} size="small" />
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to
            </Text>
            <Text style={styles.email}>{email}</Text>
          </View>

          {/* OTP Card */}
          <View style={styles.otpCard}>
            <Text style={styles.otpLabel}>Enter OTP Code</Text>
            
            <OTPInput value={otp} onChange={setOtp} length={6} />

            <GradientButton
              title="Verify"
              onPress={handleVerifyOTP}
              loading={loading}
              style={styles.verifyButton}
            />

            <TouchableOpacity
              onPress={handleResendOTP}
              disabled={!canResend}
              style={styles.resendButton}>
              <Icon
                name="refresh"
                size={20}
                color={canResend ? '#FF6B35' : '#CCC'}
                style={{marginRight: 8}}
              />
              <Text
                style={[
                  styles.resendText,
                  {color: canResend ? '#FF6B35' : '#999'},
                ]}>
                {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
              </Text>
            </TouchableOpacity>

            {/* Timer Progress */}
            {!canResend && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {width: `${(resendTimer / 60) * 100}%`},
                    ]}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Icon name="information-circle-outline" size={18} color="#666" />
            <Text style={styles.helpText}>
              Didn't receive the code? Check your spam folder
            </Text>
          </View>
        </View>
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
    paddingHorizontal: 24,
    paddingTop: 50,
    justifyContent: 'center',
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
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  otpCard: {
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
    marginBottom: 12,
    textAlign: 'center',
  },
  verifyButton: {
    marginTop: 16,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
    gap: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    flex: 1,
  },
});

export default OTPScreen;
