import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';

const BrandLogo = ({showTagline = true, size = 'large'}) => {
  const isLarge = size === 'large';
  
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Image
          source={require('../assets/logo.png')}
          style={[styles.logoImage, isLarge ? styles.logoLarge : styles.logoSmall]}
          resizeMode="contain"
        />
        <View style={styles.brandTextContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.titlePeel, isLarge ? styles.textLarge : styles.textSmall]}>
              Peel
            </Text>
            <Text style={[styles.titleO, isLarge ? styles.textLarge : styles.textSmall]}>
              'O'
            </Text>
            <Text style={[styles.titleJuice, isLarge ? styles.textLarge : styles.textSmall]}>
              Juice
            </Text>
          </View>
          {showTagline && (
            <Text style={[styles.subtitle, isLarge ? styles.subtitleLarge : styles.subtitleSmall]}>
              Sip Fresh.... Feel Refresh
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 0,
  },
  logoImage: {
    marginRight: -4,
  },
  logoLarge: {
    width: 70,
    height: 70,
  },
  logoSmall: {
    width: 40,
    height: 40,
  },
  brandTextContainer: {
    marginTop: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titlePeel: {
    fontWeight: 'bold',
    color: '#4A1E6D',
  },
  titleO: {
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  titleJuice: {
    fontWeight: 'bold',
    color: '#6B9E3E',
  },
  textLarge: {
    fontSize: 42,
  },
  textSmall: {
    fontSize: 24,
  },
  subtitle: {
    color: '#666',
    fontWeight: '500',
  },
  subtitleLarge: {
    fontSize: 14,
    marginLeft: 78,
    marginTop: -4,
  },
  subtitleSmall: {
    fontSize: 10,
    marginLeft: 45,
    marginTop: -2,
  },
});

export default BrandLogo;
