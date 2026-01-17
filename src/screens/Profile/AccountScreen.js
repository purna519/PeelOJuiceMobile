import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomDialog from '../../components/CustomDialog';
import {useAuth} from '../../contexts/AuthContext';
import api from '../../services/api';
import MainLayout from '../../components/MainLayout';

const AccountScreen = ({navigation}) => {
  const {user} = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({});
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    savedAddresses: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch profile
      const profileResponse = await api.get('/users/profile/');
      setProfile(profileResponse.data);
      setFullName(profileResponse.data?.full_name || '');

      // Fetch stats
      await fetchStats();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch orders
      const ordersResponse = await api.get('/orders/my-orders/');
      const orders = ordersResponse.data.orders || ordersResponse.data || [];

      // Fetch addresses
      const addressesResponse = await api.get('/addresses/');
      const addresses = addressesResponse.data || [];

      // Calculate stats
      const totalOrders = orders.length;
      const totalSpent = orders.reduce(
        (sum, order) => sum + parseFloat(order.total_amount || 0),
        0,
      );
      const savedAddresses = addresses.length;

      setStats({
        totalOrders,
        totalSpent,
        savedAddresses,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSave = async () => {
    try {
      const response = await api.put('/users/profile/', {full_name: fullName});
      setProfile(response.data);
      setEditing(false);
      setDialogConfig({
        title: 'Success',
        message: 'Profile updated successfully!',
        type: 'success',
        confirmText: 'OK',
      });
      setDialogVisible(true);
    } catch (error) {
      console.error('Error saving profile:', error);
      setDialogConfig({
        title: 'Error',
        message: 'Failed to update profile',
        type: 'error',
        confirmText: 'OK',
      });
      setDialogVisible(true);
    }
  };

  const handleCancel = () => {
    setFullName(profile?.full_name || '');
    setEditing(false);
  };

  if (loading) {
    return (
      <MainLayout navigation={navigation} title="My Account">
        <View style={styles.loading}>
          <ActivityIndicator size={50} color="#FF6B35" />
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout navigation={navigation} title="My Account">
      <ScrollView style={styles.container}>
        {/* Account Security Card */}
        <View style={styles.securityCard}>
          <View style={styles.securityIconContainer}>
            <Icon name="shield-checkmark" size={28} color="#FF6B35" />
          </View>
          <View style={styles.securityText}>
            <Text style={styles.securityTitle}>Account Security</Text>
            <Text style={styles.securitySubtitle}>
              Your account is protected with secure authentication
            </Text>
          </View>
        </View>

        {/* Email and Phone Verification Cards */}
        <View style={styles.cardsRow}>
          {/* Email Card */}
          <View style={styles.card}>
            <View style={styles.cardIconContainer}>
              <Icon name="mail" size={24} color="#FF6B35" />
            </View>
            <Text style={styles.cardLabel}>Email Address</Text>
            <Text style={styles.cardValue} numberOfLines={1}>
              {profile?.email || user?.email || 'Not set'}
            </Text>
            {(profile?.is_email_verified || user?.is_email_verified) && (
              <View style={styles.verifiedBadge}>
                <Icon name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          {/* Phone Card */}
          <View style={styles.card}>
            <View style={styles.cardIconContainer}>
              <Icon name="call" size={24} color="#FF6B35" />
            </View>
            <Text style={styles.cardLabel}>Phone Number</Text>
            <Text style={styles.cardValue} numberOfLines={1}>
              {profile?.phone_number || user?.phone_number || 'Not set'}
            </Text>
            {(profile?.is_phone_verified || user?.is_phone_verified) && (
              <View style={styles.verifiedBadge}>
                <Icon name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        </View>

        {/* Full Name Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={fullName}
              onChangeText={setFullName}
              editable={editing}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statNumber}>{stats.totalOrders}</Text>
              </View>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statNumber}>
                  ₹{Math.round(stats.totalSpent)}
                </Text>
              </View>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statNumber}>{stats.savedAddresses}</Text>
              </View>
              <Text style={styles.statLabel}>Saved Addresses</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {!editing ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditing(true)}>
              <Icon name="create-outline" size={20} color="#fff" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Security Card
  securityCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  securityIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF3EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  securityText: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  securitySubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  // Cards Row (Email & Phone)
  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 140,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E1E1E',
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  // Personal Information Section
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  field: {
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: '#f9f9f9',
    color: '#666',
  },
  // Stats Section
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  // Action Buttons
  actions: {
    padding: 16,
    paddingBottom: 100,
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AccountScreen;

