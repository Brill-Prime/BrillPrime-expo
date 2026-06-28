import { supabase } from '../config/supabase';

export interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  completionRate: number;
  periodComparison: {
    revenue: number;
    orders: number;
  };
}

export interface CategoryBreakdown {
  category: string;
  revenue: number;
  orders: number;
  percentage: number;
}

export interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  image_url?: string;
}

export interface CustomerInsight {
  totalCustomers: number;
  repeatCustomers: number;
  repeatRate: number;
  averageLifetimeValue: number;
}

export interface TimeSeriesData {
  date: string;
  revenue: number;
  orders: number;
}

export class MerchantAnalyticsService {
  /**
   * Get sales metrics for a merchant within a date range
   */
  static async getSalesMetrics(
    merchantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SalesMetrics> {
    try {
      // Get orders within date range
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total_amount, status, created_at')
        .eq('merchant_id', merchantId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      const completedOrders = orders?.filter(o => o.status === 'completed') || [];
      const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);
      const totalOrders = completedOrders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const completionRate = orders && orders.length > 0
        ? (completedOrders.length / orders.length) * 100
        : 0;

      // Get previous period for comparison
      const periodLength = endDate.getTime() - startDate.getTime();
      const prevStartDate = new Date(startDate.getTime() - periodLength);
      const prevEndDate = new Date(startDate.getTime());

      const { data: prevOrders } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('merchant_id', merchantId)
        .gte('created_at', prevStartDate.toISOString())
        .lte('created_at', prevEndDate.toISOString())
        .eq('status', 'completed');

      const prevRevenue = prevOrders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
      const prevOrdersCount = prevOrders?.length || 0;

      const revenueChange = prevRevenue > 0
        ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
        : 0;
      const ordersChange = prevOrdersCount > 0
        ? ((totalOrders - prevOrdersCount) / prevOrdersCount) * 100
        : 0;

      return {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        completionRate,
        periodComparison: {
          revenue: revenueChange,
          orders: ordersChange
        }
      };
    } catch (error) {
      console.error('Error fetching sales metrics:', error);
      throw error;
    }
  }

  /**
   * Get revenue breakdown by category
   */
  static async getCategoryBreakdown(
    merchantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CategoryBreakdown[]> {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          price,
          commodities (
            category
          ),
          orders!inner (
            merchant_id,
            status,
            created_at
          )
        `)
        .eq('orders.merchant_id', merchantId)
        .eq('orders.status', 'completed')
        .gte('orders.created_at', startDate.toISOString())
        .lte('orders.created_at', endDate.toISOString());

      if (error) throw error;

      const categoryMap = new Map<string, { revenue: number; orders: Set<string> }>();
      let totalRevenue = 0;

      data?.forEach((item: any) => {
        const category = item.commodities?.category || 'Uncategorized';
        const revenue = item.quantity * item.price;
        totalRevenue += revenue;

        if (!categoryMap.has(category)) {
          categoryMap.set(category, { revenue: 0, orders: new Set() });
        }

        const categoryData = categoryMap.get(category)!;
        categoryData.revenue += revenue;
        categoryData.orders.add(item.orders.id);
      });

      return Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        revenue: data.revenue,
        orders: data.orders.size,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
      })).sort((a, b) => b.revenue - a.revenue);
    } catch (error) {
      console.error('Error fetching category breakdown:', error);
      throw error;
    }
  }

  /**
   * Get top selling products
   */
  static async getTopProducts(
    merchantId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<TopProduct[]> {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          commodity_id,
          quantity,
          price,
          commodities (
            id,
            name,
            image_url
          ),
          orders!inner (
            merchant_id,
            status,
            created_at
          )
        `)
        .eq('orders.merchant_id', merchantId)
        .eq('orders.status', 'completed')
        .gte('orders.created_at', startDate.toISOString())
        .lte('orders.created_at', endDate.toISOString());

      if (error) throw error;

      const productMap = new Map<string, { name: string; sales: number; revenue: number; image_url?: string }>();

      data?.forEach((item: any) => {
        const commodity = item.commodities;
        if (!commodity) return;

        if (!productMap.has(commodity.id)) {
          productMap.set(commodity.id, {
            name: commodity.name,
            sales: 0,
            revenue: 0,
            image_url: commodity.image_url
          });
        }

        const product = productMap.get(commodity.id)!;
        product.sales += item.quantity;
        product.revenue += item.quantity * item.price;
      });

      return Array.from(productMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching top products:', error);
      throw error;
    }
  }

  /**
   * Get customer insights
   */
  static async getCustomerInsights(
    merchantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CustomerInsight> {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('user_id, total_amount, status')
        .eq('merchant_id', merchantId)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      const customerMap = new Map<string, { orders: number; totalSpent: number }>();

      orders?.forEach(order => {
        if (!customerMap.has(order.user_id)) {
          customerMap.set(order.user_id, { orders: 0, totalSpent: 0 });
        }
        const customer = customerMap.get(order.user_id)!;
        customer.orders += 1;
        customer.totalSpent += order.total_amount;
      });

      const totalCustomers = customerMap.size;
      const repeatCustomers = Array.from(customerMap.values()).filter(c => c.orders > 1).length;
      const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
      const totalRevenue = Array.from(customerMap.values()).reduce((sum, c) => sum + c.totalSpent, 0);
      const averageLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

      return {
        totalCustomers,
        repeatCustomers,
        repeatRate,
        averageLifetimeValue
      };
    } catch (error) {
      console.error('Error fetching customer insights:', error);
      throw error;
    }
  }

  /**
   * Get time series data for charts
   */
  static async getTimeSeriesData(
    merchantId: string,
    startDate: Date,
    endDate: Date,
    interval: 'day' | 'week' | 'month' = 'day'
  ): Promise<TimeSeriesData[]> {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total_amount, created_at, status')
        .eq('merchant_id', merchantId)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const dateMap = new Map<string, { revenue: number; orders: number }>();

      orders?.forEach(order => {
        const date = new Date(order.created_at);
        let key: string;

        switch (interval) {
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          default:
            key = date.toISOString().split('T')[0];
        }

        if (!dateMap.has(key)) {
          dateMap.set(key, { revenue: 0, orders: 0 });
        }

        const dayData = dateMap.get(key)!;
        dayData.revenue += order.total_amount;
        dayData.orders += 1;
      });

      return Array.from(dateMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error fetching time series data:', error);
      throw error;
    }
  }

  /**
   * Get dashboard summary with all key metrics
   */
  static async getDashboardSummary(merchantId: string) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    try {
      const [metrics, categories, topProducts, customerInsights, timeSeries] = await Promise.all([
        this.getSalesMetrics(merchantId, startDate, endDate),
        this.getCategoryBreakdown(merchantId, startDate, endDate),
        this.getTopProducts(merchantId, startDate, endDate, 5),
        this.getCustomerInsights(merchantId, startDate, endDate),
        this.getTimeSeriesData(merchantId, startDate, endDate, 'day')
      ]);

      return {
        metrics,
        categories,
        topProducts,
        customerInsights,
        timeSeries,
        period: {
          start: startDate,
          end: endDate
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  }
}