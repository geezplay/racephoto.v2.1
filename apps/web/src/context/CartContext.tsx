import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  photoId: number;
  cartItemId?: string | number;
  eventId?: number;
  variant: number;
  price: number;
  photoUrl: string;
  startNo: string;
  eventName: string;
  className?: string;
  recapCount?: number;
}

interface CartItemInput {
  id?: number | string;
  _id?: number | string;
  variant?: number;
  price?: number | string;
  url?: string;
  photoUrl?: string;
  startNo?: string;
  start_no?: string;
  eventName?: string;
  eventId?: { name?: string };
  class?: string;
  className?: string;
  recapCount?: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (itemOrPhoto: CartItemInput, variant?: number | null) => void;
  removeItem: (photoId: number, variant: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getCount: () => number;
  isInCart: (photoId: number, variant: number) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('racephoto_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart) as CartItem[]);
      } catch {
        setItems([]);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('racephoto_cart', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addItem = (itemOrPhoto: CartItemInput, variant: number | null = null) => {
    setItems((prev: CartItem[]) => {
      let newItem: CartItem;

      if (itemOrPhoto.id && itemOrPhoto.variant !== undefined) {
        newItem = {
          photoId: Number(itemOrPhoto.id),
          variant: itemOrPhoto.variant,
          price: parseFloat(String(itemOrPhoto.price)) || 0,
          photoUrl: itemOrPhoto.url || itemOrPhoto.photoUrl || '',
          startNo: itemOrPhoto.startNo || '',
          eventName: itemOrPhoto.eventName || 'Unknown Event',
          className: itemOrPhoto.className,
          recapCount: itemOrPhoto.recapCount || 1,
        };
      } else {
        newItem = {
          photoId: Number(itemOrPhoto._id || itemOrPhoto.id),
          variant: variant || 1,
          price: parseFloat(String(itemOrPhoto.price)) || 0,
          photoUrl: itemOrPhoto.url || itemOrPhoto.photoUrl || '',
          startNo: itemOrPhoto.startNo || itemOrPhoto.start_no || '',
          eventName: itemOrPhoto.eventId?.name || itemOrPhoto.eventName || 'Unknown Event',
          className: itemOrPhoto.class || itemOrPhoto.className,
        };
      }

      const exists = prev.find((item) => item.photoId === newItem.photoId && item.variant === newItem.variant);
      if (exists) return prev;
      return [...prev, newItem];
    });
  };

  const removeItem = (photoId: number, variant: number) => {
    setItems((prev: CartItem[]) => prev.filter((item) => !(item.photoId === photoId && item.variant === variant)));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('racephoto_cart');
  };

  const getTotal = () => items.reduce((sum, item) => sum + (parseFloat(String(item.price)) || 0), 0);
  const getCount = () => items.length;
  const isInCart = (photoId: number, variant: number) =>
    items.some((item) => item.photoId === photoId && item.variant === variant);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, getTotal, getCount, isInCart }}>
      {children}
    </CartContext.Provider>
  );
};
