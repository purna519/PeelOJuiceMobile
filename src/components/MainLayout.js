import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useNotification } from '../contexts/NotificationContext';
import { useRoute } from '@react-navigation/native';
import BrandLogo from './BrandLogo';

const MainLayout = ({children, navigation, title}) => {
  const {isAuthenticated} = useAuth();
  const {showNotification} = useNotification();
  const {getCartItemCount} = useCart();
  const cartItemCount = getCartItemCount();
  const route = useRoute();
  const currentRoute = route.name;

  const mainScreens = ['Menu', 'Cart', 'Orders', 'Profile', 'Branches'];

  const defaultTitles = {
    Home: 'PeelOJuice',
    Menu: 'Full Menu',
    Cart: 'Shopping Cart',
    Orders: 'My Orders',
    Profile: 'My Profile',
    ProductDetail: 'Product Details',
    Branches: 'Our Branches',
    Addresses: 'My Addresses',
    Account: 'Account Settings',
    OrderDetail: 'Order Details',
  };

  const pageTitle = title || defaultTitles[currentRoute] || 'PeelOJuice';
  
  // Show back button for all screens except Home
  const showBack = currentRoute !== 'Home';

  const handleBackPress = () => {
    // For main screens (Menu, Cart, Orders, Profile, Branches), always go to Home
    if (mainScreens.includes(currentRoute)) {
      navigation.navigate('Home');
    } else {
      // For sub-screens, use goBack to respect navigation stack
      navigation.goBack();
    }
  };

  const navigateToProtectedScreen = screenName => {
    if (!isAuthenticated) {
      showNotification(
        'Login Required',
        'Please login to access this feature',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Login', onPress: () => navigation.navigate('Login')},
        ],
      );
      return;
    }
    navigation.navigate(screenName);
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />

      <View style={[
        styles.header,
        currentRoute === 'Home' && styles.headerHome
      ]}>
        <View style={styles.headerLeft}>
          {showBack && (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBackPress}>
              <Icon name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.headerTitleArea}>
          <BrandLogo 
            showTagline={currentRoute === 'Home'} 
            size={currentRoute === 'Home' ? 'large' : 'small'} 
          />
        </View>
        <View style={styles.headerRight}>
          {/* Future: Add search or cart shortcut if needed */}
        </View>
      </View>

      <View style={styles.content}>{children}</View>

      {/* FIXED BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateToProtectedScreen('Profile')}>
          <Icon
            name={currentRoute === 'Profile' ? 'person' : 'person-outline'}
            size={24}
            color={currentRoute === 'Profile' ? '#FF6B35' : '#666'}
          />
          <Text style={[styles.navLabel, currentRoute === 'Profile' && styles.navLabelActive]}>
            Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateToProtectedScreen('Cart')}>
          <View>
            <Icon
              name={currentRoute === 'Cart' ? 'cart' : 'cart-outline'}
              size={24}
              color={currentRoute === 'Cart' ? '#FF6B35' : '#666'}
            />
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.navLabel, currentRoute === 'Cart' && styles.navLabelActive]}>
            Cart
          </Text>
        </TouchableOpacity>

        {/* Center Menu - Now part of the flex flow */}
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Menu')}>
          <View
            style={[
              styles.centerIconContainer,
              currentRoute === 'Menu' && styles.centerIconContainerActive,
            ]}>
            <Icon name="grid" size={28} color="#fff" />
          </View>
          <Text style={styles.navLabelCenter}>Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateToProtectedScreen('Orders')}>
          <Icon
            name={currentRoute === 'Orders' ? 'receipt' : 'receipt-outline'}
            size={24}
            color={currentRoute === 'Orders' ? '#FF6B35' : '#666'}
          />
          <Text style={[styles.navLabel, currentRoute === 'Orders' && styles.navLabelActive]}>
            Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Branches')}>
          <Icon
            name={currentRoute === 'Branches' ? 'location' : 'location-outline'}
            size={24}
            color={currentRoute === 'Branches' ? '#FF6B35' : '#666'}
          />
          <Text style={[styles.navLabel, currentRoute === 'Branches' && styles.navLabelActive]}>
            Branches
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 55,
    paddingBottom: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  headerHome: {
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
    paddingTop: 65,
    paddingBottom: 20,
  },
  headerLeft: {
    width: 50,
    alignItems: 'flex-start',
  },
  headerTitleArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    width: 50,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPeel: { fontSize: 36, fontWeight: 'bold', color: '#F5A623' },
  logoO: { fontSize: 36, fontWeight: 'bold', color: '#FF6B35' },
  logoJuice: { fontSize: 36, fontWeight: 'bold', color: '#2D5016' },
  tagline: { fontSize: 13, color: '#666', fontStyle: 'italic', marginTop: 8 },
  content: {
    flex: 1,
  },
  // --- BOTTOM NAV STYLES ---
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: 25,
    height: 90,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  centerIconContainer: {
    backgroundColor: '#FF6B35',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    marginTop: -30,
    elevation: 5,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  centerIconContainerActive: {
    backgroundColor: 'rgba(255, 107, 53, 0.9)',
  },
  navLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  navLabelCenter: {
    fontSize: 10,
    color: '#FF6B35',
    marginTop: 2,
    fontWeight: '700',
  },
});

export default MainLayout;