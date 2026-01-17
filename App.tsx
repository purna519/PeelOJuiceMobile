import React, {useEffect} from 'react';
import 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StatusBar} from 'react-native';
import {AuthProvider} from './src/contexts/AuthContext';
import {CartProvider} from './src/contexts/CartContext';
import {BranchProvider} from './src/contexts/BranchContext';
import {ToastProvider} from './src/contexts/ToastContext';
import ErrorBoundary from './src/components/ErrorBoundary';

import {NotificationProvider} from './src/contexts/NotificationContext';

function App(): React.JSX.Element {
  useEffect(() => {
    // Global error handlers for improved crash prevention
    // Note: Promise rejections are logged but don't crash the app with ErrorBoundary

    // @ts-ignore - RN specific global error handler
    const originalHandler = global.ErrorUtils?.getGlobalHandler();
    
    // @ts-ignore
    global.ErrorUtils?.setGlobalHandler((error, isFatal) => {
      console.error('🚨 Global Error:', error, 'isFatal:', isFatal);
      // Call original handler
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });

    // Cleanup
    return () => {
      // @ts-ignore
      if (originalHandler) global.ErrorUtils?.setGlobalHandler(originalHandler);
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      <ErrorBoundary>
        <AuthProvider>
          <NotificationProvider>
            <BranchProvider>
              <CartProvider>
                <ToastProvider>
                  <NavigationContainer>
                    <AppNavigator />
                  </NavigationContainer>
                </ToastProvider>
              </CartProvider>
            </BranchProvider>
          </NotificationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default App;

