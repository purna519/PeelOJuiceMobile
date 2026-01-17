import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomDialog from '../../components/CustomDialog';
import {addAddress, updateAddress} from '../../services/address';
import MainLayout from '../../components/MainLayout';
import {validatePincode} from '../../utils/deliveryZones';
import DeliveryZoneIndicator from '../../components/DeliveryZoneIndicator';

const AddAddressScreen = ({route, navigation}) => {
  const {address} = route.params || {};
  const isEditing = !!address;

  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({});
  const [formData, setFormData] = useState({
    label: address?.label || '',
    full_name: address?.full_name || '',
    phone_number: address?.phone_number || '',
    address_line1: address?.address_line1 || '',
    address_line2: address?.address_line2 || '',
    city: address?.city || '',
    state: address?.state || '',
    pincode: address?.pincode || '',
    landmark: address?.landmark || '',
    is_default: address?.is_default || false,
  });

  const showError = (message) => {
    setDialogConfig({
      title: 'Error',
      message,
      type: 'error',
      confirmText: 'OK',
    });
    setDialogVisible(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.label.trim()) {
      showError('Please enter address label (e.g., Home, Office)');
      return;
    }
    if (!formData.full_name.trim()) {
      showError('Please enter full name');
      return;
    }
    if (!formData.phone_number.trim()) {
      showError('Please enter phone number');
      return;
    }
    if (formData.phone_number.length !== 10 || !/^\d+$/.test(formData.phone_number)) {
      showError('Please enter valid 10-digit phone number');
      return;
    }
    if (!formData.address_line1.trim()) {
      showError('Please enter address line 1');
      return;
    }
    if (!formData.city.trim()) {
      showError('Please enter city');
      return;
    }
    if (!formData.state.trim()) {
      showError('Please enter state');
      return;
    }
    if (!formData.pincode.trim()) {
      showError('Please enter pincode');
      return;
    }
    if (formData.pincode.length !== 6 || !/^\d+$/.test(formData.pincode)) {
      showError('Please enter valid 6-digit pincode');
      return;
    }
    
    // Check delivery zone
    const zoneValidation = validatePincode(formData.pincode);
    if (!zoneValidation.valid) {
      showError(zoneValidation.message || 'Sorry, we do not deliver to this pincode');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await updateAddress(address.id, formData);
        setDialogConfig({
          title: 'Success',
          message: 'Address updated successfully',
          type: 'success',
          confirmText: 'OK',
          onConfirm: () => navigation.goBack(),
        });
        setDialogVisible(true);
      } else {
        await addAddress(formData);
        setDialogConfig({
          title: 'Success',
          message: 'Address added successfully',
          type: 'success',
          confirmText: 'OK',
          onConfirm: () => navigation.goBack(),
        });
        setDialogVisible(true);
      }
    } catch (error) {
      console.error('Error saving address:', error);
      showError(error.response?.data?.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout navigation={navigation} title={isEditing ? 'Edit Address' : 'Add Address'}>
      <ScrollView style={styles.container}>
        <View style={styles.form}>
          {/* Label */}
          <Text style={styles.label}>Label * (e.g., Home, Office)</Text>
          <TextInput
            style={styles.input}
            value={formData.label}
            onChangeText={(text) => setFormData({...formData, label: text})}
            placeholder="Home"
          />

          {/* Full Name */}
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.full_name}
            onChangeText={(text) => setFormData({...formData, full_name: text})}
            placeholder="John Doe"
          />

          {/* Phone Number */}
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={formData.phone_number}
            onChangeText={(text) => setFormData({...formData, phone_number: text})}
            placeholder="10-digit phone number"
            keyboardType="phone-pad"
            maxLength={10}
          />

          {/* Address Line 1 */}
          <Text style={styles.label}>Address Line 1 *</Text>
          <TextInput
            style={styles.input}
            value={formData.address_line1}
            onChangeText={(text) => setFormData({...formData, address_line1: text})}
            placeholder="House/Flat No., Building Name"
            multiline
            numberOfLines={2}
          />

          {/* Address Line 2 */}
          <Text style={styles.label}>Address Line 2 (Optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.address_line2}
            onChangeText={(text) => setFormData({...formData, address_line2: text})}
            placeholder="Street, Area"
          />

          {/* Landmark */}
          <Text style={styles.label}>Landmark (Optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.landmark}
            onChangeText={(text) => setFormData({...formData, landmark: text})}
            placeholder="E.g., Near City Mall"
          />

          {/* City */}
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            value={formData.city}
            onChangeText={(text) => setFormData({...formData, city: text})}
            placeholder="Enter city"
          />

          {/* State */}
          <Text style={styles.label}>State *</Text>
          <TextInput
            style={styles.input}
            value={formData.state}
            onChangeText={(text) => setFormData({...formData, state: text})}
            placeholder="Enter state"
          />

          {/* Pincode */}
          <Text style={styles.label}>Pincode *</Text>
          <TextInput
            style={styles.input}
            value={formData.pincode}
            onChangeText={(text) => setFormData({...formData, pincode: text})}
            placeholder="Enter 6-digit pincode"
            keyboardType="numeric"
            maxLength={6}
          />
          
          {formData.pincode.length === 6 && (
            <View style={{marginTop: 8}}>
              <DeliveryZoneIndicator zoneInfo={validatePincode(formData.pincode)} />
              {!validatePincode(formData.pincode).valid && (
                <Text style={styles.errorText}>
                  {validatePincode(formData.pincode).message}
                </Text>
              )}
            </View>
          )}

          {/* Default Checkbox */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setFormData({...formData, is_default: !formData.is_default})}>
            <View style={[styles.checkbox, formData.is_default && styles.checkboxChecked]}>
              {formData.is_default && <Icon name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>Set as default address</Text>
          </TouchableOpacity>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Update Address' : 'Save Address'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
  form: {
    padding: 20,
    paddingBottom: 100,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    elevation: 2,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#F44336',
    fontSize: 13,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default AddAddressScreen;

