
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

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

  // ===== AUTHENTICATION & AUTHORIZATION =====

  // Auth Routes
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

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async initiateMFA(): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/initiate-mfa', {
      method: 'POST',
    });
  }

  async verifyMFA(data: { code: string }): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/verify-mfa', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async loginMFA(data: {
    email: string;
    password: string;
    mfaCode: string;
  }): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/login-mfa', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin Auth Routes
  async adminRegister(data: {
    fullName: string;
    email: string;
    password: string;
    adminKey: string;
  }): Promise<ApiResponse> {
    return this.makeRequest('/admin/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adminLogin(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse> {
    return this.makeRequest('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async adminLogout(): Promise<ApiResponse> {
    return this.makeRequest('/admin/auth/logout', {
      method: 'POST',
    });
  }

  async adminResetPassword(data: {
    email: string;
    newPassword: string;
  }): Promise<ApiResponse> {
    return this.makeRequest('/admin/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Social Auth Routes
  async googleAuth(): Promise<ApiResponse> {
    return this.makeRequest('/api/social-auth/google');
  }

  async facebookAuth(): Promise<ApiResponse> {
    return this.makeRequest('/api/social-auth/facebook');
  }

  async appleAuth(data: { identityToken: string }): Promise<ApiResponse> {
    return this.makeRequest('/api/social-auth/apple', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===== USER MANAGEMENT =====

  async getUserProfile(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/users/profile');
  }

  async updateUserProfile(profileData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getMerchants(): Promise<ApiResponse> {
    return this.makeRequest('/api/users/merchants');
  }

  async getMerchant(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/users/merchants/${id}`);
  }

  async updateMerchantProfile(profileData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/users/merchant-profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async updateDriverProfile(profileData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/users/driver-profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async updateUserLocation(location: {
    latitude: number;
    longitude: number;
    address?: string;
  }): Promise<ApiResponse> {
    return this.makeRequest('/api/users/location', {
      method: 'POST',
      body: JSON.stringify(location),
    });
  }

  async updateUserRole(role: string): Promise<ApiResponse> {
    return this.makeRequest('/api/users/role', {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async searchUsers(params: {
    q: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.makeRequest(`/api/users/search?${queryParams.toString()}`);
  }

  // ===== E-COMMERCE CORE =====

  // Products
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

  async createProduct(productData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, productData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/products/${id}`, {
      method: 'DELETE',
    });
  }

  async getCategories(): Promise<ApiResponse> {
    return this.makeRequest('/api/products/categories');
  }

  async createCategory(categoryData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/products/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async getProductsBySeller(sellerId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/products/seller/${sellerId}`);
  }

  // Cart
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

  async updateCartItem(id: string, quantity: number): Promise<ApiResponse> {
    return this.makeRequest(`/api/cart/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeCartItem(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/cart/${id}`, {
      method: 'DELETE',
    });
  }

  async clearCart(): Promise<ApiResponse> {
    return this.makeRequest('/api/cart', {
      method: 'DELETE',
    });
  }

  // Orders
  async checkout(): Promise<ApiResponse> {
    return this.makeRequest('/api/orders/checkout', {
      method: 'POST',
    });
  }

  async placeOrder(orderData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/orders/place', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getUserOrders(): Promise<ApiResponse> {
    return this.makeRequest('/api/orders/my-orders');
  }

  async getConsumerOrders(): Promise<ApiResponse> {
    return this.makeRequest('/api/orders/consumer-orders');
  }

  async getMerchantOrders(): Promise<ApiResponse> {
    return this.makeRequest('/api/orders/merchant-orders');
  }

  async updateOrderStatus(id: string, status: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async cancelOrder(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/orders/${id}/cancel`, {
      method: 'PUT',
    });
  }

  async processRefund(id: string, refundData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/orders/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify(refundData),
    });
  }

  async addOrderReview(id: string, reviewData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/orders/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  async getOrderDetails(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/orders/${id}`);
  }

  // ===== PAYMENT SYSTEM =====

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

  async processPaymentRefund(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/payment/refund/${id}`, {
      method: 'POST',
    });
  }

  async createPaymentDispute(id: string, disputeData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/payment/dispute/${id}`, {
      method: 'POST',
      body: JSON.stringify(disputeData),
    });
  }

  async requestPayout(payoutData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/payment/payout', {
      method: 'POST',
      body: JSON.stringify(payoutData),
    });
  }

  async getPayoutHistory(): Promise<ApiResponse> {
    return this.makeRequest('/api/payment/payout/history');
  }

  async getPaymentHistory(): Promise<ApiResponse> {
    return this.makeRequest('/api/payment/history');
  }

  // QR Payments
  async generateQRCode(qrData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/qr/generate', {
      method: 'POST',
      body: JSON.stringify(qrData),
    });
  }

  async processQRPayment(qrId: string, paymentData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/qr/pay/${qrId}`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async getQRCode(qrId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/qr/${qrId}`);
  }

  async getUserQRCodes(): Promise<ApiResponse> {
    return this.makeRequest('/api/qr/user/codes');
  }

  async cancelQRCode(qrId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/qr/${qrId}`, {
      method: 'DELETE',
    });
  }

  // Wallet
  async getWallet(userId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/wallet/${userId}`);
  }

  async getWalletTransactions(userId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/wallet/${userId}/transactions`);
  }

  async fundWallet(userId: string, fundData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/wallet/${userId}/fund`, {
      method: 'POST',
      body: JSON.stringify(fundData),
    });
  }

  async createWallet(walletData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/wallet/create', {
      method: 'POST',
      body: JSON.stringify(walletData),
    });
  }

  // ===== DELIVERY & LOGISTICS =====

  async createDeliveryRequest(deliveryData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/delivery/request', {
      method: 'POST',
      body: JSON.stringify(deliveryData),
    });
  }

  async getAvailableDeliveries(): Promise<ApiResponse> {
    return this.makeRequest('/api/delivery/available');
  }

  async acceptDelivery(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/delivery/${id}/accept`, {
      method: 'POST',
    });
  }

  async updateDeliveryStatus(id: string, status: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/delivery/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getMyDeliveries(): Promise<ApiResponse> {
    return this.makeRequest('/api/delivery/my-deliveries');
  }

  async trackDelivery(trackingNumber: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/delivery/track/${trackingNumber}`);
  }

  async getDeliveryStats(): Promise<ApiResponse> {
    return this.makeRequest('/api/delivery/stats');
  }

  async getDriverEarnings(): Promise<ApiResponse> {
    return this.makeRequest('/api/delivery/earnings');
  }

  async requestDriverPayout(): Promise<ApiResponse> {
    return this.makeRequest('/api/delivery/request-payout', {
      method: 'POST',
    });
  }

  async getDeliveryRoute(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/delivery/${id}/route`);
  }

  async addDeliveryReview(id: string, reviewData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/delivery/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  // Driver Management
  async getDriverDashboard(): Promise<ApiResponse> {
    return this.makeRequest('/api/drivers/dashboard');
  }

  async updateDriverStatus(status: string): Promise<ApiResponse> {
    return this.makeRequest('/api/drivers/status', {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async acceptDriverOrder(orderId: string): Promise<ApiResponse> {
    return this.makeRequest('/api/drivers/orders/accept', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  }

  async getAvailableDriverOrders(): Promise<ApiResponse> {
    return this.makeRequest('/api/drivers/orders/available');
  }

  // Auto Assignment
  async requestDriverAssignment(orderId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/auto-assignment/${orderId}/request-assignment`, {
      method: 'POST',
    });
  }

  async getAssignmentStatus(orderId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/auto-assignment/${orderId}/assignment-status`);
  }

  // ===== LOCATION & GEOGRAPHY =====

  async getServiceAreas(location: { lat: number; lng: number }): Promise<ApiResponse> {
    return this.makeRequest(`/api/geo/service-areas?lat=${location.lat}&lng=${location.lng}`);
  }

  async estimateDelivery(deliveryData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/geo/estimate-delivery', {
      method: 'POST',
      body: JSON.stringify(deliveryData),
    });
  }

  async getNearbyServices(location: { lat: number; lng: number }): Promise<ApiResponse> {
    return this.makeRequest(`/api/geo/nearby-services?lat=${location.lat}&lng=${location.lng}`);
  }

  async optimizeRoute(routeData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/geo/optimize-route', {
      method: 'POST',
      body: JSON.stringify(routeData),
    });
  }

  // ===== COMMUNICATION =====

  // Chat
  async startConversation(conversationData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/chat/conversations', {
      method: 'POST',
      body: JSON.stringify(conversationData),
    });
  }

  async getConversations(): Promise<ApiResponse> {
    return this.makeRequest('/api/chat/conversations');
  }

  async sendMessage(conversationId: string, messageData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async getMessages(conversationId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/chat/conversations/${conversationId}/messages`);
  }

  async getConversationDetails(conversationId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/chat/conversations/${conversationId}`);
  }

  async closeConversation(conversationId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/chat/conversations/${conversationId}/close`, {
      method: 'PUT',
    });
  }

  async getOnlineUsers(conversationId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/chat/conversations/${conversationId}/online-users`);
  }

  // Live Chat
  async startLiveChat(chatData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/live-chat/conversations', {
      method: 'POST',
      body: JSON.stringify(chatData),
    });
  }

  async getLiveChats(): Promise<ApiResponse> {
    return this.makeRequest('/api/live-chat/conversations');
  }

  async getLiveChatMessages(conversationId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/live-chat/conversations/${conversationId}/messages`);
  }

  async sendLiveChatMessage(conversationId: string, messageData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/live-chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  // Notifications
  async getNotifications(): Promise<ApiResponse> {
    return this.makeRequest('/api/notifications');
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse> {
    return this.makeRequest('/api/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  async getUnreadNotificationsCount(): Promise<ApiResponse> {
    return this.makeRequest('/api/notifications/unread-count');
  }

  async createNotification(notificationData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  // ===== SOCIAL FEATURES =====

  async createPost(postData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/social/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async getPosts(): Promise<ApiResponse> {
    return this.makeRequest('/api/social/posts');
  }

  async getPost(postId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/social/posts/${postId}`);
  }

  async likePost(postId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/social/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async addComment(postId: string, commentData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/social/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  async getComments(postId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/social/posts/${postId}/comments`);
  }

  async updatePost(postId: string, postData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/social/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  }

  async deletePost(postId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/social/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  // ===== REVIEWS & RATINGS =====

  async createReview(reviewData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  async getProductReviews(productId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/reviews/product/${productId}`);
  }

  async getUserReviews(userId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/reviews/user/${userId}`);
  }

  async updateReview(reviewId: string, reviewData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(reviewData),
    });
  }

  async deleteReview(reviewId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  }

  // ===== SEARCH & DISCOVERY =====

  async searchProducts(query: string, filters?: any): Promise<ApiResponse> {
    const params = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    return this.makeRequest(`/api/search/products?${params.toString()}`);
  }

  async searchMerchants(query: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/search/merchants?q=${query}`);
  }

  async getTrendingSearches(): Promise<ApiResponse> {
    return this.makeRequest('/api/search/trending');
  }

  async saveSearch(query: string): Promise<ApiResponse> {
    return this.makeRequest('/api/search/save', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  async getSearchHistory(): Promise<ApiResponse> {
    return this.makeRequest('/api/search/history');
  }

  async getSearchSuggestions(query: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/search/suggestions?q=${query}`);
  }

  // ===== ANALYTICS & REPORTING =====

  async getDashboardStats(): Promise<ApiResponse> {
    return this.makeRequest('/api/realtime/dashboard/stats');
  }

  async getDashboardAnalytics(): Promise<ApiResponse> {
    return this.makeRequest('/api/analytics/dashboard');
  }

  async getSalesAnalytics(): Promise<ApiResponse> {
    return this.makeRequest('/api/analytics/sales');
  }

  async recordDailyAnalytics(analyticsData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/analytics/record-daily', {
      method: 'POST',
      body: JSON.stringify(analyticsData),
    });
  }

  async getProfileAnalytics(): Promise<ApiResponse> {
    return this.makeRequest('/api/analytics/profile');
  }

  // ===== BUSINESS MANAGEMENT =====

  async getBusinessCategories(): Promise<ApiResponse> {
    return this.makeRequest('/api/business-categories');
  }

  async getCommodityCategories(businessCategoryId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/business-categories/${businessCategoryId}/commodities`);
  }

  async createBusinessCategory(categoryData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/business-categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async createCommodityCategory(businessCategoryId: string, categoryData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/business-categories/${businessCategoryId}/commodities`, {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  // Opening Hours
  async getVendorOpeningHours(vendorId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/opening-hours/${vendorId}`);
  }

  async setOpeningHours(hoursData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/opening-hours', {
      method: 'POST',
      body: JSON.stringify(hoursData),
    });
  }

  async updateDayHours(dayOfWeek: string, hoursData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/opening-hours/${dayOfWeek}`, {
      method: 'PUT',
      body: JSON.stringify(hoursData),
    });
  }

  // Commodities
  async getCommoditySubcategories(searchParams?: any): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    return this.makeRequest(`/api/commodities/subcategories?${params.toString()}`);
  }

  async addCommodity(commodityData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/commodities/add', {
      method: 'POST',
      body: JSON.stringify(commodityData),
    });
  }

  async updateCommodity(id: string, commodityData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/commodities/update/${id}`, {
      method: 'POST',
      body: JSON.stringify(commodityData),
    });
  }

  async removeCommodity(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/commodities/remove/${id}`, {
      method: 'DELETE',
    });
  }

  async getAllCommodities(): Promise<ApiResponse> {
    return this.makeRequest('/api/commodities/all');
  }

  async getCommodity(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/commodities/${id}`);
  }

  async getVendorCommodities(vendorId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/commodities/vendor/${vendorId}`);
  }

  // ===== FUEL SERVICES =====

  async placeFuelOrder(orderData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/fuel/order', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getFuelOrders(): Promise<ApiResponse> {
    return this.makeRequest('/api/fuel/orders');
  }

  async getFuelOrder(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/fuel/orders/${id}`);
  }

  async cancelFuelOrder(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/fuel/orders/${id}/cancel`, {
      method: 'PUT',
    });
  }

  async getFuelInventory(): Promise<ApiResponse> {
    return this.makeRequest('/api/fuel/inventory');
  }

  async addFuelInventory(inventoryData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/fuel/inventory', {
      method: 'POST',
      body: JSON.stringify(inventoryData),
    });
  }

  async updateFuelInventory(id: string, inventoryData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/fuel/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(inventoryData),
    });
  }

  async getMerchantFuelOrders(): Promise<ApiResponse> {
    return this.makeRequest('/api/fuel/merchant/orders');
  }

  async updateFuelOrderStatus(id: string, status: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/fuel/merchant/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // ===== TOLL SERVICES =====

  async payToll(tollData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/toll/pay', {
      method: 'POST',
      body: JSON.stringify(tollData),
    });
  }

  async getTollLocations(): Promise<ApiResponse> {
    return this.makeRequest('/api/toll/locations');
  }

  async getTollPricing(locationId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/toll/pricing/${locationId}`);
  }

  async getTollHistory(): Promise<ApiResponse> {
    return this.makeRequest('/api/toll/history');
  }

  async getTollReceipt(receiptNumber: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/toll/receipt/${receiptNumber}`);
  }

  // ===== SUPPORT & TICKETS =====

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

  async getSupportTickets(): Promise<ApiResponse> {
    return this.makeRequest('/api/support/tickets');
  }

  async getSupportTicket(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/support/tickets/${id}`);
  }

  async updateSupportTicket(id: string, ticketData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/support/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ticketData),
    });
  }

  // ===== VERIFICATION SERVICES =====

  async submitIdentityVerification(verificationData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/verification/identity', {
      method: 'POST',
      body: JSON.stringify(verificationData),
    });
  }

  async submitDriverVerification(verificationData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/verification/driver', {
      method: 'POST',
      body: JSON.stringify(verificationData),
    });
  }

  async submitPhoneVerification(phoneData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/verification/phone', {
      method: 'POST',
      body: JSON.stringify(phoneData),
    });
  }

  async verifyPhone(verificationData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/verification/phone/verify', {
      method: 'POST',
      body: JSON.stringify(verificationData),
    });
  }

  async getVerificationStatus(): Promise<ApiResponse> {
    return this.makeRequest('/api/verification/status');
  }

  // ===== DOCUMENTS & RECEIPTS =====

  async generateReceipt(receiptData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/receipts/generate', {
      method: 'POST',
      body: JSON.stringify(receiptData),
    });
  }

  async getReceipt(receiptNumber: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/receipts/${receiptNumber}`);
  }

  async getUserReceipts(): Promise<ApiResponse> {
    return this.makeRequest('/api/receipts/user/all');
  }

  async getMerchantReceipts(): Promise<ApiResponse> {
    return this.makeRequest('/api/receipts/merchant/all');
  }

  async updateReceipt(id: string, receiptData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/receipts/${id}/update`, {
      method: 'PUT',
      body: JSON.stringify(receiptData),
    });
  }

  // Upload Services
  async uploadImage(imageData: FormData): Promise<ApiResponse> {
    return this.makeRequest('/api/upload/image', {
      method: 'POST',
      headers: {}, // Remove Content-Type for FormData
      body: imageData,
    });
  }

  async uploadImages(imagesData: FormData): Promise<ApiResponse> {
    return this.makeRequest('/api/upload/images', {
      method: 'POST',
      headers: {}, // Remove Content-Type for FormData
      body: imagesData,
    });
  }

  async uploadDocument(documentData: FormData): Promise<ApiResponse> {
    return this.makeRequest('/api/upload/document', {
      method: 'POST',
      headers: {}, // Remove Content-Type for FormData
      body: documentData,
    });
  }

  async getUploadedFile(type: string, filename: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/upload/${type}/${filename}`);
  }

  // ===== SECURITY & FRAUD DETECTION =====

  async logSecurityEvent(eventData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/security/log', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async getSecurityLogs(userId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/security/logs/${userId}`);
  }

  async reportSuspiciousActivity(activityData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/security/suspicious', {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
  }

  async manageTrustedDevice(deviceData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/security/trusted-device', {
      method: 'POST',
      body: JSON.stringify(deviceData),
    });
  }

  async enable2FA(): Promise<ApiResponse> {
    return this.makeRequest('/api/security/enable-2fa', {
      method: 'POST',
    });
  }

  async disable2FA(): Promise<ApiResponse> {
    return this.makeRequest('/api/security/disable-2fa', {
      method: 'POST',
    });
  }

  async getLoginHistory(userId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/security/login-history/${userId}`);
  }

  // ===== REPORTS =====

  async reportUser(userId: string, reportData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/report/user/${userId}`, {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async reportProduct(productId: string, reportData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/report/product/${productId}`, {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async getMyReports(): Promise<ApiResponse> {
    return this.makeRequest('/api/report/my-reports');
  }

  // ===== REALTIME API =====

  async getRealtimeHealth(): Promise<ApiResponse> {
    return this.makeRequest('/api/realtime/health');
  }

  async getRealtimeDashboardStats(): Promise<ApiResponse> {
    return this.makeRequest('/api/realtime/dashboard/stats');
  }

  async getRealtimeUser(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/realtime/users/${id}`);
  }

  async getRealtimeUsersByRole(role: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/realtime/users/role/${role}`);
  }

  async getRealtimeActiveProducts(): Promise<ApiResponse> {
    return this.makeRequest('/api/realtime/products/active');
  }

  async getRealtimeProductsBySeller(sellerId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/realtime/products/seller/${sellerId}`);
  }

  async getRealtimeOrdersByUser(userId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/realtime/orders/user/${userId}`);
  }

  async getRealtimeOrdersByStatus(status: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/realtime/orders/status/${status}`);
  }

  async getRealtimeUserActivity(userId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/realtime/activity/user/${userId}`);
  }

  async getRealtimeFraudAlerts(): Promise<ApiResponse> {
    return this.makeRequest('/api/realtime/security/fraud-alerts');
  }

  // ===== TESTING & DEVELOPMENT =====

  async testSMTP(): Promise<ApiResponse> {
    return this.makeRequest('/api/test-email/test-smtp', {
      method: 'POST',
    });
  }

  async getSMTPConfig(): Promise<ApiResponse> {
    return this.makeRequest('/api/test-email/smtp-config');
  }

  async testValidation(): Promise<ApiResponse> {
    return this.makeRequest('/api/test-validation/test-validation', {
      method: 'POST',
    });
  }

  async testDBConnection(): Promise<ApiResponse> {
    return this.makeRequest('/api/test-validation/test-db');
  }

  async testFraudDetection(): Promise<ApiResponse> {
    return this.makeRequest('/api/test-validation/test-fraud-detection', {
      method: 'POST',
    });
  }

  async testRateLimit(): Promise<ApiResponse> {
    return this.makeRequest('/api/test-validation/test-rate-limit');
  }

  // ===== HEALTH & STATUS =====

  async getAPIInfo(): Promise<ApiResponse> {
    return this.makeRequest('/');
  }

  async healthCheck(): Promise<ApiResponse> {
    return this.makeRequest('/health');
  }

  async getAPIDocumentation(): Promise<ApiResponse> {
    return this.makeRequest('/api');
  }
}

export default new ApiService();
