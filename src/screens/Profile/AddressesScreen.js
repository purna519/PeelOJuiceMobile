import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomDialog from '../../components/CustomDialog';
import {getAddresses, deleteAddress, setDefaultAddress} from '../../services/address';
import MainLayout from '../../components/MainLayout';

const AddressesScreen = ({navigation}) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({});

  useEffect(() => {
    fetchAddresses();
    
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAddresses();
    });
    
    return unsubscribe;
  }, [navigation]);

  const fetchAddresses = async () => {
    try {
      const data = await getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      if (error.response?.status === 401) {
        setDialogConfig({
          title: 'Session Expired',
          message: 'Please login again',
          type: 'error',
          confirmText: 'OK',
          onConfirm: () => navigation.navigate('Login'),
        });
        setDialogVisible(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddNew = () => {
    navigation.navigate('AddAddress');
  };

  const handleEdit = (address) => {
    navigation.navigate('AddAddress', {address});
  };

  const handleDelete = (id) => {
    setDialogConfig({
      title: 'Delete Address',
      message: 'Are you sure you want to delete this address?',
      type: 'confirm',
      showCancel: true,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await deleteAddress(id);
          fetchAddresses();
          setDialogConfig({
            title: 'Success',
            message: 'Address deleted successfully',
            type: 'success',
            confirmText: 'OK',
      });
          setDialogVisible(true);
        } catch (error) {
          setDialogConfig({
            title: 'Error',
            message: 'Failed to delete address',
            type: 'error',
            confirmText: 'OK',
          });
          setDialogVisible(true);
        }
      },
    });
    setDialogVisible(true);
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      fetchAddresses();
      setDialogConfig({
        title: 'Success',
        message: 'Default address updated',
        type: 'success',
        confirmText: 'OK',
      });
      setDialogVisible(true);
    } catch (error) {
      setDialogConfig({
        title: 'Error',
        message: 'Failed to update default address',
        type: 'error',
        confirmText: 'OK',
      });
      setDialogVisible(true);
    }
  };

  const renderAddress = ({item}) => (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.iconContainer}>
          <Icon
            name={item.label?.toLowerCase().includes('home') ? 'home' : 'briefcase'}
            size={22}
            color="#FF6B35"
          />
        </View>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={styles.addressType}>{item.label || 'Address'}</Text>
            {item.is_default && (
              <View style={styles.defaultBadge}>
                <Icon name="star" size={12} color="#4CAF50" />
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEdit(item)}>
            <Icon name="create-outline" size={18} color="#666" />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.nameText}>{item.full_name}</Text>
      <Text style={styles.phoneText}>{item.phone_number}</Text>
      
      <View style={styles.addressContent}>
        <Text style={styles.addressText}>{item.address_line1}</Text>
        {item.address_line2 && (
          <Text style={styles.addressText}>{item.address_line2}</Text>
        )}
        <Text style={styles.addressText}>
          {item.city}, {item.state} - {item.pincode}
        </Text>
        {item.landmark && (
          <Text style={styles.landmarkText}>Landmark: {item.landmark}</Text>
        )}
      </View>

      <View style={styles.actions}>
        {!item.is_default && (
          <TouchableOpacity
            style={styles.defaultButton}
            onPress={() => handleSetDefault(item.id)}>
            <Icon name="star-outline" size={18} color="#FF6B35" />
            <Text style={styles.defaultButtonText}>Set as Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.deleteButton, item.is_default && {flex: 1}]}
          onPress={() => handleDelete(item.id)}>
          <Icon name="trash-outline" size={18} color="#F44336" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <MainLayout navigation={navigation} title="My Addresses">
        <View style={styles.loading}>
          <ActivityIndicator size={50} color="#FF6B35" />
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout navigation={navigation} title="My Addresses">
      <View style={styles.container}>
        <FlatList
          data={addresses}
          renderItem={renderAddress}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          onRefresh={fetchAddresses}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconContainer}>
                <Icon name="location-outline" size={60} color="#FF6B35" />
              </View>
              <Text style={styles.emptyText}>No addresses saved</Text>
              <Text style={styles.emptySubtext}>Add an address to get started</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddNew}>
                <Icon name="add" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Add New Address</Text>
              </TouchableOpacity>
            </View>
          }
        />

        <TouchableOpacity style={styles.fab} onPress={handleAddNew}>
          <Icon name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

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
  list: {
    padding: 16,
    paddingBottom: 120,
  },
  addressCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addressHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  addressType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  defaultText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E1E1E',
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  addressContent: {
    paddingLeft: 2,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 2,
  },
  landmarkText: {
    fontSize: 13,
    color: '#999',
    marginTop: 6,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  defaultButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFF3EE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  defaultButtonText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  deleteText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 110,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddressesScreen;

