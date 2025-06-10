// File: src/context/CartContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Load cart items from AsyncStorage - maintains your structure
  const loadCartItems = useCallback(async () => {
    try {
      const items = JSON.parse(await AsyncStorage.getItem('cartItems')) || [];
      setCartItems(items);
      setCartCount(items.length);
      return items;
    } catch (error) {
      console.error('Failed to load cart items:', error);
      return [];
    }
  }, []);

  // Add item to cart - same logic as your current implementation
  const addToCart = useCallback(async (productId) => {
    try {
      setIsLoading(true);
      const existingItems = JSON.parse(await AsyncStorage.getItem('cartItems')) || [];
      const updatedItems = [...existingItems, productId];
      
      await AsyncStorage.setItem('cartItems', JSON.stringify(updatedItems));
      setCartItems(updatedItems);
      setCartCount(updatedItems.length);
      
      return { success: true };
    } catch (error) {
      console.error('Error adding to cart:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update quantity - maintains your current structure
  const updateQuantity = useCallback(async (id, change) => {
    try {
      setIsLoading(true);
      const itemArray = JSON.parse(await AsyncStorage.getItem('cartItems')) || [];
      
      // Count current quantity
      const currentQuantity = itemArray.filter(item => item === id).length;
      const newQuantity = currentQuantity + change;
      
      let updatedArray = itemArray.filter(item => item !== id);
      
      // Add items back based on new quantity
      if (newQuantity > 0) {
        for (let i = 0; i < newQuantity; i++) {
          updatedArray.push(id);
        }
      }
      
      await AsyncStorage.setItem('cartItems', JSON.stringify(updatedArray));
      setCartItems(updatedArray);
      setCartCount(updatedArray.length);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to update cart quantity:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Remove item from cart - maintains your current structure
  const removeFromCart = useCallback(async (productId) => {
    try {
      setIsLoading(true);
      const itemArray = JSON.parse(await AsyncStorage.getItem('cartItems')) || [];
      const updatedArray = itemArray.filter(item => item !== productId);
      
      await AsyncStorage.setItem('cartItems', JSON.stringify(updatedArray));
      setCartItems(updatedArray);
      setCartCount(updatedArray.length);
      
      return { success: true };
    } catch (error) {
      console.error('Error removing from cart:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear cart - for checkout
  const clearCart = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('cartItems');
      setCartItems([]);
      setCartCount(0);
      return { success: true };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { success: false, error };
    }
  }, []);

  // Get quantities object - maintains your current structure
  const getQuantities = useCallback(() => {
    const quantities = {};
    cartItems.forEach(id => {
      quantities[id] = quantities[id] ? quantities[id] + 1 : 1;
    });
    return quantities;
  }, [cartItems]);

  // Initialize cart on mount
  useEffect(() => {
    loadCartItems();
  }, [loadCartItems]);

  const value = {
    cartItems,
    cartCount,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    loadCartItems,
    getQuantities,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};