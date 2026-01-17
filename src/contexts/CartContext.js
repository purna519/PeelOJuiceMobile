import React, {createContext, useState, useEffect, useContext, useRef} from 'react';
import {useAuth} from './AuthContext';
import {useBranch} from './BranchContext';
import * as cartAPI from '../services/cart';

const CartContext = createContext({});

export const CartProvider = ({children}) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const {isAuthenticated} = useAuth();
  const {selectedBranch} = useBranch();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart(null);
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [isAuthenticated]);

  const fetchCart = async () => {
    if (!isAuthenticated || !isMountedRef.current) return;
    
    setLoading(true);
    try {
      const cartData = await cartAPI.getCart();
      
      if (!isMountedRef.current) return; // Don't update state if unmounted
      
      // Auto-cleanup: If cart is empty but has a coupon applied, remove it
      if ((!cartData.items || cartData.items.length === 0) && cartData.applied_coupon) {
        try {
          await cartAPI.removeCoupon();
          // Fetch again to get clean cart without coupon
          const cleanCart = await cartAPI.getCart();
          if (isMountedRef.current) {
            setCart(cleanCart);
          }
        } catch (err) {
          // If coupon removal fails (e.g., 400 error), just use cart as-is
          console.log('Auto-coupon removal failed (non-critical)');
          if (isMountedRef.current) {
            setCart(cartData);
          }
        }
      } else {
        if (isMountedRef.current) {
          setCart(cartData);
        }
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      if (isMountedRef.current) {
        setCart(null);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Get the branch ID from which cart items were added
  const getCartBranch = () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      return null;
    }
    // Return the currently selected branch when cart has items
    // This assumes all items are from the same branch
    return selectedBranch;
  };

  // Check if branch switching is allowed
  const canSwitchBranch = () => {
    return !cart || !cart.items || cart.items.length === 0;
  };

  const addToCart = async (juiceId, quantity = 1) => {
    if (!isAuthenticated) {
      return {success: false, message: 'Please login first'};
    }

    try {
      // Optimistic update - add item immediately to cart state
      if (cart && cart.items) {
        const existingItemIndex = cart.items.findIndex(item => item.juice === juiceId);
        let updatedItems;
        
        if (existingItemIndex >= 0) {
          // Item exists, update quantity
          updatedItems = [...cart.items];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + quantity
          };
        } else {
          // New item, add to cart (we'll get full details from fetchCart)
          updatedItems = [...cart.items, {juice: juiceId, quantity}];
        }
        
        // Update cart immediately for instant badge update
        if (isMountedRef.current) {
          setCart({...cart, items: updatedItems});
        }
      }
      
      // API call and full refresh in background
      await cartAPI.addToCart(juiceId, quantity);
      await fetchCart(); // Get accurate cart data
      return {success: true};
    } catch (error) {
      console.error('Error adding to cart:', error);
      
      // Revert optimistic update on error
      await fetchCart();
      
      // Provide user-friendly error messages
      let message = 'Failed to add to cart';
      if (error.isTimeout) {
        message = 'Request timed out. Please try again.';
      } else if (error.isNetworkError) {
        message = 'Network error. Please check your connection.';
      } else if (error.isSessionExpired) {
        message = error.message; // "Your session has expired..."
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      }
      
      return {success: false, message};
    }
  };

  const updateQuantity = async (juiceId, action) => {
    if (!isAuthenticated) return {success: false};

    try {
      await cartAPI.updateCartItem(juiceId, action);
      await fetchCart();
      return {success: true};
    } catch (error) {
      console.error('Error updating cart:', error);
      
      let message = 'Failed to update cart';
      if (error.isTimeout) message = 'Request timed out. Please try again.';
      else if (error.isNetworkError) message = 'Network error. Please check your connection.';
      else if (error.isSessionExpired) message = error.message;
      else if (error.response?.data?.error) message = error.response.data.error;
      
      return {success: false, message};
    }
  };

  const updateInstructions = async (juiceId, instructions) => {
    if (!isAuthenticated) return {success: false};

    try {
      // Optimistic update
      if (cart && cart.items) {
        const itemIndex = cart.items.findIndex(item => item.juice === juiceId);
        if (itemIndex >= 0 && isMountedRef.current) {
          const updatedItems = [...cart.items];
          updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            cooking_instructions: instructions
          };
          setCart({...cart, items: updatedItems});
        }
      }

      await cartAPI.updateCartItemInstructions(juiceId, instructions);
      // We don't strictly need to fetchCart here if we trust the optimistic update
      // but let's do it to be safe or maybe debounce it in the UI
      return {success: true};
    } catch (error) {
      console.error('Error updating instructions:', error);
      await fetchCart(); // Revert on error
      
      let message = 'Failed to update instructions';
      if (error.isTimeout) message = 'Request timed out. Please try again.';
      else if (error.isNetworkError) message = 'Network error. Please check your connection.';
      else if (error.response?.data?.message) message = error.response.data.message;
      
      return {success: false, message};
    }
  };

  const removeItem = async juiceId => {
    if (!isAuthenticated) return {success: false};

    try {
      await cartAPI.removeFromCart(juiceId);
      await fetchCart();
      return {success: true};
    } catch (error) {
      console.error('Error removing from cart:', error);
      return {success: false};
    }
  };

  const applyCoupon = async code => {
    if (!isAuthenticated) return {success: false};

    try {
      const result = await cartAPI.applyCoupon(code);
      await fetchCart();
      return {success: true, message: result.message};
    } catch (error) {
      console.error('Error applying coupon:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to apply coupon',
      };
    }
  };

  const removeCoupon = async () => {
    if (!isAuthenticated) return {success: false};

    try {
      await cartAPI.removeCoupon();
      await fetchCart();
      return {success: true};
    } catch (error) {
      console.error('Error removing coupon:', error);
      return {success: false};
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return {success: false};

    try {
      // Backend automatically clears cart on order placement
      // Just refetch to get the empty cart
      await fetchCart();
      return {success: true};
    } catch (error) {
      console.error('Error refreshing cart:', error);
      // Even if fetch fails, return success since cart was cleared on backend
      return {success: true};
    }
  };

  const getCartItemCount = () => {
    if (!cart || !cart.items) return 0;
    // Return number of unique items, not total quantity
    return cart.items.length;
  };

  const getCartTotal = () => {
    if (!cart) return 0;
    return Number(cart.grand_total) || 0;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateQuantity,
        updateInstructions,
        removeItem,
        applyCoupon,
        removeCoupon,
        clearCart,
        fetchCart,
        getCartItemCount,
        getCartTotal,
        getCartBranch,
        canSwitchBranch,
      }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
