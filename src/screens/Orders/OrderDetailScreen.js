import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomDialog from '../../components/CustomDialog';
import {getOrderDetail, getMyOrders} from '../../services/orders';
import {createRazorpayOrder, verifyRazorpayPayment} from '../../services/payment';
import RazorpayCheckout from 'react-native-razorpay';
import api from '../../services/api';
import {API_BASE_URL} from '../../services/api';
import MainLayout from '../../components/MainLayout';

const OrderDetailScreen = ({route, navigation}) => {
  const {orderId} = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({});
  const [orderNumber, setOrderNumber] = useState(null);

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      const data = await getOrderDetail(orderId);
      setOrder(data);
      
      // Calculate user-relative order number
      try {
        const allOrdersResponse = await getMyOrders();
        const allOrders = allOrdersResponse.orders || allOrdersResponse || [];
        // Sort by created_at ascending to get chronological order
        const sortedOrders = allOrders.sort((a, b) => 
          new Date(a.created_at) - new Date(b.created_at)
        );
        // Find this order's position (1-indexed)
        const position = sortedOrders.findIndex(o => o.id === orderId);
        if (position !== -1) {
          setOrderNumber(position + 1);
        }
      } catch (err) {
        console.log('Could not calculate order number:', err);
        // Non-critical error, continue without order number
      }
    } catch (error) {
      console.error('Error fetching order detail:', error);
      setDialogConfig({
        title: 'Error',
        message: 'Failed to load order details',
        type: 'error',
        confirmText: 'OK',
        onConfirm: () => navigation.goBack(),
      });
      setDialogVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    setLoading(true);
    try {
      const paymentData = await createRazorpayOrder(orderId);
      const options = {
        description: `Order #${orderId}`,
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: paymentData.currency,
        key: paymentData.key_id,
        amount: paymentData.amount,
        name: 'PeelOJuice',
        order_id: paymentData.razorpay_order_id,
        prefill: { email: '', contact: '', name: '' },
        theme: {color: '#FF6B35'},
      };

      RazorpayCheckout.open(options)
        .then(async paymentResponse => {
           try {
             await verifyRazorpayPayment(
                 paymentResponse.razorpay_order_id, 
                 paymentResponse.razorpay_payment_id, 
                 paymentResponse.razorpay_signature
             );
             setDialogConfig({
                 title: 'Success', 
                 message: 'Payment completed successfully!', 
                 type: 'success', 
                 confirmText: 'OK',
                 onConfirm: () => fetchOrderDetail()
             });
             setDialogVisible(true);
           } catch(e) {
             console.error(e);
             setDialogConfig({title: 'Error', message: 'Payment verification failed', type: 'error', confirmText: 'OK'});
             setDialogVisible(true);
           }
        })
        .catch(e => {
            console.log(e);
            setDialogConfig({title: 'Cancelled', message: 'Payment cancelled', type: 'error', confirmText: 'OK'});
            setDialogVisible(true);
        })
        .finally(() => setLoading(false));

    } catch (error) {
       console.error(error);
       setLoading(false);
       setDialogConfig({title: 'Error', message: 'Failed to initiate payment', type: 'error', confirmText: 'OK'});
       setDialogVisible(true);
    }
  };

  const handleCancelOrder = async () => {
    setCancelling(true);
    setShowCancelModal(false);

    try {
      await api.post(`/orders/my-orders/${orderId}/cancel/`);
      setDialogConfig({
        title: 'Success',
        message: 'Order cancelled successfully',
        type: 'success',
        confirmText: 'OK',
      });
      setDialogVisible(true);
      fetchOrderDetail(); // Refresh data
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to cancel order';
      setDialogConfig({
        title: 'Error',
        message: errorMsg,
        type: 'error',
        confirmText: 'OK',
      });
      setDialogVisible(true);
    } finally {
      setCancelling(false);
    }
  };

  const getStatusStyle = status => {
    const statusLower = status?.toLowerCase() || '';
    const styles = {
      pending: {backgroundColor: '#FFF3E0', color: '#F57C00', icon: 'time-outline'},
      confirmed: {backgroundColor: '#E3F2FD', color: '#1976D2', icon: 'checkmark-circle-outline'},
      preparing: {backgroundColor: '#FFE0B2', color: '#E65100', icon: 'restaurant-outline'},
      out_for_delivery: {backgroundColor: '#F3E5F5', color: '#7B1FA2', icon: 'bicycle-outline'},
      delivered: {backgroundColor: '#E8F5E9', color: '#4CAF50', icon: 'checkmark-circle'},
      cancelled: {backgroundColor: '#FFEBEE', color: '#F44336', icon: 'close-circle'},
    };
    return (
      styles[statusLower] || {
        backgroundColor: '#F5F5F5',
        color: '#666',
        icon: 'time-outline',
      }
    );
  };

  if (loading) {
    return (
      <MainLayout navigation={navigation} title="Order Details">
        <View style={styles.centered}>
          <ActivityIndicator size={50} color="#FF6B35" />
        </View>
      </MainLayout>
    );
  }

  if (!order) {
    return null;
  }

  const statusStyle = getStatusStyle(order.status);

  return (
    <MainLayout navigation={navigation} title="Order Details">
      <ScrollView style={styles.container}>
        {/* Order Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.orderTitle}>
                Order #{orderNumber || order.id}
              </Text>
              <Text style={styles.orderDate}>
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {backgroundColor: statusStyle.backgroundColor},
              ]}>
              <Icon name={statusStyle.icon} size={18} color={statusStyle.color} />
              <Text style={[styles.statusText, {color: statusStyle.color}]}>
                {order.status_display || order.status.replace('_', ' ')}
              </Text>
            </View>
          </View>

          {/* Payment Info */}
          <View style={styles.paymentGrid}>
            <View style={styles.paymentItem}>
              <View style={styles.paymentIcon}>
                <Icon
                  name={
                    order.payment_method === 'Cash on Delivery'
                      ? 'cash-outline'
                      : 'card-outline'
                  }
                  size={20}
                  color="#FF6B35"
                />
              </View>
              <View>
                <Text style={styles.paymentLabel}>Payment Method</Text>
                <Text style={styles.paymentValue}>{order.payment_method || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.paymentItem}>
              <View style={styles.paymentIcon}>
                <Icon name="wallet-outline" size={20} color="#FF6B35" />
              </View>
              <View>
                <Text style={styles.paymentLabel}>Payment Status</Text>
                <Text style={[styles.paymentValue, styles.capitalize]}>
                  {order.payment_status || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="cart-outline" size={22} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Order Items</Text>
          </View>
          {(order.items || []).map((item, index) => (
            <View key={item.id || index} style={styles.itemCard}>
              <Image
                source={{
                  uri: item.juice_image
                    ? item.juice_image.startsWith('http')
                      ? item.juice_image
                      : `${API_BASE_URL.replace('/api', '')}${item.juice_image}`
                    : 'https://via.placeholder.com/80',
                }}
                style={styles.itemImage}
              />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.juice_name}</Text>
                <Text style={styles.itemMeta}>Quantity: {item.quantity}</Text>
                <Text style={styles.itemMeta}>
                  ₹{item.price_per_item} each
                </Text>
              </View>
              <Text style={styles.itemTotal}>₹{item.subtotal}</Text>
            </View>
          ))}
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Food Subtotal</Text>
              <Text style={styles.priceValue}>
                ₹{Number(order.food_subtotal || 0).toFixed(2)}
              </Text>
            </View>
            {order.discount > 0 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, styles.discountText]}>
                  Discount
                </Text>
                <Text style={[styles.priceValue, styles.discountText]}>
                  -₹{Number(order.discount).toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Food GST (5%)</Text>
              <Text style={styles.priceValue}>
                ₹{Number(order.food_gst || 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Fee</Text>
              <Text style={styles.priceValue}>
                ₹{Number(order.delivery_fee_base || 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery GST (18%)</Text>
              <Text style={styles.priceValue}>
                ₹{Number(order.delivery_gst || 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Platform Fee</Text>
              <Text style={styles.priceValue}>
                ₹{Number(order.platform_fee || 0).toFixed(2)}
              </Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                ₹{Number(order.total_amount).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Pay Now Button - Only for COD orders before delivery */}
        {order.payment_method === 'Cash on Delivery' &&
         order.status !== 'cancelled' &&
         order.status !== 'delivered' && (
           <View style={styles.section}>
             <TouchableOpacity
               style={styles.retryButton}
               onPress={handleRetryPayment}
             >
               <Icon name="card-outline" size={20} color="#fff" />
               <Text style={styles.retryButtonText}>Pay Now</Text>
             </TouchableOpacity>
             <Text style={styles.cancelHint}>
               Pay online now and switch from COD to Online Payment
             </Text>
           </View>
        )}

        {/* Cancel Order Button */}
        {order.can_cancel && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.cancelButton, cancelling && styles.cancelButtonDisabled]}
              onPress={() => setShowCancelModal(true)}
              disabled={cancelling}>
              <Icon name="close-circle-outline" size={20} color="#fff" />
              <Text style={styles.cancelButtonText}>
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.cancelHint}>
              You can cancel this order before it's delivered
            </Text>
          </View>
        )}

        <View style={{height: 100}} />
      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Icon name="alert-circle-outline" size={32} color="#F44336" />
              </View>
              <Text style={styles.modalTitle}>Cancel Order?</Text>
            </View>
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel this order? This action cannot be
              undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowCancelModal(false)}>
                <Text style={styles.modalButtonSecondaryText}>
                  No, Keep Order
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleCancelOrder}>
                <Text style={styles.modalButtonPrimaryText}>
                  Yes, Cancel Order
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  orderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 6,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  paymentGrid: {
    gap: 16,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  paymentValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E1E1E',
  },
  capitalize: {
    textTransform: 'capitalize',
  },
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 16,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 12,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E1E1E',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
    alignSelf: 'center',
  },
  priceBreakdown: {
    gap: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  discountText: {
    color: '#4CAF50',
  },
  totalRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  totalValue: {
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
    elevation: 3,
    shadowColor: '#F44336',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  cancelButtonDisabled: {
    backgroundColor: '#999',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F44336',
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default OrderDetailScreen;

