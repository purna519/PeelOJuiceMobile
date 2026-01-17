import React, {useState, useEffect, useMemo, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {getJuices, getCategories} from '../../services/products';
import {getBranches, getBranchProducts} from '../../services/branches';
import {useCart} from '../../contexts/CartContext';
import {useAuth} from '../../contexts/AuthContext';
import {useToast} from '../../contexts/ToastContext';
import {useBranch} from '../../contexts/BranchContext';
import {useNotification} from '../../contexts/NotificationContext';
import {API_BASE_URL} from '../../services/api';
import MainLayout from '../../components/MainLayout';
import SkeletonLoader from '../../components/SkeletonLoader';

// Muted colors for categories
const getCategoryColor = categoryName => {
  const colors = {
    'Citrus Juices': '#FFF9F0', // Muted Cream
    'Vegetable Juices': '#F0FFF4', // Muted Mint
    'Berry Juices': '#FFF5F8', // Muted Rose
    'Tropical Juices': '#FFF9E5', // Muted Gold
    'Green Juices': '#F4FFF0', // Muted Lime
    'Root Juices': '#F9F5F0', // Muted Sand
    'Mixed Fruit': '#FFF0F0', // Muted Coral
  };
  return colors[categoryName] || '#F9F9F9';
};

const MenuScreen = ({navigation}) => {
  const [juices, setJuices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sectionListRef = useRef(null);
  const initialCategoryOrderRef = useRef(null);

  const {addToCart, getCartBranch, canSwitchBranch, getCartItemCount} = useCart();
  const {isAuthenticated} = useAuth();
  const {branches, selectedBranch, selectBranch, setBranches} = useBranch();
  const {showToast} = useToast();
  const {showNotification} = useNotification();

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchData();
    }
  }, [selectedBranch, selectedCategory]);

  const loadBranches = async () => {
    try {
      const data = await getBranches();
      setBranches(data);
      
      // Auto-select first branch if none selected
      if (!selectedBranch && data.length > 0) {
        await selectBranch(data[0]);
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const fetchData = async (pageNumber = 1, append = false) => {
    try {
      if (!append) {
        setFetchingProducts(true);
      } else {
        setLoadingMore(true);
      }
      
      const [categoriesData] = await Promise.all([
        getCategories(),
      ]);
      setCategories(categoriesData);
      
      // Fetch products for selected branch with pagination
      if (selectedBranch) {
        const response = await getBranchProducts(
          selectedBranch.id,
          selectedCategory,
          pageNumber,
          20 // page_size
        );
        
        // Response format: {count, next, previous, results}
        const productsData = response.results || [];
        const hasNextPage = !!response.next;
        
        if (append) {
          setJuices(prev => [...prev, ...productsData]);
        } else {
          setJuices(productsData);
        }
        
        setHasMore(hasNextPage);
        setPage(pageNumber);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setFetchingProducts(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchData(1, false);
  };

  const loadMoreProducts = () => {
    if (!loadingMore && hasMore && !fetchingProducts && !refreshing) {
      fetchData(page + 1, true);
    }
  };



  const handleBranchSelect = async branch => {
    // Check if branch switching is allowed
    if (!canSwitchBranch()) {
      const cartBranch = getCartBranch();
      showNotification(
        'Switch Branch?',
        'Changing branch will clear your current cart. Do you want to proceed?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Clear & Switch',
            style: 'destructive',
            onPress: () => {
              // Logic to clear cart and switch would go here if implemented in context
              selectBranch(branch);
              setShowBranchModal(false);
            },
          },
        ],
      );
      return;
    }
    await selectBranch(branch);
    setShowBranchModal(false);
  };

  const handleAddToCart = juice => {
    if (!isAuthenticated) {
      showNotification('Login Required', 'Please login to add items to your cart', [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Login', onPress: () => navigation.navigate('Login')},
      ]);
      return;
    }

    addToCart(juice.id, 1);
    showToast(`${juice.name} added to cart!`, 'success');
  };

  // Filter products by search query
  const filteredJuices = juices.filter(juice =>
    juice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    juice.category?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    juice.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group products by category for SectionList and chunk into rows of 2
  const groupedProducts = useMemo(() => {
    const grouped = {};
    filteredJuices.forEach(juice => {
      const categoryName = juice.category?.name || 'Other';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(juice);
    });
    
    return Object.keys(grouped).map(categoryName => {
      const items = grouped[categoryName];
      // Chunk items into rows of 2
      const rows = [];
      for (let i = 0; i < items.length; i += 2) {
        rows.push(items.slice(i, i + 2));
      }
      return {
        title: categoryName,
        data: rows,
      };
    });
  }, [filteredJuices]);

  // Sort categories based on initial product order
  const sortedCategories = useMemo(() => {
    // On first render with products, capture the initial order
    if (!selectedCategory && groupedProducts.length > 0 && !initialCategoryOrderRef.current) {
      const order = new Map();
      groupedProducts.forEach((section, index) => {
        order.set(section.title, index);
      });
      initialCategoryOrderRef.current = order;
    }
    
    // Wait until we have the initial order
    if (!initialCategoryOrderRef.current) {
      return categories;
    }
    
    // Sort categories based on the initial order we captured
    return [...categories].sort((a, b) => {
      const orderA = initialCategoryOrderRef.current.get(a.name);
      const orderB = initialCategoryOrderRef.current.get(b.name);
      
      // If both categories have products, sort by appearance order
      if (orderA !== undefined && orderB !== undefined) {
        return orderA - orderB;
      }
      // Categories without products go to the end
      if (orderA === undefined) return 1;
      if (orderB === undefined) return -1;
      return 0;
    });
  }, [categories, groupedProducts, selectedCategory]);

  const renderCategoryItem = ({item}) => {
    const isActive = selectedCategory === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.categoryChip,
          isActive && styles.categoryChipActive,
        ]}
        onPress={() => {
          const newCategory = selectedCategory === item.id ? null : item.id;
          setSelectedCategory(newCategory);
          setPage(1);
          setHasMore(true);
          setJuices([]); // Clear current products
          // fetchData will be triggered by useEffect watching selectedCategory
        }}>
        <Text
          style={[
            styles.categoryText,
            isActive && styles.categoryTextActive,
          ]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderJuiceItem = ({item}) => {
    const categoryColor = getCategoryColor(item.category?.name);
    const imageUrl = item.image
      ? item.image.startsWith('http')
        ? item.image
        : `${API_BASE_URL.replace('/api', '')}${item.image}`
      : null;

    return (
      <TouchableOpacity
        style={styles.juiceCard}
        onPress={() => navigation.navigate('ProductDetail', {product: item})}>
        <Image
          source={{uri: imageUrl || 'https://via.placeholder.com/200'}}
          style={styles.juiceImage}
          resizeMode="cover"
        />

        <View style={styles.juiceInfo}>
          <Text style={styles.juiceName} numberOfLines={1}>
            {item.name}
          </Text>

          <View
            style={[styles.categoryBadge, {backgroundColor: categoryColor}]}>
            <Text style={styles.categoryBadgeText}>
              {item.category?.name || 'Juice'}
            </Text>
          </View>

          {item.description && (
            <Text style={styles.juiceDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.juicePrice}>₹{item.price}</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddToCart(item)}>
              <Icon name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Skeleton loader for product cards
  const renderSkeletonItem = () => (
    <View style={styles.juiceCard}>
      <SkeletonLoader width="100%" height={160} borderRadius={24} />
      <View style={styles.juiceInfo}>
        <SkeletonLoader width="80%" height={15} style={{marginBottom: 8}} />
        <SkeletonLoader width="40%" height={10} style={{marginBottom: 10}} />
        <View style={styles.priceRow}>
          <SkeletonLoader width={60} height={20} />
          <SkeletonLoader width={36} height={36} borderRadius={12} />
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <MainLayout navigation={navigation}>
        <View style={styles.branchSelector}>
          <SkeletonLoader width="60%" height={40} borderRadius={12} />
        </View>
        <View style={styles.categoriesContainer}>
          <View style={{flexDirection: 'row', gap: 10, paddingHorizontal: 16}}>
            {[1, 2, 3].map(i => (
              <SkeletonLoader key={i} width={100} height={36} borderRadius={20} />
            ))}
          </View>
        </View>
        <View style={styles.juicesList}>
          <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <View key={i} style={{width: '50%'}}>
                {renderSkeletonItem()}
              </View>
            ))}
          </View>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout navigation={navigation}>
      {/* Branch Selector Header */}
      <View style={styles.branchSelectorContainer}>
        <TouchableOpacity
          style={styles.branchSelector}
          onPress={() => setShowBranchModal(true)}>
          <View style={styles.branchInfo}>
            <Icon name="location" size={22} color="#FF6B35" />
            <View style={styles.branchTextContainer}>
              <Text style={styles.branchLabel}>Delivery from</Text>
              <Text style={styles.branchName}>
                {selectedBranch ? selectedBranch.name : 'Select Branch'}
              </Text>
            </View>
          </View>
          {!canSwitchBranch() ? (
            <Icon name="lock-closed" size={20} color="#FF6B35" />
          ) : (
            <Icon name="chevron-down" size={22} color="#333" />
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search juices, categories..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      {sortedCategories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <FlatList
            horizontal
            data={sortedCategories}
            renderItem={renderCategoryItem}
            keyExtractor={item => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
      )}

      {/* Products Grid */}
      <View style={{flex: 1}}>
        {fetchingProducts && page === 1 ? (
          // Show skeleton during initial load
          <View style={styles.juicesList}>
            <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <View key={i} style={{width: '50%'}}>
                  {renderSkeletonItem()}
                </View>
              ))}
            </View>
          </View>
        ) : groupedProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Icon name="restaurant-outline" size={50} color="#FF6B35" />
            </View>
            <Text style={styles.emptyText}>No products available</Text>
            <Text style={styles.emptySubtext}>
              at {selectedBranch?.name || 'this branch'}
            </Text>
          </View>
        ) : (
          <SectionList
            ref={sectionListRef}
            sections={groupedProducts}
            renderItem={({item: row}) => (
              <View style={styles.productRow}>
                {row.map((item, index) => (
                  <View key={item.id} style={{width: '50%'}}>
                    {renderJuiceItem({item})}
                  </View>
                ))}
                {row.length === 1 && <View style={{width: '50%'}} />}
              </View>
            )}
            renderSectionHeader={({section: {title}}) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <View style={styles.sectionUnderline} />
              </View>
            )}
            keyExtractor={(item, index) => 'row-' + index}
            contentContainerStyle={styles.juicesList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#FF6B35']}
              />
            }
            stickySectionHeadersEnabled={false}
            onEndReached={loadMoreProducts}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <View style={styles.loadingMoreContent}>
                    {[1, 2].map(i => (
                      <View key={i} style={{width: '50%'}}>
                        {renderSkeletonItem()}
                      </View>
                    ))}
                  </View>
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* Branch Selection Modal */}
      <Modal
        visible={showBranchModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBranchModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Branch</Text>
              <TouchableOpacity onPress={() => setShowBranchModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={branches}
              keyExtractor={item => item.id.toString()}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.branchItem,
                    selectedBranch?.id === item.id && styles.branchItemActive,
                  ]}
                  onPress={() => handleBranchSelect(item)}>
                  <Icon
                    name="location"
                    size={20}
                    color={
                      selectedBranch?.id === item.id ? '#FF6B35' : '#666'
                    }
                  />
                  <View style={styles.branchItemText}>
                    <Text
                      style={[
                        styles.branchItemName,
                        selectedBranch?.id === item.id &&
                          styles.branchItemNameActive,
                      ]}>
                      {item.name}
                    </Text>
                    <Text style={styles.branchItemCity}>
                      {item.city}, {item.state}
                    </Text>
                  </View>
                  {selectedBranch?.id === item.id && (
                    <Icon name="checkmark-circle" size={20} color="#FF6B35" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  branchSelectorContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 10,
  },
  branchSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  branchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  branchTextContainer: {
    flex: 1,
  },
  branchLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  branchName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    marginHorizontal: 24,
    marginVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 14,
    color: '#333',
  },
  categoriesContainer: {
    paddingVertical: 18,
    backgroundColor: '#fff',
  },
  categoriesList: {
    paddingHorizontal: 24,
  },
  categoryChip: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryChipActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#666',
    letterSpacing: -0.2,
  },
  categoryTextActive: {
    color: '#fff',
  },
  juicesList: {
    padding: 16,
    paddingBottom: 120,
    backgroundColor: '#fff',
  },
  juiceCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  juiceImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#fff',
  },
  juiceInfo: {
    padding: 16,
  },
  juiceName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 10,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  juiceDescription: {
    fontSize: 11,
    color: '#888',
    lineHeight: 18,
    marginBottom: 12,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  juicePrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FF6B35',
  },
  addButton: {
    backgroundColor: '#1E1E1E',
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#999',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 40,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -10},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 32,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  branchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 20,
    gap: 16,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  branchItemActive: {
    backgroundColor: '#FFF9F0',
    borderColor: '#FFE5B4',
  },
  branchItemText: {
    flex: 1,
  },
  branchItemName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  branchItemNameActive: {
    color: '#FF6B35',
  },
  branchItemCity: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  sectionUnderline: {
    height: 3,
    width: 40,
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  loadingMoreContainer: {
    paddingVertical: 20,
  },
  loadingMoreContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  productRow: {
    flexDirection: 'row',
    width: '100%',
  },
});

export default MenuScreen;

