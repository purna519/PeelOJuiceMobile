import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomDialog from '../../components/CustomDialog';
import CookingInstructionsInput from '../../components/CookingInstructionsInput';
import {useCart} from '../../contexts/CartContext';
import {useAuth} from '../../contexts/AuthContext';
import {useToast} from '../../contexts/ToastContext';
import {getAddresses} from '../../services/address';
import {API_BASE_URL} from '../../services/api';
import MainLayout from '../../components/MainLayout';

const CartScreen = ({navigation}) => {
  const {cart, loading, updateQuantity, updateInstructions, removeItem, applyCoupon, removeCoupon, fetchCart} = useCart();
  const {isAuthenticated} = useAuth();
  const {showToast} = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({});
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) {
        loadAddresses();
      }
    }, [isAuthenticated])
  );

  const loadAddresses = async () => {
    try {
      const data = await getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCart();
    await loadAddresses();
    setRefreshing(false);
  };

  const handleQuantityChange = async (juiceId, newQuantity) => {
    const result = await updateQuantity(juiceId, newQuantity);
    if (!result.success) {
      showToast(result.message || 'Failed to update quantity', 'error');
    }
  };

  const handleRemoveItem = juiceId => {
    setDialogConfig({
      title: 'Remove Item',
      message: 'Remove this item from cart?',
      type: 'confirm',
      showCancel: true,
      confirmText: 'Remove',
      onConfirm: async () => {
        const result = await removeItem(juiceId);
        if (!result.success) {
          showToast('Failed to remove item', 'error');
        }
      },
    });
    setDialogVisible(true);
  };

  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim()) {
      showToast('Please enter a coupon code', 'error');
      return;
    }

    setApplyingCoupon(true);
    const result = await applyCoupon(couponCode);
    setApplyingCoupon(false);

    if (result.success) {
      showToast(result.message || 'Coupon applied!', 'success');
      setCouponCode('');
    } else {
      showToast(result.message, 'error');
    }
  }, [couponCode, applyCoupon, showToast]);

  const handleRemoveCoupon = useCallback(async () => {
    const result = await removeCoupon();
    if (result.success) {
      showToast('Coupon removed', 'success');
    }
  }, [removeCoupon, showToast]);

  const handleCheckout = useCallback(() => {
    if (!isAuthenticated) {
      setDialogConfig({
        title: 'Login Required',
        message: 'Please login to proceed to checkout',
        type: 'info',
        showCancel: true,
        confirmText: 'Login',
        onConfirm: () => navigation.navigate('Login'),
      });
      setDialogVisible(true);
      return;
    }

    if (!addresses || addresses.length === 0) {
      setDialogConfig({
        title: 'No Address',
        message: 'Please add a delivery address before checkout',
        type: 'info',
        showCancel: true,
        confirmText: 'Add Address',
        onConfirm: () => navigation.navigate('Addresses'),
      });
      setDialogVisible(true);
      return;
    }

    navigation.navigate('Checkout');
  }, [isAuthenticated, addresses, navigation]);

  // Calculate bill values early (with fallbacks for when cart is null/empty)
  const foodSubtotal = Number(cart?.total_amount) || 0;
  const couponDiscount = Number(cart?.coupon_discount) || 0;
  const foodGST = Number(cart?.food_gst) || 0;
  const deliveryFee = Number(cart?.delivery_fee_base) || 0;
  const deliveryGST = Number(cart?.delivery_gst) || 0;
  const platformFee = Number(cart?.platform_fee) || 0;
  const grandTotal = Number(cart?.grand_total) || 0;

  const renderCartItem = ({item}) => {
    const imageUrl = item.juice_image
      ? item.juice_image.startsWith('http')
        ? item.juice_image
        : `${API_BASE_URL.replace('/api', '')}${item.juice_image}`
      : null;

    const subtotal = (Number(item.price_at_added) * item.quantity).toFixed(2);

    return (
      <View style={styles.cartItemCard}>
        <View style={styles.cartItemMainRow}>
          <Image
            source={{uri: imageUrl || 'https://via.placeholder.com/100'}}
            style={styles.productImage}
            resizeMode="cover"
          />

          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.juice_name}
            </Text>
            <Text style={styles.productPrice}>₹{Number(item.price_at_added).toFixed(2)} each</Text>

            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={[styles.quantityButton, item.quantity <= 1 && styles.quantityButtonDisabled]}
                onPress={() => handleQuantityChange(item.juice, 'decrement')}
                disabled={item.quantity <= 1}>
                <Icon name="remove" size={18} color={item.quantity <= 1 ? '#ccc' : '#1E1E1E'} />
              </TouchableOpacity>

              <Text style={styles.quantityText}>{item.quantity}</Text>

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(item.juice, 'increment')}>
                <Icon name="add" size={18} color="#1E1E1E" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.rightSection}>
            <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveItem(item.juice)}>
              <Icon name="trash-outline" size={20} color="#F44336" />
            </TouchableOpacity>

            <Text style={styles.subtotal}>₹{subtotal}</Text>
          </View>
        </View>

        {/* Cooking Instructions */}
        <View style={styles.instructionsContainer}>
          <CookingInstructionsInput
            value={item.cooking_instructions}
            onChange={() => {}} 
            onEndEditing={(text) => handleUpdateInstructions(item.juice, text)}
          />
        </View>
      </View>
    );
  };
  
  const handleUpdateInstructions = async (juiceId, text) => {
    // Only update if changes occurred (debounced via onEndEditing UI flow)
    const result = await updateInstructions(juiceId, text);
    if (!result.success) {
      showToast(result.message || 'Failed to update instructions', 'error');
    }
  };

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <Text style={styles.headerSubtext}>{cart.items.length} items</Text>
      </View>

      {/* Free Delivery Progress */}
      {!cart.free_delivery && foodSubtotal < 99 && (
        <View style={styles.freeDeliveryCard}>
          <View style={styles.freeDeliveryHeader}>
            <Text style={styles.freeDeliveryText}>
              Add ₹{(99 - foodSubtotal).toFixed(2)} for FREE delivery!
            </Text>
            <Icon name="bicycle" size={20} color="#2196F3" />
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {width: `${Math.min((foodSubtotal / 99) * 100, 100)}%`},
              ]}
            />
          </View>
        </View>
      )}
    </>
  );

  const renderFooter = () => (
    <View style={styles.footerContainer}>
      {/* Coupon Section */}
      <View style={styles.couponSection}>
        <View style={styles.sectionHeader}>
          <Icon name="pricetag" size={20} color="#FF6B35" />
          <Text style={styles.sectionTitle}>Apply Coupon</Text>
        </View>

        {cart.applied_coupon ? (
          <View style={styles.appliedCouponCard}>
            <View>
              <Text style={styles.appliedCouponCode}>{cart.applied_coupon.code}</Text>
              <Text style={styles.appliedCouponText}>Coupon applied successfully!</Text>
            </View>
            <TouchableOpacity onPress={handleRemoveCoupon}>
              <Text style={styles.removeCouponText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.couponInputContainer}>
            <TextInput
              style={styles.couponInput}
              value={couponCode}
              onChangeText={text => setCouponCode(text.toUpperCase())}
              placeholder="Enter coupon code"
              placeholderTextColor="#999"
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.applyButton, (!couponCode.trim() || applyingCoupon) && styles.applyButtonDisabled]}
              onPress={handleApplyCoupon}
              disabled={applyingCoupon || !couponCode.trim()}>
              <Text style={styles.applyButtonText}>{applyingCoupon ? 'Applying...' : 'Apply'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Bill Breakdown */}
      <View style={styles.billSection}>
        <View style={styles.sectionHeader}>
          <Icon name="receipt" size={20} color="#FF6B35" />
          <Text style={styles.sectionTitle}>Bill Details</Text>
        </View>

        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Food Subtotal</Text>
          <Text style={styles.billValue}>₹{foodSubtotal.toFixed(2)}</Text>
        </View>

        {couponDiscount > 0 && (
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, {color: '#4CAF50'}]}>Coupon Discount</Text>
            <Text style={[styles.billValue, {color: '#4CAF50'}]}>-₹{couponDiscount.toFixed(2)}</Text>
          </View>
        )}

        <View style={styles.billRow}>
          <Text style={styles.billLabel}>GST (5%)</Text>
          <Text style={styles.billValue}>₹{foodGST.toFixed(2)}</Text>
        </View>

        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Delivery Fee</Text>
          {cart.free_delivery ? (
            <View style={styles.freeDeliveryRow}>
              <Text style={styles.strikethrough}>₹{cart.original_delivery_fee}</Text>
              <Text style={styles.freeText}>FREE</Text>
            </View>
          ) : (
            <Text style={styles.billValue}>₹{deliveryFee.toFixed(2)}</Text>
          )}
        </View>

        {cart.free_delivery && (
          <View style={styles.freeBadge}>
            <Icon name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.freeBadgeText}>🎉 Free Delivery! (Orders above ₹99)</Text>
          </View>
        )}

        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Delivery GST (18%)</Text>
          <Text style={styles.billValue}>₹{deliveryGST.toFixed(2)}</Text>
        </View>

        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Platform Fee</Text>
          <Text style={styles.billValue}>₹{platformFee.toFixed(2)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
        </View>
      </View>

      {/* Address Warning */}
      {addresses.length === 0 && (
        <TouchableOpacity 
          style={styles.warningCard}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Addresses')}>
          <Icon name="warning" size={20} color="#FF9800" />
          <Text style={styles.warningText}>Add delivery address to proceed</Text>
          <Icon name="arrow-forward" size={20} color="#FF9800" />
        </TouchableOpacity>
      )}

      {/* Checkout Button */}
      <TouchableOpacity
        style={[styles.checkoutButton, addresses.length === 0 && styles.checkoutButtonDisabled]}
        onPress={handleCheckout}
        disabled={addresses.length === 0}>
        <Text style={styles.checkoutButtonText}>
          {addresses.length > 0 ? 'Proceed to Checkout' : 'Add Address to Checkout'}
        </Text>
        {addresses.length > 0 && <Icon name="arrow-forward" size={20} color="#fff" />}
      </TouchableOpacity>

      <View style={{height: 100}} />
    </View>
  );

  if (loading) {
    return (
      <MainLayout navigation={navigation}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={50} color="#FF6B35" strokeWidth={4} />
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      </MainLayout>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <MainLayout navigation={navigation}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Icon name="cart-outline" size={60} color="#FF6B35" />
          </View>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySubtext}>Add some delicious juices to get started!</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate('Menu')}>
            <Text style={styles.browseButtonText}>Browse Menu</Text>
            <Icon name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </MainLayout>
    );
  }


  return (
    <MainLayout navigation={navigation}>
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {renderHeader()}
        
        {cart.items.map(item => (
          <React.Fragment key={item.id.toString()}>
            {renderCartItem({item})}
          </React.Fragment>
        ))}
        
        {renderFooter()}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 4,
  },
  headerSubtext: {
    fontSize: 14,
    color: '#999',
  },
  freeDeliveryCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  freeDeliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  freeDeliveryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976D2',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#BBDEFB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
  cartItemCard: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cartItemMainRow: {
    flexDirection: 'row',
  },
  instructionsContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quantityButtonDisabled: {
    opacity: 0.3,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E1E1E',
    minWidth: 30,
    textAlign: 'center',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  removeButton: {
    padding: 6,
  },
  subtotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  footerContainer: {
    marginTop: 8,
  },
  couponSection: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  couponInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E1E1E',
    backgroundColor: '#F9F9F9',
  },
  applyButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#CCC',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  appliedCouponCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  appliedCouponCode: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  appliedCouponText: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  removeCouponText: {
    color: '#F44336',
    fontSize: 13,
    fontWeight: '600',
  },
  billSection: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  billLabel: {
    fontSize: 14,
    color: '#666',
  },
  billValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1E1E',
  },
  freeDeliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strikethrough: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  freeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  freeBadgeText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
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
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  warningText: {
    fontSize: 13,
    color: '#E65100',
    fontWeight: '600',
    flex: 1,
  },
  checkoutButton: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: '#1E1E1E',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    marginBottom: 16,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#CCC',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  browseButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CartScreen;

// Add CustomDialog component before the closing tag
// Note: Need to add <CustomDialog /> to the JSX return

