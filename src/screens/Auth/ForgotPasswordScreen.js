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
import {requestPasswordReset} from '../../services/auth';
import {useNotification} from '../../contexts/NotificationContext';
import {useToast} from '../../contexts/ToastContext';
import PremiumInput from '../../components/PremiumInput';
import GradientButton from '../../components/GradientButton';
import BrandLogo from '../../components/BrandLogo';

const ForgotPasswordScreen = ({navigation}) => {
  const {showNotification} = useNotification();
  const {showToast} = useToast();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async () => {
    if (!emailOrPhone.trim()) {
      showToast('Please enter your email or phone number', 'info');
      return;
    }

    setLoading(true);
    try {
      const response = await requestPasswordReset(emailOrPhone.trim());
      setLoading(false);
      
      showNotification(
        'OTP Sent',
        response.message || 'Password reset OTP has been sent to your email',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('ResetPassword', {
                emailOrPhone: emailOrPhone.trim(),
                otp: response.password_reset_otp,
              });
            },
          },
        ]
      );
    } catch (error) {
      setLoading(false);
      
      const errorData = error.response?.data;
      
      if (errorData?.password_reset_otp) {
        showNotification(
          'Email Delivery Issue',
          `${errorData.message}\n\n OTP for testing: ${errorData.password_reset_otp}\n\nDo you want to proceed?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Proceed',
              onPress: () => {
                navigation.navigate('ResetPassword', {
                  emailOrPhone: emailOrPhone.trim(),
                  otp: errorData.password_reset_otp,
                });
              },
            },
          ]
        );
      } else {
        const errorMessage =
          errorData?.message || error.message || 'Failed to send reset OTP. Please try again.';
        showToast(errorMessage, 'error');
      }
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
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                Don't worry! Enter your email or phone number and we'll send you an OTP to reset your password
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <PremiumInput
                icon="mail-outline"
                placeholder="Email or Phone Number"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <GradientButton
                title="Send OTP"
                onPress={handleRequestReset}
                loading={loading}
                style={styles.submitButton}
              />

              <TouchableOpacity
                onPress={() => navigation.goBack()}
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
    lineHeight: 22,
    paddingHorizontal: 20,
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

export default ForgotPasswordScreen;
