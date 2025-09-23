// Type definitions for API responses and data structures

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImageUrl?: string;
  role: 'consumer' | 'merchant' | 'driver';
  createdAt: string;
  updatedAt: string;
  address?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface Merchant {
  id: string;
  name: string;
  type: 'fuel' | 'market' | 'shopping' | 'restaurant';
  address: string;
  phone: string;
  email: string;
  description: string;
  rating: number;
  reviewCount: number;
  distance: string;
  isOpen: boolean;
  operatingHours: {
    [key: string]: string;
  };
  services: string[];
  latitude: number;
  longitude: number;
  images: string[];
}

export interface Commodity {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  unit: string;
  availability: 'In Stock' | 'Out of Stock' | 'Limited Stock';
  specifications: Array<{
    label: string;
    value: string;
  }>;
}

export interface MerchantCommodity {
  merchantId: string;
  merchantName: string;
  commodityId: string;
  price: number;
  originalPrice?: number;
  stock: string;
  deliveryTime: string;
}

export interface Order {
  id: string;
  userId: string;
  merchantId: string;
  merchantName: string;
  commodityId: string;
  commodityName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  deliveryType: 'self' | 'someone_else';
  recipientName?: string;
  recipientPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  orderId?: string;
  type: 'purchase' | 'refund' | 'payment' | 'reward';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  date: string;
  paymentMethod?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'promotion' | 'system';
  read: boolean;
  timestamp: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

// Request interfaces
export interface SignUpRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'consumer' | 'merchant' | 'driver';
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ConfirmPasswordResetRequest {
  token: string;
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
}

export interface CreateOrderRequest {
  merchantId: string;
  commodityId: string;
  quantity: number;
  deliveryAddress: string;
  deliveryType: 'self' | 'someone_else';
  recipientName?: string;
  recipientPhone?: string;
  notes?: string;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  paymentMethod: 'card' | 'wallet' | 'cash';
}