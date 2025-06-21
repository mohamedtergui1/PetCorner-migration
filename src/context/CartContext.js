// File: src/context/CartContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProductService from '../service/CustomProductApiService'; // ✅ Import your product service

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

  // ✅ Function to get current product stock
  const getProductStock = useCallback(async (productId) => {
    try {
      const product = await ProductService.getProductById(productId, {
        includestockdata: 1,
        includesubproducts: false,
        includeparentid: false,
        includetrans: false
      });
      
      return product?.stock_reel ? parseInt(product.stock_reel) : 0;
    } catch (error) {
      console.error('Error fetching product stock:', error);
      return 0; // Return 0 if we can't get stock info (safe default)
    }
  }, []);

  // ✅ Function to get current quantity of item in cart
  const getItemQuantityInCart = useCallback((productId, items = cartItems) => {
    return items.filter(item => item === productId).length;
  }, [cartItems]);

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

  // ✅ Enhanced add to cart with stock validation
  const addToCart = useCallback(async (productId) => {
    try {
      setIsLoading(true);
      
      // Get current cart items
      const existingItems = JSON.parse(await AsyncStorage.getItem('cartItems')) || [];
      
      // Check current quantity in cart
      const currentQuantityInCart = getItemQuantityInCart(productId, existingItems);
      
      // Get available stock for this product
      const availableStock = await getProductStock(productId);
      
      // ✅ Validate stock availability
      if (availableStock <= 0) {
        return { 
          success: false, 
          error: 'Ce produit est en rupture de stock' 
        };
      }
      
      if (currentQuantityInCart >= availableStock) {
        return { 
          success: false, 
          error: `Stock insuffisant. Seulement ${availableStock} article(s) disponible(s)` 
        };
      }
      
      // Add item to cart
      const updatedItems = [...existingItems, productId];
      
      await AsyncStorage.setItem('cartItems', JSON.stringify(updatedItems));
      setCartItems(updatedItems);
      setCartCount(updatedItems.length);
      
      // ✅ Return success with helpful info
      const newQuantityInCart = currentQuantityInCart + 1;
      const remainingStock = availableStock - newQuantityInCart;
      
      return { 
        success: true, 
        message: remainingStock > 0 
          ? `Produit ajouté! ${remainingStock} article(s) restant(s)` 
          : 'Produit ajouté! Stock épuisé'
      };
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      return { 
        success: false, 
        error: 'Erreur lors de l\'ajout au panier' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [getProductStock, getItemQuantityInCart]);

  // ✅ Enhanced update quantity with stock validation
  const updateQuantity = useCallback(async (id, change) => {
    try {
      setIsLoading(true);
      const itemArray = JSON.parse(await AsyncStorage.getItem('cartItems')) || [];
      
      // Count current quantity
      const currentQuantity = itemArray.filter(item => item === id).length;
      const newQuantity = currentQuantity + change;
      
      // If reducing quantity or removing, no stock check needed
      if (change < 0) {
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
      }
      
      // ✅ For increasing quantity, check stock
      if (change > 0) {
        const availableStock = await getProductStock(id);
        
        if (newQuantity > availableStock) {
          return { 
            success: false, 
            error: `Stock insuffisant. Seulement ${availableStock} article(s) disponible(s)` 
          };
        }
        
        let updatedArray = itemArray.filter(item => item !== id);
        
        // Add items back based on new quantity
        for (let i = 0; i < newQuantity; i++) {
          updatedArray.push(id);
        }
        
        await AsyncStorage.setItem('cartItems', JSON.stringify(updatedArray));
        setCartItems(updatedArray);
        setCartCount(updatedArray.length);
        
        return { success: true };
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('Failed to update cart quantity:', error);
      return { 
        success: false, 
        error: 'Erreur lors de la mise à jour' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [getProductStock]);

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

  // ✅ New helper function to check if more items can be added
  const canAddMoreItems = useCallback(async (productId) => {
    try {
      const currentQuantityInCart = getItemQuantityInCart(productId);
      const availableStock = await getProductStock(productId);
      
      return {
        canAdd: currentQuantityInCart < availableStock,
        currentInCart: currentQuantityInCart,
        availableStock: availableStock,
        remaining: Math.max(0, availableStock - currentQuantityInCart)
      };
    } catch (error) {
      console.error('Error checking stock availability:', error);
      return {
        canAdd: false,
        currentInCart: 0,
        availableStock: 0,
        remaining: 0
      };
    }
  }, [getItemQuantityInCart, getProductStock]);

  // ✅ Function to validate entire cart against current stock
  const validateCartStock = useCallback(async () => {
    try {
      const quantities = getQuantities();
      const invalidItems = [];
      
      for (const [productId, quantity] of Object.entries(quantities)) {
        const availableStock = await getProductStock(parseInt(productId));
        
        if (quantity > availableStock) {
          invalidItems.push({
            productId: parseInt(productId),
            requestedQuantity: quantity,
            availableStock: availableStock
          });
        }
      }
      
      return {
        isValid: invalidItems.length === 0,
        invalidItems: invalidItems
      };
      
    } catch (error) {
      console.error('Error validating cart stock:', error);
      return {
        isValid: false,
        invalidItems: []
      };
    }
  }, [getQuantities, getProductStock]);

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
    // ✅ New functions
    canAddMoreItems,
    validateCartStock,
    getItemQuantityInCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};