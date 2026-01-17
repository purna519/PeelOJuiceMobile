import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {getMyOrders} from '../../services/orders';
import MainLayout from '../../components/MainLayout';
import {useNotification} from '../../contexts/NotificationContext';

const OrdersScreen = ({navigation}) => {
  const {showNotification} = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getMyOrders();
      // Backend returns {orders: [...]}
      const ordersData = data.orders || data || [];
      
      // Filter out ONLY incomplete online payment orders
      // (pending status with pending payment and online method)
      // Keep cancelled orders visible!
      const validOrders = ordersData.filter(order => {
        const status = order.status?.toLowerCase();
        const paymentStatus = order.payment_status?.toLowerCase();
        const paymentMethod = order.payment_method?.toLowerCase();
        
        // Hide ONLY incomplete online payments (pending order with pending payment)
        if (paymentMethod?.includes('online') && 
            status === 'pending' && 
            (paymentStatus === 'pending' || !paymentStatus)) {
          return false;
        }
        
        // Show everything else (including cancelled orders)
        return true;
      });
      
      // Sort by created_at ascending for chronological order (oldest first)
      const sortedOrders = validOrders.sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );
      setOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        showNotification(
          'Session Expired',
          'Please login again to view your orders',
          [
            {text: 'Cancel', style: 'cancel', onPress: () => navigation.navigate('Home')},
            {text: 'Login', onPress: () => navigation.navigate('Login')},
          ]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusIcon = status => {
    const statusLower = status?.toLowerCase() || '';
    const iconMap = {
      pending: 'time-outline',
      processing: 'hourglass-outline',
      delivered: 'checkmark-circle',
      cancelled: 'close-circle',
    };
    return iconMap[statusLower] || 'cube-outline';
  };

  const getStatusStyle = status => {
    const statusLower = status?.toLowerCase() || '';
    const styles = {
      pending: {backgroundColor: '#FFF3E0', color: '#F57C00'},
      processing: {backgroundColor: '#E3F2FD', color: '#1976D2'},
      delivered: {backgroundColor: '#E8F5E9', color: '#4CAF50'},
      cancelled: {backgroundColor: '#FFEBEE', color: '#F44336'},
    };
    return styles[statusLower] || {backgroundColor: '#fff', color: '#666'};
  };

  // Filter orders by selected status
  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status?.toLowerCase() === selectedStatus);

  const renderOrderItem = ({item, index}) => {
    const statusStyle = getStatusStyle(item.status);
    const itemsCount = item.items?.length || 0;
    const displayItems = (item.items || []).slice(0, 2);
    
    // Calculate user-relative order number
    // Orders are sorted by creation date in fetchOrders, so position = index + 1
    const orderNumber = index + 1;

    return (
      <View style={styles.orderCard}>
        {/* Black Header */}
        <View style={styles.orderHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Icon name="receipt" size={20} color="#FF6B35" />
            </View>
            <View>
              <Text style={styles.orderNumber}>
                Order #{orderNumber}
              </Text>
              <Text style={styles.orderDate}>
                {new Date(item.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: statusStyle.backgroundColor}]}>
            <Icon name={getStatusIcon(item.status)} size={14} color={statusStyle.color} />
            <Text style={[styles.statusText, {color: statusStyle.color}]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Order Content */}
        <View style={styles.orderContent}>
          {/* Items */}
          {itemsCount > 0 && (
            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>Items ({itemsCount})</Text>
              <View style={styles.itemsList}>
                {displayItems.map((orderItem, idx) => (
                  <View key={idx} style={styles.itemBadge}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {orderItem.juice_name || 'Item'}
                    </Text>
                    <View style={styles.quantityBadge}>
                      <Text style={styles.quantityText}>x{orderItem.quantity || 1}</Text>
                    </View>
                  </View>
                ))}
                {itemsCount > 2 && (
                  <View style={styles.moreItemsBadge}>
                    <Text style={styles.moreItemsText}>+{itemsCount - 2} more</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Payment & Total */}
          <View style={styles.footer}>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentLabel}>Payment</Text>
              <Text style={styles.paymentMethod}>
                {item.payment_method ? item.payment_method.replace('_', ' ') : 'N/A'}
              </Text>
            </View>
            <View style={styles.totalInfo}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>
                ₹{Number(item.total_amount || 0).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* View Details Button */}
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => navigation.navigate('OrderDetail', {orderId: item.id})}>
            <Icon name="eye-outline" size={18} color="#fff" />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <MainLayout navigation={navigation} title="My Orders">
        <View style={styles.centered}>
          <ActivityIndicator size={50} color="#FF6B35" />
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout navigation={navigation} title="My Orders">
      {/* Status Filter Tabs */}
      <View style={styles.filterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}>
          {['all', 'delivered', 'cancelled'].map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterTab,
                selectedStatus === status && styles.filterTabActive,
              ]}
              onPress={() => setSelectedStatus(status)}>
              <Text
                style={[
                  styles.filterTabText,
                  selectedStatus === status && styles.filterTabTextActive,
                ]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B35']} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconContainer}>
              <Icon name="receipt-outline" size={60} color="#FF6B35" />
            </View>
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>Start ordering some fresh juices!</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Menu')}>
              <Icon name="cart-outline" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Browse Menu</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  list: {
    padding: 16,
    backgroundColor: '#fff',
    paddingBottom: 120,
  },
  filterWrapper: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: '#FFF',
    borderColor: '#FF6B35',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTabTextActive: {
    color: '#FF6B35',
    fontWeight: '700',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E2E2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  orderContent: {
    padding: 18,
  },
  itemsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  itemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  itemName: {
    fontSize: 13,
    color: '#333',
    maxWidth: 120,
  },
  quantityBadge: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  quantityText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#666',
  },
  moreItemsBadge: {
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  moreItemsText: {
    fontSize: 13,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 16,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  totalInfo: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
    elevation: 3,
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 8,
  },
  emptySubtext: {
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

export default OrdersScreen;

