// Promotional Carousel Component
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH - 40;

const PromotionalCarousel = ({banners = [], onBannerPress}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef(null);

  // Default banners if none provided
  const defaultBanners = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1546548970-71785318a17b?w=800',
      title: 'Fresh Juice Offer',
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?w=800',
      title: 'Healthy Delights',
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800',
      title: 'Summer Special',
    },
  ];

  const displayBanners = banners.length > 0 ? banners : defaultBanners;

  // Auto-scroll effect
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex(current => {
        const nextIndex = (current + 1) % displayBanners.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * (CAROUSEL_ITEM_WIDTH + 16),
          animated: true,
        });
        return nextIndex;
      });
    }, 4000); // Change every 4 seconds

    return () => clearInterval(timer);
  }, [displayBanners.length]);

  const handleScroll = event => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (CAROUSEL_ITEM_WIDTH + 16));
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={CAROUSEL_ITEM_WIDTH + 16}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}>
        {displayBanners.map((banner, index) => (
          <TouchableOpacity
            key={banner.id || index}
            style={styles.bannerContainer}
            activeOpacity={0.9}
            onPress={() => onBannerPress?.(banner)}>
            <Image
              source={{uri: banner.image}}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.gradientOverlay} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {displayBanners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === activeIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  bannerContainer: {
    width: CAROUSEL_ITEM_WIDTH,
    height: 190,
    marginRight: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
  },
  paginationDotActive: {
    backgroundColor: '#FF6B35',
    width: 20,
  },
});

export default PromotionalCarousel;
