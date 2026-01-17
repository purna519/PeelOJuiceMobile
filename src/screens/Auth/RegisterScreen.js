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
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {register} from '../../services/auth';
import {useNotification} from '../../contexts/NotificationContext';
import {useToast} from '../../contexts/ToastContext';
import PremiumInput from '../../components/PremiumInput';
import GradientButton from '../../components/GradientButton';
import BrandLogo from '../../components/BrandLogo';

const RegisterScreen = ({navigation}) => {
  const {showNotification} = useNotification();
  const {showToast} = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword) {
      showToast('Please fill in all fields', 'info');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'info');
      return;
    }

    setLoading(true);
    try {
      const response = await register(email, phoneNumber, password, confirmPassword, firstName, lastName);
      setLoading(false);
      showNotification(
        'Success',
        'Registration successful! Please verify your email with the OTP sent.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('OTP', {email}),
          },
        ],
      );
    } catch (error) {
      setLoading(false);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        JSON.stringify(error.response?.data) ||
        'An error occurred';
      showNotification('Registration Failed', errorMsg);
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
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            
            {/* Header */}
            <View style={styles.header}>
              <BrandLogo showTagline={false} size="large" />
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join PeelOJuice today!</Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              {/* Name Fields Row */}
              <View style={styles.nameRow}>
                <View style={styles.nameInputContainer}>
                  <PremiumInput
                    icon="person-outline"
                    placeholder="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    style={styles.nameInput}
                  />
                </View>
                <View style={styles.nameInputContainer}>
                  <PremiumInput
                    icon="person-outline"
                    placeholder="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    style={styles.nameInput}
                  />
                </View>
              </View>

              <PremiumInput
                icon="mail-outline"
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <PremiumInput
                icon="call-outline"
                placeholder="Phone Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />

              <PremiumInput
                icon="lock-closed-outline"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
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

              <PremiumInput
                icon="lock-closed-outline"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                rightComponent={
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}>
                    <Icon
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color="#999"
                    />
                  </TouchableOpacity>
                }
              />

              <GradientButton
                title="Create Account"
                onPress={handleRegister}
                loading={loading}
                style={styles.registerButton}
              />

              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={styles.loginContainer}>
                <Text style={styles.loginText}>
                  Already have an account?{' '}
                  <Text style={styles.loginTextBold}>Login</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },
  nameInputContainer: {
    flex: 1,
  },
  nameInput: {
    marginBottom: 16,
  },
  eyeButton: {
    padding: 8,
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 20,
  },
  loginContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loginText: {
    color: '#666',
    fontSize: 15,
  },
  loginTextBold: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
