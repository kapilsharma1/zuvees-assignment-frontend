import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variant: { color: string; size: string }) => void;
  updateQuantity: (productId: string, variant: { color: string; size: string }, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: CartItem) => {
    setItems(currentItems => {
      const existingItemIndex = currentItems.findIndex(
        item => 
          item.product._id === newItem.product._id &&
          item.variant.color === newItem.variant.color &&
          item.variant.size === newItem.variant.size
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex].quantity += newItem.quantity;
        return updatedItems;
      }

      return [...currentItems, newItem];
    });
  };

  const removeItem = (productId: string, variant: { color: string; size: string }) => {
    setItems(currentItems =>
      currentItems.filter(
        item =>
          !(item.product._id === productId &&
            item.variant.color === variant.color &&
            item.variant.size === variant.size)
      )
    );
  };

  const updateQuantity = (productId: string, variant: { color: string; size: string }, quantity: number) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.product._id === productId &&
        item.variant.color === variant.color &&
        item.variant.size === variant.size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.variant.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 