export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin' | 'rider';
}

export interface ProductVariant {
  color: string;
  size: string;
  price: number;
  stock: number;
  sku: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  variants: ProductVariant[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  product: Product;
  variant: {
    color: string;
    size: string;
    price: number;
  };
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  user: User;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'undelivered' | 'cancelled';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  rider?: User;
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
} 