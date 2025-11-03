// Driver Service for BrillPrime app
// Handles driver-specific operations including performance analytics, earnings, vehicles, and deliveries

import { supabase } from '../config/supabase';
import { auth } from '../config/firebase';

// Types
export interface DriverVehicle {
  id: string;
  driver_id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  registration_number: string;
  insurance_policy_number: string;
  insurance_expiry: string;
  road_worthiness_expiry: string;
  vehicle_status: 'active' | 'inactive' | 'maintenance' | 'deactivated';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface DriverDelivery {
  id: string;
  driver_id: string;
  order_id: string;
  distance_km: number;
  duration_minutes: number;
  earnings: number;
  status: string;
  accepted_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  created_at: string;
}

export interface DriverEarnings {
  id: string;
  driver_id: string;
  date: string;
  total_deliveries: number;
  total_distance_km: number;
  total_hours: number;
  total_earnings: number;
  base_earnings: number;
  tips: number;
  bonuses: number;
  deductions: number;
  net_earnings: number;
}

export interface PerformanceMetrics {
  totalDeliveries: number;
  acceptanceRate: number;
  completionRate: number;
  averageRating: number;
  totalEarnings: number;
  onTimeDeliveryRate: number;
  peakHours: Array<{ hour: string; deliveries: number; earnings: number }>;
  weeklyStats: Array<{ day: string; deliveries: number; earnings: number }>;
  customerFeedback: {
    positive: number;
    neutral: number;
    negative: number;
  };
  routeEfficiency: number;
  responseTime: number;
}

export interface EarningsData {
  today: number;
  week: number;
  month: number;
  total: number;
  trips: Array<{
    date: string;
    amount: number;
    orderId: string;
    distance: string;
    duration: string;
  }>;
  statistics: {
    totalTrips: number;
    avgEarningsPerTrip: number;
    totalDistance: string;
    totalHours: number;
  };
}

class DriverService {
  // Get driver performance metrics
  async getPerformanceMetrics(period: 'week' | 'month' | 'year' = 'week'): Promise<{
    success: boolean;
    data?: PerformanceMetrics;
    error?: string;
  }> {
    try {
      if (!supabase) {
        throw new Error('Supabase not available');
      }

      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (period) {
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

      // Fetch performance metrics from Supabase
      const { data: metricsData, error: metricsError } = await supabase
        .from('driver_performance_metrics')
        .select('*')
        .eq('driver_id', user.uid)
        .gte('period_start', startDate.toISOString())
        .lte('period_end', endDate.toISOString())
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (metricsError && metricsError.code !== 'PGRST116') {
        throw metricsError;
      }

      // Fetch peak hours
      const { data: peakHoursData, error: peakHoursError } = await supabase
        .from('driver_peak_hours')
        .select('*')
        .eq('driver_id', user.uid)
        .order('total_earnings', { ascending: false })
        .limit(5);

      if (peakHoursError) {
        throw peakHoursError;
      }

      // Fetch ratings breakdown
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('driver_ratings')
        .select('feedback_type')
        .eq('driver_id', user.uid);

      if (ratingsError) {
        throw ratingsError;
      }

      // Fetch weekly stats
      const { data: earningsData, error: earningsError } = await supabase
        .from('driver_earnings')
        .select('*')
        .eq('driver_id', user.uid)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (earningsError) {
        throw earningsError;
      }

      // Process data into the expected format
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyStats = weekDays.map((day, index) => {
        const dayData = earningsData?.filter((e: any) => {
          const date = new Date(e.date);
          return date.getDay() === index;
        }) || [];

        const deliveries = dayData.reduce((sum: number, d: any) => sum + d.total_deliveries, 0);
        const earnings = dayData.reduce((sum: number, d: any) => sum + d.total_earnings, 0);

        return { day, deliveries, earnings };
      });

      // Process peak hours
      const peakHours = (peakHoursData || []).slice(0, 3).map((ph: any) => ({
        hour: `${ph.hour_of_day}:00`,
        deliveries: ph.total_deliveries,
        earnings: ph.total_earnings,
      }));

      // Process customer feedback
      const positive = ratingsData?.filter((r: any) => r.feedback_type === 'positive').length || 0;
      const neutral = ratingsData?.filter((r: any) => r.feedback_type === 'neutral').length || 0;
      const negative = ratingsData?.filter((r: any) => r.feedback_type === 'negative').length || 0;

      const metrics: PerformanceMetrics = {
        totalDeliveries: metricsData?.total_deliveries || 0,
        acceptanceRate: metricsData?.acceptance_rate || 0,
        completionRate: metricsData?.completion_rate || 0,
        averageRating: metricsData?.average_rating || 0,
        totalEarnings: metricsData?.total_earnings || 0,
        onTimeDeliveryRate: metricsData?.on_time_delivery_rate || 0,
        peakHours,
        weeklyStats,
        customerFeedback: { positive, neutral, negative },
        routeEfficiency: metricsData?.route_efficiency_score || 0,
        responseTime: metricsData?.average_response_time_minutes || 0,
      };

      return { success: true, data: metrics };
    } catch (error: any) {
      console.error('Error fetching performance metrics:', error);
      return { success: false, error: error.message };
    }
  }

  // Get driver earnings data
  async getEarningsData(period?: 'today' | 'week' | 'month'): Promise<{
    success: boolean;
    data?: EarningsData;
    error?: string;
  }> {
    try {
      if (!supabase) {
        throw new Error('Supabase not available');
      }

      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Calculate date ranges
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch today's earnings
      const { data: todayData, error: todayError } = await supabase
        .from('driver_earnings')
        .select('total_earnings')
        .eq('driver_id', user.uid)
        .eq('date', today)
        .maybeSingle();

      if (todayError && todayError.code !== 'PGRST116') {
        throw todayError;
      }

      // Fetch week's earnings
      const { data: weekData, error: weekError } = await supabase
        .from('driver_earnings')
        .select('total_earnings')
        .eq('driver_id', user.uid)
        .gte('date', weekAgo);

      if (weekError) {
        throw weekError;
      }

      // Fetch month's earnings
      const { data: monthData, error: monthError } = await supabase
        .from('driver_earnings')
        .select('total_earnings')
        .eq('driver_id', user.uid)
        .gte('date', monthAgo);

      if (monthError) {
        throw monthError;
      }

      // Fetch all earnings for total
      const { data: allEarnings, error: allError } = await supabase
        .from('driver_earnings')
        .select('total_earnings, total_deliveries, total_distance_km, total_hours')
        .eq('driver_id', user.uid);

      if (allError) {
        throw allError;
      }

      // Fetch recent trips
      const { data: tripsData, error: tripsError } = await supabase
        .from('driver_deliveries')
        .select('id, order_id, earnings, distance_km, duration_minutes, delivered_at')
        .eq('driver_id', user.uid)
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: false })
        .limit(10);

      if (tripsError) {
        throw tripsError;
      }

      // Calculate totals
      const totalEarnings = allEarnings?.reduce((sum: number, e: any) => sum + e.total_earnings, 0) || 0;
      const totalDeliveries = allEarnings?.reduce((sum: number, e: any) => sum + e.total_deliveries, 0) || 0;
      const totalDistance = allEarnings?.reduce((sum: number, e: any) => sum + e.total_distance_km, 0) || 0;
      const totalHours = allEarnings?.reduce((sum: number, e: any) => sum + e.total_hours, 0) || 0;

      const earnings: EarningsData = {
        today: todayData?.total_earnings || 0,
        week: weekData?.reduce((sum: number, e: any) => sum + e.total_earnings, 0) || 0,
        month: monthData?.reduce((sum: number, e: any) => sum + e.total_earnings, 0) || 0,
        total: totalEarnings,
        trips: (tripsData || []).map((trip: any) => ({
          date: trip.delivered_at?.split('T')[0] || '',
          amount: trip.earnings,
          orderId: trip.order_id,
          distance: `${trip.distance_km} km`,
          duration: `${trip.duration_minutes} min`,
        })),
        statistics: {
          totalTrips: totalDeliveries,
          avgEarningsPerTrip: totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0,
          totalDistance: `${totalDistance.toFixed(1)} km`,
          totalHours,
        },
      };

      return { success: true, data: earnings };
    } catch (error: any) {
      console.error('Error fetching earnings data:', error);
      return { success: false, error: error.message };
    }
  }

  // Get driver vehicle info
  async getVehicleInfo(): Promise<{
    success: boolean;
    data?: DriverVehicle;
    error?: string;
  }> {
    try {
      if (!supabase) {
        throw new Error('Supabase not available');
      }

      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('driver_vehicles')
        .select('*')
        .eq('driver_id', user.uid)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { success: true, data: data || undefined };
    } catch (error: any) {
      console.error('Error fetching vehicle info:', error);
      return { success: false, error: error.message };
    }
  }

  // Update driver vehicle info
  async updateVehicleInfo(vehicleData: Partial<DriverVehicle>): Promise<{
    success: boolean;
    data?: DriverVehicle;
    error?: string;
  }> {
    try {
      if (!supabase) {
        throw new Error('Supabase not available');
      }

      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if vehicle exists
      const { data: existingVehicle } = await supabase
        .from('driver_vehicles')
        .select('id')
        .eq('driver_id', user.uid)
        .maybeSingle();

      let result;
      if (existingVehicle) {
        // Update existing vehicle
        const { data, error } = await supabase
          .from('driver_vehicles')
          .update(vehicleData)
          .eq('driver_id', user.uid)
          .select()
          .single();

        if (error) {
          throw error;
        }
        result = data;
      } else {
        // Insert new vehicle
        const { data, error } = await supabase
          .from('driver_vehicles')
          .insert({
            ...vehicleData,
            driver_id: user.uid,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }
        result = data;
      }

      return { success: true, data: result };
    } catch (error: any) {
      console.error('Error updating vehicle info:', error);
      return { success: false, error: error.message };
    }
  }

  // Upload vehicle document
  async uploadVehicleDocument(
    documentType: 'registration' | 'insurance' | 'road_worthiness' | 'drivers_license',
    documentUrl: string,
    expiryDate?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!supabase) {
        throw new Error('Supabase not available');
      }

      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get vehicle ID
      const vehicleInfo = await this.getVehicleInfo();
      if (!vehicleInfo.success || !vehicleInfo.data) {
        throw new Error('Vehicle not found');
      }

      // Upsert document
      const { error } = await supabase
        .from('driver_vehicle_documents')
        .upsert({
          vehicle_id: vehicleInfo.data.id,
          document_type: documentType,
          document_url: documentUrl,
          expiry_date: expiryDate || null,
          status: 'pending',
        }, {
          onConflict: 'vehicle_id,document_type'
        });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error uploading vehicle document:', error);
      return { success: false, error: error.message };
    }
  }

  // Record a delivery
  async recordDelivery(deliveryData: {
    order_id: string;
    distance_km: number;
    duration_minutes: number;
    earnings: number;
    pickup_latitude?: number;
    pickup_longitude?: number;
    delivery_latitude?: number;
    delivery_longitude?: number;
  }): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!supabase) {
        throw new Error('Supabase not available');
      }

      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('driver_deliveries')
        .insert({
          driver_id: user.uid,
          ...deliveryData,
          status: 'delivered',
          delivered_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error recording delivery:', error);
      return { success: false, error: error.message };
    }
  }

  // Get vehicle documents
  async getVehicleDocuments(): Promise<{
    success: boolean;
    data?: Array<{
      id: string;
      vehicle_id: string;
      document_type: string;
      document_url: string;
      expiry_date: string | null;
      status: string;
      uploaded_at: string;
    }>;
    error?: string;
  }> {
    try {
      if (!supabase) {
        throw new Error('Supabase not available');
      }

      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First get the vehicle ID
      const { data: vehicle, error: vehicleError } = await supabase
        .from('driver_vehicles')
        .select('id')
        .eq('driver_id', user.uid)
        .maybeSingle();

      if (vehicleError && vehicleError.code !== 'PGRST116') {
        throw vehicleError;
      }

      if (!vehicle) {
        // No vehicle registered yet
        return { success: true, data: [] };
      }

      // Fetch documents for this vehicle
      const { data, error } = await supabase
        .from('driver_vehicle_documents')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .order('uploaded_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error fetching vehicle documents:', error);
      return { success: false, error: error.message };
    }
  }
}

export const driverService = new DriverService();
