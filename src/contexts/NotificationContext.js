import React, {createContext, useContext, useState} from 'react';
import {Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Pressable} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const {width} = Dimensions.get('window');

const NotificationContext = createContext({});

export const NotificationProvider = ({children}) => {
  const [notification, setNotification] = useState(null);

  const showNotification = (title, message, buttons = [{text: 'OK'}]) => {
    setNotification({title, message, buttons});
  };

  const hideNotification = () => {
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{showNotification}}>
      {children}
      {notification && (
        <Modal transparent visible animationType="fade" statusBarTranslucent>
          <View style={styles.overlay}>
            <Pressable style={styles.backdrop} onPress={hideNotification} />
            <View style={styles.card}>
              <View style={styles.iconContainer}>
                <View style={styles.iconBg}>
                  <Icon name="notifications-outline" size={32} color="#FF6B35" />
                </View>
              </View>

              <View style={styles.content}>
                <Text style={styles.title}>{notification.title}</Text>
                <Text style={styles.message}>{notification.message}</Text>
              </View>

              <View style={styles.buttonContainer}>
                {notification.buttons.map((button, index) => {
                  const isCancel = button.style === 'cancel';
                  const isDestructive = button.style === 'destructive';
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.8}
                      style={[
                        styles.button,
                        isCancel && styles.buttonCancel,
                        isDestructive && styles.buttonDestructive,
                        notification.buttons.length === 1 && styles.buttonFull,
                      ]}
                      onPress={() => {
                        hideNotification();
                        button.onPress?.();
                      }}>
                      <Text
                        style={[
                          styles.buttonText,
                          isCancel && styles.buttonTextCancel,
                          isDestructive && styles.buttonTextDestructive,
                        ]}>
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 45,
    paddingBottom: 28,
    width: '100%',
    maxWidth: width * 0.85,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 20},
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 20,
    position: 'relative',
  },
  iconContainer: {
    position: 'absolute',
    top: -35,
    backgroundColor: '#F9F9F9',
    padding: 10,
    borderRadius: 25,
  },
  iconBg: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  content: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonFull: {
    flex: 0,
    width: '100%',
  },
  buttonCancel: {
    backgroundColor: '#F5F5F5',
    shadowOpacity: 0.05,
    elevation: 0,
  },
  buttonDestructive: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  buttonTextCancel: {
    color: '#1A1A1A',
  },
  buttonTextDestructive: {
    color: '#FFFFFF',
  },
});
