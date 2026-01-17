import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {getBranches} from '../../services/branches';
import MainLayout from '../../components/MainLayout';

const BranchesScreen = ({navigation}) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const data = await getBranches();
      setBranches(data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBranches();
  };

  const handleCall = phone => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleEmail = email => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  const handleDirections = (address, city, state) => {
    const fullAddress = `${address}, ${city}, ${state}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
    );
  };

  const formatTime = time => {
    if (!time) return '';
    // time comes as HH:MM:SS, convert to 12-hour format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderBranch = ({item}) => (
    <View style={styles.branchCard}>
      {/* Header with Black Background */}
      <View style={styles.branchHeader}>
        <View style={styles.iconContainer}>
          <Icon name="storefront" size={24} color="#FF6B35" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.branchName}>{item.name}</Text>
          <Text style={styles.cityText}>
            {item.city}, {item.state}
          </Text>
        </View>
      </View>

      {/* Branch Details */}
      <View style={styles.branchContent}>
        {/* Address */}
        <View style={styles.infoRow}>
          <Icon name="location-outline" size={18} color="#FF6B35" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoText}>
              {item.address}, {item.city} - {item.pincode}
            </Text>
          </View>
        </View>

        {/* Phone */}
        {item.phone && (
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handleCall(item.phone)}>
            <Icon name="call-outline" size={18} color="#FF6B35" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={[styles.infoText, styles.linkText]}>{item.phone}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Email */}
        {item.email && (
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handleEmail(item.email)}>
            <Icon name="mail-outline" size={18} color="#FF6B35" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={[styles.infoText, styles.linkText]}>{item.email}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Timing */}
        <View style={styles.infoRow}>
          <Icon name="time-outline" size={18} color="#FF6B35" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Timing</Text>
            <Text style={styles.infoText}>
              {formatTime(item.opening_time)} - {formatTime(item.closing_time)}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {item.phone && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCall(item.phone)}>
            <Icon name="call" size={18} color="#fff" />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.directionsButton]}
          onPress={() => handleDirections(item.address, item.city, item.state)}>
          <Icon name="navigate" size={18} color="#fff" />
          <Text style={styles.actionText}>Directions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <MainLayout navigation={navigation} title="Our Branches">
        <View style={styles.loading}>
          <ActivityIndicator size={50} color="#FF6B35" />
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout navigation={navigation} title="Our Branches">
      <FlatList
        data={branches}
        renderItem={renderBranch}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconContainer}>
              <Icon name="storefront-outline" size={50} color="#FF6B35" />
            </View>
            <Text style={styles.emptyText}>No branches available</Text>
            <Text style={styles.emptySubtext}>Check back later</Text>
          </View>
        }
      />
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
    backgroundColor: '#fff',
  },
  branchCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2E2E2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  branchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  cityText: {
    fontSize: 13,
    color: '#999',
  },
  branchContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  linkText: {
    color: '#FF6B35',
    textDecorationLine: 'underline',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    elevation: 2,
    shadowColor: '#4CAF50',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  directionsButton: {
    backgroundColor: '#FF6B35',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});

export default BranchesScreen;

