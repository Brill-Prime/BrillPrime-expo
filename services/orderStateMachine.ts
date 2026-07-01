import { supabase } from '../config/supabase';
import { locationService } from './locationService';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'rejected';

export type OrderEvent =
  | 'PAYMENT_SUCCEEDED'
  | 'MERCHANT_MARKED_READY'
  | 'DRIVER_ACCEPTED'
  | 'DRIVER_PICKED_UP'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderTransitionResult {
  success: boolean;
  status?: OrderStatus;
  error?: string;
  meta?: Record<string, any>;
}

async function getCurrentOrderStatus(orderId: string): Promise<{ success: boolean; status?: OrderStatus; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id,status')
      .eq('id', orderId)
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, status: data.status as OrderStatus };
  } catch (e: any) {
    return { success: false, error: String(e?.message || e) };
  }
}

async function updateOrderStatusIdempotent(
  orderId: string,
  nextStatus: OrderStatus,
  allowedFrom: OrderStatus[]
): Promise<OrderTransitionResult> {
  // Concurrency safety: only update if current status is in allowedFrom.
  const { data, error } = await supabase
    .from('orders')
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .in('status', allowedFrom)
    .select('id,status');

  if (error) {
    return { success: false, error: error.message };
  }

  // If no rows were updated, treat as idempotent success if the order is already in desired state.
  if (!data || data.length === 0) {
    const curr = await getCurrentOrderStatus(orderId);
    if (curr.success && curr.status === nextStatus) {
      return { success: true, status: nextStatus };
    }
    return { success: false, error: 'Transition not allowed or order already changed by another actor.' };
  }

  return { success: true, status: nextStatus };
}

async function findNearbyAvailableDrivers(params: {
  latitude: number;
  longitude: number;
  radiusKm: number;
}): Promise<any[]> {
  // Simple availability filter; distance is computed client-side using driver_locations.
  const { data: drivers, error } = await supabase
    .from('drivers')
    .select('id, is_available, is_verified, vehicle_type, vehicle_number, user:users(id,first_name,last_name,phone_number)')
    .eq('is_verified', true)
    .eq('is_available', true);

  if (error || !drivers) {
    return [];
  }

  const { data: driverLocs } = await supabase
    .from('driver_locations')
    .select('driver_id, latitude, longitude, timestamp')
    .in(
      'driver_id',
      drivers.map((d: any) => d.id)
    );

  const locMap = new Map<string, { latitude: number; longitude: number }>();
  (driverLocs || []).forEach((l: any) => {
    if (l?.latitude != null && l?.longitude != null) {
      locMap.set(l.driver_id, { latitude: l.latitude, longitude: l.longitude });
    }
  });

  const candidates = (drivers as any[])
    .map((d: any) => {
      const loc = locMap.get(d.id);
      if (!loc) return null;
      const distKm = locationService.calculateDistance(
        params.latitude,
        params.longitude,
        loc.latitude,
        loc.longitude
      );
      return { ...d, distKm, liveLocation: loc };
    })
    .filter(Boolean) as any[];

  return candidates
    .filter((d) => d.distKm <= params.radiusKm)
    .sort((a, b) => a.distKm - b.distKm);
}

export class OrderStateMachine {
  /**
   * Consumer workflow: payment confirmed -> become READY and kick off driver assignment.
   */
  async onPaymentSucceeded(orderId: string, opts?: { radiusKm?: number }): Promise<OrderTransitionResult> {
    // Transition to ready (paid/awaiting pickup)
    const t = await updateOrderStatusIdempotent(orderId, 'ready', ['pending', 'accepted', 'preparing']);
    if (!t.success) return t;

    // Trigger assignment (best-effort)
    const assign = await this.assignDriverForReadyOrder(orderId, opts?.radiusKm ?? 10);
    if (!assign.success) {
      return { success: true, status: 'ready', meta: { warning: assign.error } };
    }

    return { success: true, status: 'ready', meta: { driverId: assign.meta?.driverId } };
  }

  /**
   * Merchant workflow: when merchant marks package ready.
   */
  async merchantMarkedReady(orderId: string, opts?: { radiusKm?: number }): Promise<OrderTransitionResult> {
    const t = await updateOrderStatusIdempotent(orderId, 'ready', ['accepted', 'preparing']);
    if (!t.success) return t;

    // Trigger assignment (best-effort)
    const assign = await this.assignDriverForReadyOrder(orderId, opts?.radiusKm ?? 10);
    if (!assign.success) {
      return { success: true, status: 'ready', meta: { warning: assign.error } };
    }

    return { success: true, status: 'ready', meta: { driverId: assign.meta?.driverId } };
  }

  /**
   * Driver assignment: set driver_id when orders.status is ready and driver_id is still NULL.
   */
  async assignDriverForReadyOrder(orderId: string, radiusKm: number): Promise<OrderTransitionResult> {
    const { data: order, error } = await supabase
      .from('orders')
      .select('id,delivery_latitude,delivery_longitude')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return { success: false, error: error?.message || 'Order not found' };
    }

    if (order.delivery_latitude == null || order.delivery_longitude == null) {
      return { success: false, error: 'Order missing delivery coordinates; cannot assign driver by distance.' };
    }

    const nearby = await findNearbyAvailableDrivers({
      latitude: order.delivery_latitude,
      longitude: order.delivery_longitude,
      radiusKm,
    });

    if (!nearby.length) {
      return { success: false, error: 'No nearby drivers available' };
    }

    const driverId = nearby[0].id;

    // Concurrency safe: only set driver_id if still NULL and status is ready.
    const { data, error: assignError } = await supabase
      .from('orders')
      .update({
        driver_id: driverId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('status', 'ready')
      .is('driver_id', null)
      .select('id,driver_id,status');

    if (assignError) {
      return { success: false, error: assignError.message };
    }

    if (!data || data.length === 0) {
      // Idempotent: it may already be assigned.
      const curr = await supabase
        .from('orders')
        .select('driver_id,status')
        .eq('id', orderId)
        .single();

      if (curr.data?.driver_id) {
        return {
          success: true,
          status: curr.data.status as OrderStatus,
          meta: { driverId: curr.data.driver_id },
        };
      }

      return { success: false, error: 'Driver assignment failed due to concurrent modification.' };
    }

    return { success: true, status: 'ready', meta: { driverId } };
  }

  /**
   * Driver accepts the job: transition READY -> IN_TRANSIT.
   */
  async driverAccepted(orderId: string, driverId: string): Promise<OrderTransitionResult> {
    const { error: assignError } = await supabase
      .from('orders')
      .update({
        driver_id: driverId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('status', 'ready');

    if (assignError) {
      return { success: false, error: assignError.message };
    }

    return updateOrderStatusIdempotent(orderId, 'in_transit', ['ready']);
  }

  async delivered(orderId: string): Promise<OrderTransitionResult> {
    return updateOrderStatusIdempotent(orderId, 'delivered', ['in_transit']);
  }

  async cancel(orderId: string): Promise<OrderTransitionResult> {
    return updateOrderStatusIdempotent(orderId, 'cancelled', ['pending', 'accepted', 'preparing', 'ready', 'in_transit']);
  }
}

export const orderStateMachine = new OrderStateMachine();

