import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {getJuices} from '../../services/products';
import {useCart} from '../../contexts/CartContext';
import {useAuth} from '../../contexts/AuthContext';
import {useToast} from '../../contexts/ToastContext';
import {useNotification} from '../../contexts/NotificationContext';
import {API_BASE_URL} from '../../services/api';
import MainLayout from '../../components/MainLayout';
import SkeletonLoader from '../../components/SkeletonLoader';
import PromotionalCarousel from '../../components/PromotionalCarousel';
import GradientButton from '../../components/GradientButton';

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

const HomeScreen = ({navigation}) => {
  const [featuredJuices, setFeaturedJuices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const {addToCart} = useCart();
  const {isAuthenticated} = useAuth();
  const {showToast} = useToast();
  const {showNotification} = useNotification();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const juicesData = await getJuices();
      // Show only first 8 products as featured/top picks
      setFeaturedJuices(juicesData.slice(0, 8));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeaturedProducts();
  };

  const handleAddToCart = async juice => {
    if (!isAuthenticated) {
      showNotification(
        'Login Required',
        'Please login to add items to your cart',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Login', onPress: () => navigation.navigate('Login')},
        ]
      );
      return;
    }
    
    const result = await addToCart(juice.id, 1);
    if (result.success) {
      showToast(`${juice.name} added to cart!`, 'success');
    } else {
      showToast(result.message || 'Failed to add to cart', 'error');
    }
  };

  const handleBannerPress = banner => {
    // Navigate to offers or specific product
    console.log('Banner pressed:', banner);
  };

  const renderTopPickItem = ({item}) => {
    const categoryColor = getCategoryColor(item.category?.name);
    const imageUrl = item.image
      ? item.image.startsWith('http')
        ? item.image
        : `${API_BASE_URL.replace('/api', '')}${item.image}`
      : null;

    return (
      <TouchableOpacity
        style={styles.topPickCard}
        onPress={() => navigation.navigate('ProductDetail', {product: item})}>
        <Image
          source={{uri: imageUrl || 'https://via.placeholder.com/200'}}
          style={styles.topPickImage}
          resizeMode="cover"
        />
        <View style={styles.topPickInfo}>
          <Text style={styles.topPickName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={[styles.categoryBadge, {backgroundColor: categoryColor}]}>
            <Text style={styles.categoryBadgeText}>
              {item.category?.name || 'Juice'}
            </Text>
          </View>
          <View style={styles.topPickFooter}>
            <Text style={styles.topPickPrice}>₹{item.price}</Text>
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={e => {
                e.stopPropagation();
                handleAddToCart(item);
              }}>
              <Icon name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSkeletonItem = () => (
    <View style={styles.topPickCard}>
      <SkeletonLoader width="100%" height={120} borderRadius={24} />
      <View style={styles.topPickInfo}>
        <SkeletonLoader width="80%" height={15} style={{marginBottom: 8}} />
        <SkeletonLoader width="40%" height={10} style={{marginBottom: 8}} />
        <View style={styles.topPickFooter}>
          <SkeletonLoader width={60} height={20} />
          <SkeletonLoader width={34} height={34} borderRadius={17} />
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <MainLayout navigation={navigation}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Carousel Skeleton */}
          <SkeletonLoader width="90%" height={180} style={{marginHorizontal: 20, marginVertical: 12}} />
          
          {/* Section Title Skeleton */}
          <SkeletonLoader width={150} height={20} style={{marginHorizontal: 20, marginTop: 20}} />
          
          {/* Top Picks Skeleton */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{paddingHorizontal: 12}}>
            {[1, 2, 3].map(i => (
              <View key={i} style={{width: 160}}>
                {renderSkeletonItem()}
              </View>
            ))}
          </ScrollView>
        </ScrollView>
      </MainLayout>
    );
  }

  return (
    <MainLayout navigation={navigation}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B35']} />
        }>
        
        {/* Promotional Carousel */}
        <PromotionalCarousel onBannerPress={handleBannerPress} />

        {/* Top Picks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Icon name="star" size={24} color="#FF6B35" />
              <Text style={styles.sectionTitle}>Top Picks</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal Top Picks List */}
          <FlatList
            data={featuredJuices}
            renderItem={renderTopPickItem}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topPicksList}
          />
        </View>

        {/* Bottom Explore Menu Button */}
        <View style={styles.bottomExploreSection}>
          <Text style={styles.explorePrompt}>Want to see more?</Text>
          <GradientButton
            title="Explore Full Menu"
            onPress={() => navigation.navigate('Menu')}
            style={styles.bottomExploreButton}
          />
        </View>
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 40,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B35',
    letterSpacing: 0.5,
  },
  topPicksList: {
    paddingHorizontal: 16,
    paddingBottom: 25,
  },
  topPickCard: {
    width: 170,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  topPickImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#fff',
  },
  topPickInfo: {
    padding: 16,
  },
  topPickName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  topPickFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  topPickPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FF6B35',
  },
  quickAddButton: {
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
  bottomExploreSection: {
    paddingHorizontal: 24,
    paddingVertical: 60,
    paddingBottom: 140,
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    marginTop: 20,
  },
  explorePrompt: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  bottomExploreButton: {
    width: '100%',
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
});

export default HomeScreen;
