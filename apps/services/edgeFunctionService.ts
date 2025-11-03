
import { supabase } from '../config/supabase';

export class EdgeFunctionService {
  /**
   * Process payment through edge function
   */
  static async processPayment(orderId: string, amount: number, paymentMethod: string) {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await supabase.functions.invoke('process-payment', {
      body: {
        orderId,
        amount,
        paymentMethod,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Send notification through edge function
   */
  static async sendNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    data?: any
  ) {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await supabase.functions.invoke('send-notifications', {
      body: {
        userId,
        title,
        message,
        type,
        data,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Verify KYC through edge function
   */
  static async verifyKYC(userId: string, documents: any) {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await supabase.functions.invoke('verify-kyc', {
      body: {
        userId,
        documents,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Generic function invoker
   */
  static async invoke<T = any>(functionName: string, payload: any): Promise<T> {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
    });

    if (error) {
      throw error;
    }

    return data as T;
  }
}

export const edgeFunctionService = EdgeFunctionService;
