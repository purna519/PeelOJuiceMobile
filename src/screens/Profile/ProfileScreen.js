import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {useState, useEffect} from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomDialog from '../../components/CustomDialog';
import {useAuth} from '../../contexts/AuthContext';
import MainLayout from '../../components/MainLayout';
import {getMyOrders} from '../../services/orders';
import {getAddresses} from '../../services/address';

const ProfileScreen = ({navigation}) => {
  const {user, logout} = useAuth();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({});
  const [ordersCount, setOrdersCount] = useState(0);
  const [addressesCount, setAddressesCount] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch orders
      const ordersData = await getMyOrders();
      // Handle both {orders: [...]} and [...] formats
      const ordersArray = ordersData?.orders || ordersData || [];
      
      // Filter out ONLY incomplete online payments, keep cancelled orders
      const validOrders = ordersArray.filter(order => {
        const status = order.status?.toLowerCase();
        const paymentStatus = order.payment_status?.toLowerCase();
        const paymentMethod = order.payment_method?.toLowerCase();
        
        // Hide ONLY incomplete online payments
        if (paymentMethod?.includes('online') && 
            status === 'pending' && 
            (paymentStatus === 'pending' || !paymentStatus)) {
          return false;
        }
        
        return true;
      });
      
      setOrdersCount(Array.isArray(validOrders) ? validOrders.length : 0);
      
      // Fetch addresses
      const addressesData = await getAddresses();
      const addressesArray = addressesData?.addresses || addressesData || [];
      setAddressesCount(Array.isArray(addressesArray) ? addressesArray.length : 0);
    } catch (error) {
      console.log('Error fetching stats:', error);
      // Set to 0 on error
      setOrdersCount(0);
      setAddressesCount(0);
    }
  };

  const handleLogout = () => {
    setDialogConfig({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      type: 'confirm',
      showCancel: true,
      confirmText: 'Logout',
      onConfirm: async () => {
        await logout();
        navigation.reset({
          index: 0,
          routes: [{name: 'Login'}],
        });
      },
    });
    setDialogVisible(true);
  };

  return (
    <MainLayout navigation={navigation}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Premium Header with Gradient Background */}
        <View style={styles.headerGradient}>
          {/* Avatar Card */}
          <View style={styles.avatarCard}>
            <View style={styles.avatarContainer}>
              <Icon name="person" size={50} color="#FFF" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {user?.full_name || user?.email || 'Guest User'}
              </Text>
              {user?.email && (
                <Text style={styles.userEmail}>{user.email}</Text>
              )}
              {user?.phone_number && (
                <View style={styles.phoneContainer}>
                  <Icon name="call" size={14} color="#666" />
                  <Text style={styles.userPhone}>{user.phone_number}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Icon name="receipt" size={24} color="#FF6B35" />
              <Text style={styles.statNumber}>{ordersCount}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Icon name="location" size={24} color="#FF6B35" />
              <Text style={styles.statNumber}>{addressesCount}</Text>
              <Text style={styles.statLabel}>Addresses</Text>
            </View>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Account')}>
            <View style={styles.menuIconContainer}>
              <Icon name="person-outline" size={22} color="#FF6B35" />
            </View>
            <Text style={styles.menuText}>Profile & Account</Text>
            <Icon name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Addresses')}>
            <View style={styles.menuIconContainer}>
              <Icon name="location-outline" size={22} color="#FF6B35" />
            </View>
            <Text style={styles.menuText}>My Addresses</Text>
            <Icon name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <View style={styles.sectionDivider} />
          
          <Text style={styles.sectionTitle}>Orders & Activity</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Orders')}>
            <View style={styles.menuIconContainer}>
              <Icon name="receipt-outline" size={22} color="#FF6B35" />
            </View>
            <Text style={styles.menuText}>My Orders</Text>
            <Icon name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <View style={styles.sectionDivider} />

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <View style={styles.logoutIconContainer}>
              <Icon name="log-out-outline" size={22} color="#F44336" />
            </View>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{height: 40}} />
      </ScrollView>
      
      {/* Custom Dialog */}
      <CustomDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        {...dialogConfig}
      />
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerGradient: {
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  userDetails: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userPhone: {
    fontSize: 13,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
  },
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E1E',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  logoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#F44336',
    marginLeft: 12,
    fontWeight: '700',
  },
});

export default ProfileScreen;

