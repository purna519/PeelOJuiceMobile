import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import RazorpayCheckout from 'react-native-razorpay';
import CustomDialog from '../../components/CustomDialog';
import {useCart} from '../../contexts/CartContext';
import {useBranch} from '../../contexts/BranchContext';
import {getAddresses} from '../../services/address';
import {placeOrder} from '../../services/orders';
import {createRazorpayOrder, verifyRazorpayPayment} from '../../services/payment';
import {getBranches} from '../../services/branches';
import MainLayout from '../../components/MainLayout';
import {validatePincode} from '../../utils/deliveryZones';

const CheckoutScreen = ({navigation}) => {
  const {cart, getCartTotal, clearCart, removeCoupon} = useCart();
  const {selectedBranch} = useBranch(); // Use branch from context
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({});

  useEffect(() => {
    fetchAddresses();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchAddresses();
    }, [])
  );

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const response = await getAddresses();
      setAddresses(response);
      
      // Auto-select default address
      const defaultAddr = response.find(addr => addr.is_default);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr.id);
      } else if (response.length > 0) {
        setSelectedAddress(response[0].id);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handlePaymentSuccess = async (orderId, isCOD = false) => {
    try {
      await removeCoupon();
    } catch (couponError) {
      console.log('Coupon removal error (non-critical):', couponError);
    }
    
    try {
      await clearCart();
    } catch (cartError) {
      console.log('Cart clear error (non-critical):', cartError);
    }

    setLoading(false);
    setDialogConfig({
      title: isCOD ? 'Order Placed Successfully!' : 'Payment Successful!',
      message: isCOD 
        ? `Your order has been placed. You will pay ₹${getCartTotal().toFixed(2)} on delivery.`
        : 'Your order has been placed and paid successfully.',
      type: 'success',
      showCancel: true,
      confirmText: 'View Order',
      cancelText: 'Continue Shopping',
      onConfirm: () => {
        navigation.reset({
          index: 1,
          routes: [
            {name: 'Home'},
            {name: 'OrderDetail', params: {orderId}},
          ],
        });
      },
      onCancel: () => {
        navigation.reset({
          index: 0,
          routes: [{name: 'Home'}],
        });
      },
    });
    setDialogVisible(true);
  };

  const handleOnlinePayment = async (orderId) => {
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
        prefill: {
          email: '',
          contact: '',
          name: '',
        },
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
            handlePaymentSuccess(orderId);
          } catch (verifyError) {
            setLoading(false);
            console.error('Payment verification error:', verifyError);
            
            // Cancel the order since payment verification failed
            try {
              await api.post(`/orders/my-orders/${orderId}/cancel/`);
            } catch (cancelError) {
              console.log('Failed to cancel order:', cancelError);
            }
            
            // Provide user-friendly error message
            let errorMessage = 'Payment verification failed. Order has been cancelled. Please try again.';
            if (verifyError.isTimeout) {
              errorMessage = 'Payment verification timed out. Order has been cancelled. Please check your connection and try again.';
            } else if (verifyError.isNetworkError) {
              errorMessage = 'Network error during payment verification. Order has been cancelled. Please check your connection.';
            }
            
            setDialogConfig({
              title: 'Payment Verification Failed',
              message: errorMessage,
              type: 'error',
              confirmText: 'OK',
            });
            setDialogVisible(true);
          }
        })
        .catch(async error => {
          setLoading(false);
          console.log('Razorpay error:', error);
          // Payment cancelled/failed - Cancel the order
          try {
            await api.post(`/orders/my-orders/${orderId}/cancel/`);
          } catch (cancelError) {
            console.log('Failed to cancel order:', cancelError);
          }
          setDialogConfig({
            title: 'Payment Cancelled',
            message: 'Your payment was cancelled. Your cart items are still saved. You can try again when ready.',
            type: 'error',
            confirmText: 'OK',
          });
          setDialogVisible(true);
        });
    } catch (paymentError) {
      setLoading(false);
      console.error('Payment setup error:', paymentError);
      
      // Provide user-friendly error message based on error type
      let errorMessage = 'Failed to initialize payment. Please try again.';
      if (paymentError.isTimeout) {
        errorMessage = 'Request timed out while setting up payment. Please check your connection and try again.';
      } else if (paymentError.isNetworkError) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (paymentError.isSessionExpired) {
        errorMessage = paymentError.message; // "Your session has expired. Please login again."
      } else if (paymentError.response?.data?.error) {
        errorMessage = paymentError.response.data.error;
      }
      
      setDialogConfig({
        title: 'Payment Error',
        message: errorMessage,
        type: 'error',
        confirmText: 'OK',
      });
      setDialogVisible(true);
    }
  };

  const handlePlaceOrder = async () => {
    // If no address, treat as "Add Address" button
    if (addresses.length === 0) {
        navigation.navigate('Addresses');
        return;
    }

    if (!selectedAddress) {
      setDialogConfig({
        title: 'Error',
        message: 'Please select a delivery address',
        type: 'error',
        confirmText: 'OK',
      });
      setDialogVisible(true);
      return;
    }
    
    if (!isDeliverable) {
      setDialogConfig({
        title: 'Cannot Place Order',
        message: 'Sorry, the selected address is outside our delivery zone. Please choose a different address.',
        type: 'error',
        confirmText: 'OK',
      });
      setDialogVisible(true);
      return;
    }

    if (!selectedBranch) {
      setDialogConfig({
        title: 'Error',
        message: 'Please select a branch from the menu',
        type: 'error',
        confirmText: 'OK',
      });
      setDialogVisible(true);
      return;
    }

    const paymentTypeText = paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment';
    
    setDialogConfig({
      title: 'Confirm Order',
      message: `Place order with ${paymentTypeText}?`,
      type: 'confirm',
      showCancel: true,
      confirmText: 'Confirm',
      onConfirm: async () => {
        setLoading(true);
        setDialogVisible(false);
        
        try {
          // For COD, create order and complete
          if (paymentMethod === 'cod') {
            const response = await placeOrder(paymentMethod, selectedAddress, selectedBranch.id);
            const orderData = response.order;
            const orderId = orderData.id;
            await handlePaymentSuccess(orderId, true);
          } 
          // For Online Payment, collect payment FIRST, then create order
          else {
            // Open Razorpay payment WITHOUT creating order first
            setLoading(true);
            try {
              // Create temporary payment data or use a different flow
              // For now, we need to create order to get Razorpay order_id
              // This is a limitation - Razorpay needs order_id
              const response = await placeOrder(paymentMethod, selectedAddress, selectedBranch.id);
              const orderData = response.order;
              const orderId = orderData.id;
              await handleOnlinePayment(orderId);
            } catch (error) {
              setLoading(false);
              console.error('Payment initiation error:', error);
              setDialogConfig({
                title: 'Error',
                message: 'Failed to initiate payment. Please try again.',
                type: 'error',
                confirmText: 'OK',
              });
              setDialogVisible(true);
            }
          }
        } catch (error) {
          setLoading(false);
          console.error('Checkout error:', error);
          setDialogConfig({
            title: 'Order Failed',
            message: error.response?.data?.detail ||
              error.response?.data?.error ||
              'Failed to place order. Please try again.',
            type: 'error',
            confirmText: 'OK',
          });
          setDialogVisible(true);
        }
      },
    });
    setDialogVisible(true);
  };

  const selectedAddressData = addresses.find(addr => addr.id === selectedAddress);
  
  // Calculate dynamic totals based on address zone
  const calculateTotals = () => {
    if (!cart) return { 
        deliveryFee: 0, 
        deliveryGST: 0, 
        total: 0, 
        isDeliverable: true 
    };

    // Note: Based on UI usage, total_amount seems to correspond to Food Subtotal
    const foodSubtotal = Number(cart.total_amount) || 0; 
    const foodGST = Number(cart.food_gst) || 0;
    const platformFee = Number(cart.platform_fee) || 0;
    const discount = Number(cart.coupon_discount) || 0;
    
    let deliveryFee = 20; // Default fallback
    let isDeliverable = true;

    if (selectedAddressData) {
        const zoneInfo = validatePincode(selectedAddressData.pincode);
        if (!zoneInfo.valid) {
            // We can block or just show warning. Backend also validates.
            // Let's mark as not deliverable to show warning
             isDeliverable = false;
        }
        deliveryFee = zoneInfo.deliveryFee;
    }

    // Free delivery check
    if (foodSubtotal >= 99) {
        deliveryFee = 0;
    }

    const deliveryGST = deliveryFee * 0.18;
    const total = foodSubtotal + foodGST + deliveryFee + deliveryGST + platformFee - discount;

    console.log('Calculate Totals:', {
        foodSubtotal,
        foodGST,
        deliveryFee,
        deliveryGST,
        platformFee,
        discount,
        total
    });

    return {
        deliveryFee: Number(deliveryFee) || 0,
        deliveryGST: Number(deliveryGST) || 0,
        total: Number(total) || 0,
        isDeliverable
    };
  };

  const { deliveryFee, deliveryGST, total: totalAmount, isDeliverable } = calculateTotals();

  if (loadingAddresses) {
    return (
      <MainLayout navigation={navigation}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={50} color="#FF6B35" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout navigation={navigation}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Delivery Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.headerLeft}>
              <Icon name="location" size={24} color="#FF6B35" />
              <Text style={styles.sectionTitle}>Delivery Address</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('Addresses')}>
              <Icon name="add-circle" size={20} color="#FF6B35" />
              <Text style={styles.addButtonText}>Add New</Text>
            </TouchableOpacity>
          </View>

          {addresses.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Icon name="location-outline" size={50} color="#FF6B35" />
              </View>
              <Text style={styles.emptyTitle}>No Address Found</Text>
              <Text style={styles.emptySubtext}>Please add a delivery address to continue</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Addresses')}>
                <Text style={styles.emptyButtonText}>Add Address</Text>
                <Icon name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.addressList}>
              {addresses.map(address => (
                <TouchableOpacity
                  key={address.id}
                  style={[
                    styles.addressCard,
                    selectedAddress === address.id && styles.addressCardSelected,
                  ]}
                  onPress={() => setSelectedAddress(address.id)}>
                  <View style={styles.radioContainer}>
                    <View style={styles.radioOuter}>
                      {selectedAddress === address.id && <View style={styles.radioInner} />}
                    </View>
                  </View>

                  <View style={styles.addressContent}>
                    <View style={styles.addressHeader}>
                      <Text style={styles.addressLabel}>{address.label}</Text>
                      {address.is_default && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.addressName}>
                      {address.full_name} | {address.phone_number}
                    </Text>

                    <Text style={styles.addressText}>
                      {address.address_line1}
                      {address.address_line2 ? `, ${address.address_line2}` : ''}
                      {'\n'}
                      {address.city}, {address.state} - {address.pincode}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Branch Information Section (Read-only) */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderSimple}>
            <Icon name="business" size={24} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Delivery from Branch</Text>
          </View>

          <View style={styles.branchInfoCard}>
            <Icon name="location" size={20} color="#FF6B35" />
            <View style={styles.branchInfoContent}>
              <Text style={styles.branchInfoName}>{selectedBranch?.name || 'No branch selected'}</Text>
              <Text style={styles.branchInfoAddress}>
                {selectedBranch?.city ? `${selectedBranch.city}, ${selectedBranch.state}` : 'Please select a branch from the menu'}
              </Text>
            </View>
            {selectedBranch && <Icon name="checkmark-circle" size={24} color="#4CAF50" />}
          </View>
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderSimple}>
            <Icon name="card" size={24} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          <View style={styles.paymentList}>
            {/* Cash on Delivery */}
            <TouchableOpacity
              style={[
                styles.paymentCard,
                paymentMethod === 'cod' && styles.paymentCardSelected,
              ]}
              onPress={() => setPaymentMethod('cod')}>
              <View style={styles.radioContainer}>
                <View style={[styles.radioOuter, paymentMethod === 'cod' && styles.radioOuterGreen]}>
                  {paymentMethod === 'cod' && <View style={[styles.radioInner, styles.radioInnerGreen]} />}
                </View>
              </View>

              <View style={styles.paymentIconContainer}>
                <Icon name="cash" size={28} color="#4CAF50" />
              </View>

              <View style={styles.paymentContent}>
                <Text style={styles.paymentTitle}>Cash on Delivery</Text>
                <Text style={styles.paymentSubtext}>Pay when you receive</Text>
              </View>
            </TouchableOpacity>

            {/* Online Payment */}
            <TouchableOpacity
              style={[
                styles.paymentCard,
                paymentMethod === 'online' && styles.paymentCardSelected,
              ]}
              onPress={() => setPaymentMethod('online')}>
              <View style={styles.radioContainer}>
                <View style={[styles.radioOuter, paymentMethod === 'online' && styles.radioOuterBlue]}>
                  {paymentMethod === 'online' && <View style={[styles.radioInner, styles.radioInnerBlue]} />}
                </View>
              </View>

              <View style={styles.paymentIconContainer}>
                <Icon name="card-outline" size={28} color="#2196F3" />
              </View>

              <View style={styles.paymentContent}>
                <Text style={styles.paymentTitle}>Online Payment</Text>
                <Text style={styles.paymentSubtext}>UPI, Cards, Net Banking</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderSimple}>
            <Icon name="receipt" size={24} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>

          <View style={styles.summaryCard}>
            {/* Cart Items */}
            <View style={styles.itemsSection}>
              <Text style={styles.itemsSectionTitle}>Items ({cart?.items?.length || 0})</Text>
              {cart?.items?.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.juice_name}
                  </Text>
                  <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  <Text style={styles.itemPrice}>₹{(Number(item.price_at_added) * item.quantity).toFixed(2)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            {/* Bill Breakdown */}
            <View style={styles.billSection}>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Food Subtotal</Text>
                <Text style={styles.billValue}>₹{(Number(cart?.total_amount) || 0).toFixed(2)}</Text>
              </View>

              {cart?.coupon_discount > 0 && (
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, {color: '#4CAF50'}]}>Coupon Discount</Text>
                  <Text style={[styles.billValue, {color: '#4CAF50'}]}>
                    -₹{(Number(cart?.coupon_discount) || 0).toFixed(2)}
                  </Text>
                </View>
              )}

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>GST (5%)</Text>
                <Text style={styles.billValue}>₹{(Number(cart?.food_gst) || 0).toFixed(2)}</Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery Fee</Text>
                {deliveryFee === 0 ? (
                  <View style={styles.freeDeliveryRow}>
                    <Text style={styles.strikethrough}>
                        ₹{selectedAddressData ? validatePincode(selectedAddressData.pincode).deliveryFee : 20}
                    </Text>
                    <Text style={styles.freeText}>FREE</Text>
                  </View>
                ) : (
                  <Text style={styles.billValue}>₹{(deliveryFee || 0).toFixed(2)}</Text>
                )}
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery GST (18%)</Text>
                <Text style={styles.billValue}>₹{(deliveryGST || 0).toFixed(2)}</Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Platform Fee</Text>
                <Text style={styles.billValue}>₹{(Number(cart?.platform_fee) || 0).toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{(totalAmount || 0).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Place Order Button */}
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            (loading) && styles.placeOrderButtonDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>
                {addresses.length === 0 ? 'Add Address to Continue' : 'Place Order'}
              </Text>
              {addresses.length > 0 && <Icon name="checkmark-circle" size={24} color="#fff" />}
            </>
          )}
        </TouchableOpacity>

        <View style={{height: 20}} />
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
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF3EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addressList: {
    gap: 12,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    gap: 12,
  },
  addressCardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF3EE',
  },
  radioContainer: {
    paddingTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterGreen: {
    borderColor: '#4CAF50',
  },
  radioOuterBlue: {
    borderColor: '#2196F3',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B35',
  },
  radioInnerGreen: {
    backgroundColor: '#4CAF50',
  },
  radioInnerBlue: {
    backgroundColor: '#2196F3',
  },
  addressContent: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  defaultBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  addressName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  paymentList: {
    gap: 12,
  },
  branchInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#F0FFF4',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  branchInfoContent: {
    flex: 1,
  },
  branchInfoName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 2,
  },
  branchInfoAddress: {
    fontSize: 13,
    color: '#888',
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentCardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF3EE',
  },
  paymentIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentContent: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 2,
  },
  paymentSubtext: {
    fontSize: 13,
    color: '#888',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  itemsSection: {
    marginBottom: 4,
  },
  itemsSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
  itemQuantity: {
    fontSize: 13,
    color: '#999',
    marginHorizontal: 8,
    minWidth: 30,
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E1E1E',
  },
  billSection: {
    marginTop: 4,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 13,
    color: '#666',
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E1E1E',
  },
  freeDeliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strikethrough: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  freeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E1E1E',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  placeOrderButton: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    padding: 18,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 6,
    shadowColor: '#1E1E1E',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#CCC',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CheckoutScreen;

