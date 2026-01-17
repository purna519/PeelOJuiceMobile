import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomDialog from '../../components/CustomDialog';
import {useCart} from '../../contexts/CartContext';
import {useAuth} from '../../contexts/AuthContext';
import {useToast} from '../../contexts/ToastContext'; // Added useToast import
import {getJuiceDetail} from '../../services/products';
import {API_BASE_URL} from '../../services/api';
import MainLayout from '../../components/MainLayout';

const ProductDetailScreen = ({route, navigation}) => {
  const {product: initialProduct} = route.params || {};
  const {addToCart} = useCart();
  const {isAuthenticated} = useAuth();
  const {showToast} = useToast(); // Initialized useToast
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('nutrition');
  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({});

  useEffect(() => {
    fetchProductDetails();
  }, [initialProduct?.id]);

  const fetchProductDetails = async () => {
    if (initialProduct?.id) {
      setLoading(true);
      try {
        const fullProduct = await getJuiceDetail(initialProduct.id);
        console.log('Product fetched:', fullProduct);
        setProduct(fullProduct);
      } catch (error) {
        console.error('Error fetching product details:', error);
        showToast('Failed to load product details', 'error'); // Replaced Alert with showToast
      } finally {
        setLoading(false);
      }
    }
  };

  if (!product) {
    return (
      <View style={styles.container}>
        <Text>Product not found</Text>
      </View>
    );
  }

  const pricePerMl = (product.price / (product.net_quantity_ml || 300)).toFixed(2);

  // Construct image URL
  const imageUrl = product.image
    ? product.image.startsWith('http')
      ? product.image
      : `${API_BASE_URL.replace('/api', '')}${product.image}`
    : null;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setDialogConfig({
        title: 'Login Required',
        message: 'Please login to add items to cart',
        type: 'info',
        showCancel: true,
        confirmText: 'Login',
        onConfirm: () => navigation.navigate('Login'),
      });
      setDialogVisible(true);
      return;
    }

    const result = await addToCart(product.id, quantity);
    if (result.success) {
      showToast(`Added ${quantity} ${product.name} to cart!`, 'success'); // Replaced Alert with showToast
      // Optionally, you could still offer navigation options via a custom modal or another toast with actions
      // For now, just showing a success toast.
    } else {
      showToast(result.message || 'Failed to add to cart', 'error'); // Replaced Alert with showToast
    }
  };

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  if (loading) {
    return (
      <MainLayout navigation={navigation}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={50} color="#FF6B35" />
          <Text style={styles.loadingText}>Loading product details...</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout navigation={navigation}>
      <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 100}}>
        {/* Premium Image Card */}
        <View style={styles.imageCard}>
          <Image
            source={{uri: imageUrl || 'https://via.placeholder.com/400'}}
            style={styles.productImage}
            resizeMode="cover"
          />
          
          {/* Floating Category Badge */}
          {product.category && (
            <View style={styles.floatingCategoryBadge}>
              <Icon name="leaf" size={14} color="#4CAF50" />
              <Text style={styles.floatingCategoryText}>{product.category.name}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Product Name */}
          <Text style={styles.name}>{product.name}</Text>

          {/* Description */}
          {product.long_description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>
                {showFullDescription
                  ? product.long_description
                  : `${product.long_description
                      .split(' ')
                      .slice(0, 35)
                      .join(' ')}${product.long_description.split(' ').length > 35 ? '...' : ''}`}
              </Text>
              {product.long_description.split(' ').length > 35 && (
                <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
                  <Text style={styles.readMoreText}>
                    {showFullDescription ? 'Read Less' : 'Read More'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Net Quantity */}
          <View style={styles.infoCard}>
            <Icon name="water-outline" size={20} color="#FF6B35" />
            <Text style={styles.infoText}>
              Net Qty: <Text style={styles.infoBold}>{product.net_quantity_ml || 300} ml</Text>
              <Text style={styles.infoSubtext}> (₹{pricePerMl}/ml)</Text>
            </Text>
          </View>

          {/* Premium Price Section */}
          <View style={styles.premiumPriceCard}>
            <View style={styles.priceHeader}>
              <View>
                <Text style={styles.priceLabel}>Price</Text>
                <View style={styles.priceMainRow}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <Text style={styles.price}>{product.price}</Text>
                </View>
                <Text style={styles.taxText}>Inclusive of all taxes</Text>
              </View>
              <View style={styles.savingsBadge}>
                <Icon name="pricetag" size={16} color="#4CAF50" />
                <Text style={styles.savingsText}>Best Price</Text>
              </View>
            </View>
          </View>

          {/* Premium Quantity Selector */}
          <View style={styles.premiumQuantityCard}>
            <View style={styles.quantityHeader}>
              <Icon name="layers-outline" size={20} color="#FF6B35" />
              <Text style={styles.quantityLabel}>Select Quantity</Text>
            </View>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                onPress={decreaseQuantity}
                disabled={quantity === 1}
                style={[styles.premiumQtyButton, styles.qtyMinus, quantity === 1 && styles.qtyButtonDisabled]}>
                <Icon name="remove" size={20} color={quantity === 1 ? '#ccc' : '#FF6B35'} />
              </TouchableOpacity>
              <View style={styles.quantityDisplay}>
                <Text style={styles.quantityText}>{quantity}</Text>
                <Text style={styles.quantityUnit}>item{quantity > 1 ? 's' : ''}</Text>
              </View>
              <TouchableOpacity onPress={increaseQuantity} style={[styles.premiumQtyButton, styles.qtyPlus]}>
                <Icon name="add" size={20} color="#FF6B35" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Moved to sticky bottom bar - removed from here */}

          {/* Feature Badges */}
          {product.features && product.features.length > 0 && (
            <View style={styles.featuresSection}>
              {product.features.map((feature, index) => (
                <View key={index} style={styles.featureBadge}>
                  <Icon name="checkmark-circle" size={14} color="#4CAF50" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Benefits */}
          {product.benefits && product.benefits.length > 0 && (
            <View style={styles.benefitsSection}>
              <Text style={styles.sectionTitle}>Juice Benefits</Text>
              {product.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitCard}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitDesc}>{benefit.description}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Nutrition Facts Header */}
          <View style={styles.nutritionHeader}>
            <Icon name="nutrition-outline" size={24} color="#FF6B35" />
            <Text style={styles.nutritionHeaderText}>Product Information</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabsSection}>
            <View style={styles.tabHeader}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'nutrition' && styles.tabActive]}
                onPress={() => setActiveTab('nutrition')}>
                <Icon
                  name="nutrition-outline"
                  size={18}
                  color={activeTab === 'nutrition' ? '#FF6B35' : '#999'}
                />
                <Text style={[styles.tabText, activeTab === 'nutrition' && styles.tabTextActive]}>
                  Nutrition
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'ingredients' && styles.tabActive]}
                onPress={() => setActiveTab('ingredients')}>
                <Icon
                  name="leaf-outline"
                  size={18}
                  color={activeTab === 'ingredients' ? '#FF6B35' : '#999'}
                />
                <Text style={[styles.tabText, activeTab === 'ingredients' && styles.tabTextActive]}>
                  Ingredients
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'allergens' && styles.tabActive]}
                onPress={() => setActiveTab('allergens')}>
                <Icon
                  name="alert-circle-outline"
                  size={18}
                  color={activeTab === 'allergens' ? '#FF6B35' : '#999'}
                />
                <Text style={[styles.tabText, activeTab === 'allergens' && styles.tabTextActive]}>
                  Allergens
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <View style={styles.tabContent}>
              {activeTab === 'nutrition' && (
                <View>
                  <View style={styles.nutritionTitle}>
                    <Text style={styles.nutritionTitleText}>Nutrition Facts Per 200ml*</Text>
                  </View>
                  <View style={styles.nutritionTable}>
                    <View style={styles.nutritionRow}>
                      <Text style={styles.nutritionLabel}>Calories</Text>
                      <Text style={styles.nutritionValue}>{product.nutrition_calories || '0'}kcal</Text>
                    </View>
                    <View style={styles.nutritionRow}>
                      <Text style={styles.nutritionLabel}>Total Fat</Text>
                      <Text style={styles.nutritionValue}>{product.nutrition_total_fat || '0'}g</Text>
                    </View>
                    <View style={styles.nutritionRow}>
                      <Text style={styles.nutritionLabel}>Carbohydrate</Text>
                      <Text style={styles.nutritionValue}>{product.nutrition_carbohydrate || '0' }g</Text>
                    </View>
                    <View style={styles.nutritionRow}>
                      <Text style={styles.nutritionLabel}>Dietary Fiber</Text>
                      <Text style={styles.nutritionValue}>{product.nutrition_dietary_fiber || '0'}g</Text>
                    </View>
                    <View style={styles.nutritionRow}>
                      <Text style={styles.nutritionLabel}>Total Sugars</Text>
                      <Text style={styles.nutritionValue}>{product.nutrition_total_sugars || '0'}g</Text>
                    </View>
                    <View style={[styles.nutritionRow, styles.nutritionRowLast]}>
                      <Text style={styles.nutritionLabel}>Protein</Text>
                      <Text style={styles.nutritionValue}>{product.nutrition_protein || '0'}g</Text>
                    </View>
                  </View>
                  <Text style={styles.nutritionNote}>* Approximate Values</Text>
                </View>
              )}

              {activeTab === 'ingredients' && (
                <View style={styles.infoCard}>
                  <Icon name="leaf-outline" size={20} color="#FF6B35" />
                  <Text style={styles.tabContentText}>
                    {product.ingredients || 'No ingredient information available.'}
                  </Text>
                </View>
              )}

              {activeTab === 'allergens' && (
                <View style={styles.infoCard}>
                  <Icon name="alert-circle-outline" size={20} color="#FF6B35" />
                  <Text style={styles.tabContentText}>
                    {product.allergen_info || 'No allergen information available.'}
                  </Text>
                </View>
              )}
            </View>
          </View>

        </View>
      </ScrollView>
      
      {/* Sticky Bottom Bar */}
      {product.is_available ? (
        <View style={styles.stickyBottomBar}>
          <View style={styles.bottomPriceInfo}>
            <Text style={styles.bottomPriceLabel}>Total Price</Text>
            <Text style={styles.bottomPrice}>₹{(product.price * quantity).toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.stickyAddButton} onPress={handleAddToCart}>
            <Icon name="cart" size={20} color="#fff" />
            <Text style={styles.stickyAddButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.stickyBottomBar}>
          <View style={styles.outOfStockBar}>
            <Icon name="alert-circle" size={20} color="#F44336" />
            <Text style={styles.outOfStockText}>Currently Out of Stock</Text>
          </View>
        </View>
      )}
      
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  imageCard: {
    margin: 16,
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  productImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#fff',
  },
  floatingCategoryBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    gap: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  floatingCategoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
    textTransform: 'uppercase',
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 12,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 21,
    marginBottom: 8,
  },
  readMoreText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    gap: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  infoBold: {
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  infoSubtext: {
    color: '#999',
    fontSize: 12,
  },
  premiumPriceCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceMainRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 6,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginRight: 4,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  taxText: {
    fontSize: 12,
    color: '#999',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4CAF50',
  },
  premiumQuantityCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  quantityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumQtyButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FF6B35',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  qtyMinus: {
    backgroundColor: '#FFF',
  },
  qtyPlus: {
    backgroundColor: '#FFF',
  },
  qtyButtonDisabled: {
    opacity: 0.4,
    borderColor: '#CCC',
  },
  quantityDisplay: {
    alignItems: 'center',
    minWidth: 80,
  },
  quantityText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  quantityUnit: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    gap: 16,
  },
  bottomPriceInfo: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  bottomPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  stickyAddButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  stickyAddButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  outOfStockBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  outOfStockText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
  },

  featuresSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
  },
  featureText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600',
  },
  benefitsSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 16,
  },
  benefitCard: {
    backgroundColor: '#F9F9F9',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E1E1E',
    marginBottom: 6,
  },
  benefitDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B35',
  },
  nutritionHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  tabsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 20,
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#FF6B35',
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#FF6B35',
  },
  tabContent: {
    padding: 16,
  },
  nutritionTitle: {
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  nutritionTitleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  nutritionTable: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  nutritionRowLast: {
    borderBottomWidth: 0,
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#666',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  nutritionNote: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  tabContentText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});

export default ProductDetailScreen;

