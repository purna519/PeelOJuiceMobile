import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useAuth} from '../contexts/AuthContext';

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import OTPScreen from '../screens/Auth/OTPScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/Auth/ResetPasswordScreen';

// Main App Screens
import HomeScreen from '../screens/Home/HomeScreen';
import MenuScreen from '../screens/Menu/MenuScreen';
import ProductDetailScreen from '../screens/Product/ProductDetailScreen';
import CartScreen from '../screens/Cart/CartScreen';
import CheckoutScreen from '../screens/Checkout/CheckoutScreen';
import OrdersScreen from '../screens/Orders/OrdersScreen';
import OrderDetailScreen from '../screens/Orders/OrderDetailScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import AccountScreen from '../screens/Profile/AccountScreen';
import AddressesScreen from '../screens/Profile/AddressesScreen';
import AddAddressScreen from '../screens/Profile/AddAddressScreen';
import BranchesScreen from '../screens/Branches/BranchesScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const {isAuthenticated, isLoading} = useAuth();

  if (isLoading) {
    // You can add a splash screen component here
    return null;
  }

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? "Home" : "Login"}
      screenOptions={{
        headerStyle: {backgroundColor: '#FF6B35'},
        headerTintColor: '#fff',
        headerTitleStyle: {fontWeight: 'bold'},
        detachInactiveScreens: true, // Performance optimization
      }}>
      {/* Auth Screens */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="OTP"
        component={OTPScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{headerShown: false}}
      />

      {/* Public/Main Screens */}
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{headerShown: false}} 
      />
      <Stack.Screen 
        name="Menu" 
        component={MenuScreen} 
        options={{headerShown: false}} 
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen} 
        options={{headerShown: false}} 
      />

      {/* Protected/User Screens */}
      <Stack.Screen 
        name="Cart" 
        component={CartScreen} 
        options={{headerShown: false}} 
      />
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutScreen} 
        options={{headerShown: false}} 
      />
      <Stack.Screen 
        name="Orders" 
        component={OrdersScreen} 
        options={{headerShown: false}} 
      />
      <Stack.Screen 
        name="OrderDetail" 
        component={OrderDetailScreen} 
        options={{headerShown: false}} 
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{headerShown: false}} 
      />
      <Stack.Screen 
        name="Account" 
        component={AccountScreen} 
        options={{headerShown: false}} 
      />
      <Stack.Screen 
        name="Addresses" 
        component={AddressesScreen} 
        options={{headerShown: false}} 
      />
      <Stack.Screen 
        name="AddAddress" 
        component={AddAddressScreen} 
        options={{headerShown: false}} 
      />
      <Stack.Screen 
        name="Branches" 
        component={BranchesScreen} 
        options={{headerShown: false}} 
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
