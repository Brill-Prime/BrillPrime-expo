import { supabase } from '../config/supabase';
import { authService } from './authService';
import type { CommodityFormData } from '../utils/commodityUtils';

export interface Commodity {
  id: string;
  merchant_id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
  merchant?: {
    id: string;
    business_name: string;
    user_id: string;
  };
}

export type { CommodityFormData };

class CommodityService {
  private readonly STORAGE_BUCKET = 'product-images';

  /**
   * Upload image to Supabase Storage
   * @param imageUri - Local image URI or base64 data
   * @param commodityId - Unique commodity identifier
   * @returns Public URL of uploaded image
   */
  async uploadImage(imageUri: string, commodityId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Convert image URI to blob for upload
      let blob: Blob;
      
      if (imageUri.startsWith('data:')) {
        // Base64 data URL (from web)
        const response = await fetch(imageUri);
        blob = await response.blob();
      } else {
        // Regular file URI (from mobile)
        const response = await fetch(imageUri);
        blob = await response.blob();
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${commodityId}_${timestamp}.jpg`;
      const filePath = `commodities/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error('Storage upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(filePath);

      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      console.error('Error uploading image:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete image from Supabase Storage
   * @param imageUrl - Public URL of the image
   */
  async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `commodities/${fileName}`;

      const { error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove([filePath]);

      if (error) {
        console.error('Storage delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  /**
   * Get merchant ID for the current user
   */
  async getMerchantId(): Promise<{ success: boolean; merchantId?: string; error?: string }> {
    try {
      // Get Firebase user ID token
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get user data from storage
      const userData = await authService.getStoredUser();
      if (!userData || !userData.id) {
        return { success: false, error: 'User data not found' };
      }

      // Get user record from Supabase to find their database ID
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('firebase_uid', userData.id)
        .single();

      if (userError || !users) {
        console.error('Error fetching user:', userError);
        return { success: false, error: 'User not found in database. Please complete your profile.' };
      }

      // Get merchant record for this user
      const { data: merchant, error } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', users.id)
        .single();

      if (error) {
        console.error('Error fetching merchant:', error);
        return { success: false, error: error.message };
      }

      if (!merchant) {
        return { success: false, error: 'Merchant profile not found. Please complete merchant registration.' };
      }

      return { success: true, merchantId: merchant.id };
    } catch (error) {
      console.error('Error getting merchant ID:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Create a new commodity
   */
  async createCommodity(formData: CommodityFormData): Promise<{ success: boolean; commodity?: Commodity; error?: string }> {
    try {
      // Get merchant ID
      const merchantResult = await this.getMerchantId();
      if (!merchantResult.success || !merchantResult.merchantId) {
        return { success: false, error: merchantResult.error || 'Failed to get merchant ID' };
      }

      const commodityId = `commodity_${Date.now()}`;
      let imageUrl: string | undefined;

      // Upload image if provided
      if (formData.images.length > 0) {
        const uploadResult = await this.uploadImage(formData.images[0], commodityId);
        if (uploadResult.success && uploadResult.url) {
          imageUrl = uploadResult.url;
        } else {
          console.warn('Image upload failed, proceeding without image');
        }
      }

      // Create commodity in database
      const { data, error } = await supabase
        .from('products')
        .insert({
          merchant_id: merchantResult.merchantId,
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          unit: formData.unit,
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.availableQuantity) || 0,
          image_url: imageUrl,
          is_available: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, commodity: data as Commodity };
    } catch (error) {
      console.error('Error creating commodity:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update an existing commodity
   */
  async updateCommodity(
    commodityId: string,
    formData: CommodityFormData,
    oldImageUrl?: string
  ): Promise<{ success: boolean; commodity?: Commodity; error?: string }> {
    try {
      let imageUrl = oldImageUrl;

      // If new image provided, upload it and delete old one
      if (formData.images.length > 0 && formData.images[0] !== oldImageUrl) {
        // Delete old image
        if (oldImageUrl) {
          await this.deleteImage(oldImageUrl);
        }

        // Upload new image
        const uploadResult = await this.uploadImage(formData.images[0], commodityId);
        if (uploadResult.success && uploadResult.url) {
          imageUrl = uploadResult.url;
        }
      }

      // Update commodity in database
      const { data, error } = await supabase
        .from('products')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          unit: formData.unit,
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.availableQuantity) || 0,
          image_url: imageUrl,
        })
        .eq('id', commodityId)
        .select()
        .single();

      if (error) {
        console.error('Database update error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, commodity: data as Commodity };
    } catch (error) {
      console.error('Error updating commodity:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get commodity by ID
   */
  async getCommodityById(commodityId: string): Promise<{ success: boolean; commodity?: Commodity; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', commodityId)
        .single();

      if (error) {
        console.error('Database fetch error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, commodity: data as Commodity };
    } catch (error) {
      console.error('Error fetching commodity:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get all commodities for the current merchant
   */
  async getMerchantCommodities(): Promise<{ success: boolean; commodities?: Commodity[]; error?: string }> {
    try {
      const merchantResult = await this.getMerchantId();
      if (!merchantResult.success || !merchantResult.merchantId) {
        return { success: false, error: merchantResult.error || 'Failed to get merchant ID' };
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('merchant_id', merchantResult.merchantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database fetch error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, commodities: data as Commodity[] };
    } catch (error) {
      console.error('Error fetching commodities:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete commodity
   */
  async deleteCommodity(commodityId: string, imageUrl?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete image if exists
      if (imageUrl) {
        await this.deleteImage(imageUrl);
      }

      // Delete commodity from database
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', commodityId);

      if (error) {
        console.error('Database delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting commodity:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Toggle commodity availability
   */
  async toggleAvailability(commodityId: string, isAvailable: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: isAvailable })
        .eq('id', commodityId);

      if (error) {
        console.error('Database update error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error toggling availability:', error);
      return { success: false, error: String(error) };
    }
  }
}

export const commodityService = new CommodityService();
