import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useAuth} from '../../contexts/AuthContext';
import CustomDialog from '../../components/CustomDialog';
import PremiumInput from '../../components/PremiumInput';
import GradientButton from '../../components/GradientButton';
import BrandLogo from '../../components/BrandLogo';

const LoginScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({});
  const {login} = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setDialogConfig({
        title: 'Error',
        message: 'Please fill in all fields',
        type: 'error',
        confirmText: 'OK',
      });
      setDialogVisible(true);
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setDialogConfig({
        title: 'Login Failed',
        message: result.error || 'Invalid email or password. Please try again.',
        type: 'error',
        confirmText: 'OK',
      });
      setDialogVisible(true);
    } else {
      navigation.replace('Home');
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
            keyboardShouldPersistTaps="handled">
            
            {/* Brand Header */}
            <View style={styles.header}>
              <BrandLogo showTagline={true} size="large" />
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <Text style={styles.welcomeText}>Welcome Back!</Text>
              <Text style={styles.signInText}>Sign in to continue</Text>

              <PremiumInput
                icon="mail-outline"
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
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

              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPasswordButton}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <GradientButton
                title="Login"
                onPress={handleLogin}
                loading={loading}
                style={styles.loginButton}
              />

              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                style={styles.signUpContainer}>
                <Text style={styles.signUpText}>
                  Don't have an account?{' '}
                  <Text style={styles.signUpTextBold}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Skip Button */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => navigation.navigate('Home')}>
              <Text style={styles.skipButtonText}>Skip for now</Text>
              <Icon name="arrow-forward" size={18} color="#FF6B35" />
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Custom Dialog */}
      <CustomDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        {...dialogConfig}
      />
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 0,
  },
  logoImage: {
    width: 70,
    height: 70,
    marginRight: -4,
  },
  brandTextContainer: {
    marginTop: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titlePeel: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#4A1E6D',
  },
  titleO: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  titleJuice: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#6B9E3E',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 75,
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
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  signInText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
  },
  eyeButton: {
    padding: 8,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: 20,
  },
  signUpContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  signUpText: {
    color: '#666',
    fontSize: 15,
  },
  signUpTextBold: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  skipButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;
