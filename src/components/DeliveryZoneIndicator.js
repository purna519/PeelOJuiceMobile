import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {getZoneColor, formatDeliveryFee} from '../utils/deliveryZones';

const DeliveryZoneIndicator = ({zoneInfo}) => {
  if (!zoneInfo || !zoneInfo.valid) {
    return null;
  }

  const {zoneName, deliveryFee, deliveryTime, distance, zone} = zoneInfo;
  const zoneColor = getZoneColor(zone);

  return (
    <View style={[styles.container, {borderLeftColor: zoneColor}]}>
      <View style={styles.header}>
        <Icon name="location-on" size={20} color={zoneColor} />
        <Text style={[styles.zoneName, {color: zoneColor}]}>{zoneName}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Icon name="access-time" size={16} color="#666" />
          <Text style={styles.detailText}>{deliveryTime}</Text>
        </View>

        <View style={styles.detailItem}>
          <Icon name="straighten" size={16} color="#666" />
          <Text style={styles.detailText}>{distance}</Text>
        </View>

        <View style={styles.detailItem}>
          <Icon name="local-shipping" size={16} color="#666" />
          <Text style={[styles.detailText, styles.feeText]}>
            {formatDeliveryFee(deliveryFee)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  feeText: {
    fontWeight: '600',
    color: '#FF6B35',
  },
});

export default DeliveryZoneIndicator;
