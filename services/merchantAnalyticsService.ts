// Merchant Analytics Service - Supabase-powered
// Real-time merchant analytics from Supabase database

import { supabase } from '../config/supabase';
import { authService } from './authService';

export interface DailySales {
  date: string;
  sales: number;
  orders: number;
}

export interface CategoryBreakdown {
  category: string;
  percentage: number;
  revenue: number;
  count: number;
}

export interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  image_url?: string;
}

export interface CustomerMetrics {
  newCustomers: number;
  returningCustomers: number;
  averageOrdersPerCustomer: number;
  customerSatisfaction: number;
}

export interface InventoryMetrics {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  turnoverRate: string;
}

export interface PaymentMethodBreakdown {
  method: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface MerchantAnalytics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  monthlyGrowth: number;
  customerRetention: number;
  topSellingProducts: TopProduct[];
  dailySales: DailySales[];
  categoryBreakdown: CategoryBreakdown[];
  customerMetrics: CustomerMetrics;
  inventoryMetrics: InventoryMetrics;
  paymentMethods: PaymentMethodBreakdown[];
  recentOrders: any[];
}

class MerchantAnalyticsService {
  
  /**
   * Get comprehensive merchant analytics from Supabase
   */
  async getMerchantAnalytics(merchantId: string, timeframe: 'week' | 'month' | 'year' = 'month'): Promise<{
    success: boolean;
    data?: MerchantAnalytics;
    error?: string;
  }> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeframe) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch orders for the merchant
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          subtotal,
          delivery_fee,
          status,
          payment_method,
          user_id,
          created_at,
          order_items (
            quantity,
            unit_price,
            total_price,
            product_id,
            products (
              id,
              name,
              category,
              image_url
            )
          )
        `)
        .eq('merchant_id', merchantId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return { success: false, error: ordersError.message };
      }

      // Fetch products for inventory metrics
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, category, stock_quantity, price, image_url, is_available')
        .eq('merchant_id', merchantId);

      if (productsError) {
        console.error('Error fetching products:', productsError);
      }

      // Fetch reviews for customer satisfaction
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('merchant_id', merchantId);

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
      }

      // Calculate analytics
      const analytics = this.calculateAnalytics(
        orders || [],
        products || [],
        reviews || [],
        timeframe
      );

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      console.error('Analytics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
      };
    }
  }

  /**
   * Calculate analytics from raw data
   */
  private calculateAnalytics(
    orders: any[],
    products: any[],
    reviews: any[],
    timeframe: string
  ): MerchantAnalytics {
    // Total sales and orders
    const totalSales = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Calculate daily sales for the chart
    const dailySales = this.calculateDailySales(orders, timeframe);

    // Top selling products
    const topSellingProducts = this.calculateTopProducts(orders);

    // Category breakdown
    const categoryBreakdown = this.calculateCategoryBreakdown(orders);

    // Customer metrics
    const customerMetrics = this.calculateCustomerMetrics(orders);

    // Inventory metrics
    const inventoryMetrics = this.calculateInventoryMetrics(products);

    // Payment methods breakdown
    const paymentMethods = this.calculatePaymentMethods(orders);

    // Customer satisfaction from reviews
    const customerSatisfaction = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

    customerMetrics.customerSatisfaction = Math.round(customerSatisfaction * 10) / 10;

    // Calculate growth (compare with previous period)
    const monthlyGrowth = this.calculateGrowth(orders, timeframe);

    // Customer retention (estimate based on repeat customers)
    const customerRetention = this.calculateRetention(orders);

    // Recent orders for display
    const recentOrders = orders.slice(0, 10);

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      monthlyGrowth,
      customerRetention,
      topSellingProducts,
      dailySales,
      categoryBreakdown,
      customerMetrics,
      inventoryMetrics,
      paymentMethods,
      recentOrders,
    };
  }

  /**
   * Calculate daily sales for chart
   */
  private calculateDailySales(orders: any[], timeframe: string): DailySales[] {
    const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365;
    const dailySalesMap = new Map<string, { sales: number; orders: number }>();

    // Initialize all days
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (days - 1 - i));
      const dateKey = date.toISOString().split('T')[0];
      dailySalesMap.set(dateKey, { sales: 0, orders: 0 });
    }

    // Aggregate sales by day
    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      const dateKey = orderDate.toISOString().split('T')[0];
      const existing = dailySalesMap.get(dateKey);
      if (existing) {
        existing.sales += order.total_amount || 0;
        existing.orders += 1;
      }
    });

    // Convert to array
    return Array.from(dailySalesMap.entries()).map(([date, data]) => ({
      date,
      sales: data.sales,
      orders: data.orders,
    }));
  }

  /**
   * Calculate top selling products
   */
  private calculateTopProducts(orders: any[]): TopProduct[] {
    const productSales = new Map<string, { name: string; sales: number; revenue: number; image_url?: string }>();

    orders.forEach(order => {
      if (order.order_items && Array.isArray(order.order_items)) {
        order.order_items.forEach((item: any) => {
          if (item.products) {
            const productId = item.products.id;
            const existing = productSales.get(productId) || {
              name: item.products.name,
              sales: 0,
              revenue: 0,
              image_url: item.products.image_url,
            };
            existing.sales += item.quantity || 0;
            existing.revenue += item.total_price || 0;
            productSales.set(productId, existing);
          }
        });
      }
    });

    // Convert to array and sort by revenue
    return Array.from(productSales.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  /**
   * Calculate category breakdown
   */
  private calculateCategoryBreakdown(orders: any[]): CategoryBreakdown[] {
    const categoryMap = new Map<string, { revenue: number; count: number }>();

    orders.forEach(order => {
      if (order.order_items && Array.isArray(order.order_items)) {
        order.order_items.forEach((item: any) => {
          if (item.products) {
            const category = item.products.category || 'Uncategorized';
            const existing = categoryMap.get(category) || { revenue: 0, count: 0 };
            existing.revenue += item.total_price || 0;
            existing.count += 1;
            categoryMap.set(category, existing);
          }
        });
      }
    });

    const totalRevenue = Array.from(categoryMap.values()).reduce(
      (sum, cat) => sum + cat.revenue,
      0
    );

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        revenue: data.revenue,
        count: data.count,
        percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Calculate customer metrics
   */
  private calculateCustomerMetrics(orders: any[]): CustomerMetrics {
    const customerOrdersMap = new Map<string, number>();

    orders.forEach(order => {
      const customerId = order.user_id;
      customerOrdersMap.set(customerId, (customerOrdersMap.get(customerId) || 0) + 1);
    });

    const totalCustomers = customerOrdersMap.size;
    const newCustomers = Array.from(customerOrdersMap.values()).filter(count => count === 1).length;
    const returningCustomers = totalCustomers - newCustomers;
    const averageOrdersPerCustomer =
      totalCustomers > 0 ? orders.length / totalCustomers : 0;

    return {
      newCustomers,
      returningCustomers,
      averageOrdersPerCustomer: Math.round(averageOrdersPerCustomer * 10) / 10,
      customerSatisfaction: 0, // Will be filled from reviews
    };
  }

  /**
   * Calculate inventory metrics
   */
  private calculateInventoryMetrics(products: any[]): InventoryMetrics {
    const totalItems = products.length;
    const lowStockItems = products.filter(
      p => p.is_available && p.stock_quantity > 0 && p.stock_quantity < 10
    ).length;
    const outOfStockItems = products.filter(
      p => !p.is_available || p.stock_quantity === 0
    ).length;

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      turnoverRate: '2.4x', // Placeholder - requires historical data
    };
  }

  /**
   * Calculate payment methods breakdown
   */
  private calculatePaymentMethods(orders: any[]): PaymentMethodBreakdown[] {
    const paymentMap = new Map<string, { amount: number; count: number }>();

    orders.forEach(order => {
      const method = order.payment_method || 'Unknown';
      const existing = paymentMap.get(method) || { amount: 0, count: 0 };
      existing.amount += order.total_amount || 0;
      existing.count += 1;
      paymentMap.set(method, existing);
    });

    const totalAmount = Array.from(paymentMap.values()).reduce(
      (sum, data) => sum + data.amount,
      0
    );

    return Array.from(paymentMap.entries())
      .map(([method, data]) => ({
        method: this.formatPaymentMethod(method),
        amount: data.amount,
        count: data.count,
        percentage: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * Format payment method name
   */
  private formatPaymentMethod(method: string): string {
    const methodMap: Record<string, string> = {
      card: 'Card Payment',
      bank_transfer: 'Bank Transfer',
      cash: 'Cash on Delivery',
      wallet: 'Digital Wallet',
    };
    return methodMap[method.toLowerCase()] || method;
  }

  /**
   * Calculate growth compared to previous period
   */
  private calculateGrowth(orders: any[], timeframe: string): number {
    const now = new Date();
    const midpoint = new Date(now);

    switch (timeframe) {
      case 'week':
        midpoint.setDate(now.getDate() - 3.5);
        break;
      case 'month':
        midpoint.setDate(now.getDate() - 15);
        break;
      case 'year':
        midpoint.setMonth(now.getMonth() - 6);
        break;
    }

    const recentOrders = orders.filter(o => new Date(o.created_at) >= midpoint);
    const olderOrders = orders.filter(o => new Date(o.created_at) < midpoint);

    const recentRevenue = recentOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const olderRevenue = olderOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    if (olderRevenue === 0) return recentRevenue > 0 ? 100 : 0;

    return Math.round(((recentRevenue - olderRevenue) / olderRevenue) * 100);
  }

  /**
   * Calculate customer retention rate
   */
  private calculateRetention(orders: any[]): number {
    const customerOrdersMap = new Map<string, number>();

    orders.forEach(order => {
      const customerId = order.user_id;
      customerOrdersMap.set(customerId, (customerOrdersMap.get(customerId) || 0) + 1);
    });

    const totalCustomers = customerOrdersMap.size;
    if (totalCustomers === 0) return 0;

    const returningCustomers = Array.from(customerOrdersMap.values()).filter(
      count => count > 1
    ).length;

    return Math.round((returningCustomers / totalCustomers) * 100);
  }
}

export const merchantAnalyticsService = new MerchantAnalyticsService();
