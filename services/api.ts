
const API_BASE_URL = 'https://your-app-name.replit.app';

interface ApiResponse<T = any> {
  status: string;
  message: string;
  data: T;
  timestamp: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
  timestamp: string;
}

class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = await this.getStoredToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  private async getStoredToken(): Promise<string | null> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      return await AsyncStorage.default.getItem('userToken');
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  private async storeToken(token: string): Promise<void> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem('userToken', token);
    } catch (error) {
      console.error('Error storing token:', error);
      throw error;
    }
  }

  // Authentication Methods
  async register(userData: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role?: string;
  }): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ token: string; user: any }>> {
    const response = await this.makeRequest<ApiResponse<{ token: string; user: any }>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data?.token) {
      await this.storeToken(response.data.token);
    }

    return response;
  }

  async verifyOTP(data: {
    email: string;
    otp: string;
  }): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resendOTP(email: string): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(data: {
    email: string;
    otp: string;
    newPassword: string;
  }): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // User Profile Methods
  async getUserProfile(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/users/profile');
  }

  async updateUserProfile(profileData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async updateUserRole(role: string): Promise<ApiResponse> {
    return this.makeRequest('/api/users/role', {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  // Support Methods
  async createSupportTicket(ticketData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<ApiResponse> {
    return this.makeRequest('/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  }

  // Payment Methods
  async initializePayment(paymentData: {
    amount: number;
    currency: string;
    description?: string;
  }): Promise<ApiResponse> {
    return this.makeRequest('/api/payment/initialize', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async verifyPayment(transactionId: string): Promise<ApiResponse> {
    return this.makeRequest('/api/payment/verify', {
      method: 'POST',
      body: JSON.stringify({ transactionId }),
    });
  }

  // Dashboard Data Methods
  async getDashboardStats(): Promise<ApiResponse> {
    return this.makeRequest('/api/realtime/dashboard/stats');
  }

  // Products Methods
  async getProducts(filters?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/api/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async getProduct(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/products/${id}`);
  }

  // Orders Methods
  async getUserOrders(): Promise<ApiResponse> {
    return this.makeRequest('/api/orders/my-orders');
  }

  async getOrderDetails(orderId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/orders/${orderId}`);
  }

  // Cart Methods
  async getCart(): Promise<ApiResponse> {
    return this.makeRequest('/api/cart');
  }

  async addToCart(productData: {
    productId: string;
    quantity: number;
  }): Promise<ApiResponse> {
    return this.makeRequest('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  // Notifications Methods
  async getNotifications(): Promise<ApiResponse> {
    return this.makeRequest('/api/notifications');
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse> {
    return this.makeRequest('/health');
  }
}

export default new ApiService();
