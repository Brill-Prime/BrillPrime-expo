import { ApiResponse } from './api';
import { authService } from './authService';
import { supabaseService } from './supabaseService';
import { firebaseSupabaseSync } from './firebaseSupabaseSync';
import { auth } from '../config/firebase';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  stock: number;
  images: string[];
  isActive: boolean;
  merchantId: number;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: number;
    name: string;
    description: string;
    icon: string;
  };
  merchant?: {
    id: number;
    name: string;
    profilePicture?: string;
  };
}

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
}

// Define a type for the product data used in the API request,
// as it might differ slightly from the Product interface (e.g., imageUrl instead of images)
interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  categoryId: number;
  stock: number;
  imageUrl: string; // Assuming imageUrl is used in API, adjust if it's different
  isActive?: boolean;
}


class ProductService {
  // Get all products
  async getProducts(filters?: {
    page?: number;
    limit?: number;
    categoryId?: number;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<ApiResponse<{
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    const { page = 1, limit = 10, categoryId, search, minPrice, maxPrice } = filters || {};

    let query = supabaseService.supabase.from('products').select(`
      id, name, description, price, categoryId, stock, images, isActive, merchantId, createdAt, updatedAt,
      category:categories (id, name, description, icon),
      merchant:merchants (id, name, profilePicture)
    `).eq('isActive', true);

    if (categoryId) {
      query = query.eq('categoryId', categoryId);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (minPrice !== undefined) {
      query = query.gte('price', minPrice);
    }
    if (maxPrice !== undefined) {
      query = query.lte('price', maxPrice);
    }

    const { data, count, error } = await query
      .range((page - 1) * limit, page * limit - 1)
      .returns<Product[]>();

    if (error) {
      return { success: false, error: error.message };
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return {
      success: true,
      data: {
        products: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
        },
      },
    };
  }

  // Get product by ID
  async getProductById(productId: number): Promise<ApiResponse<Product>> {
    const { data, error } = await supabaseService.supabase
      .from('products')
      .select(`
        id, name, description, price, categoryId, stock, images, isActive, merchantId, createdAt, updatedAt,
        category:categories (id, name, description, icon),
        merchant:merchants (id, name, profilePicture)
      `)
      .eq('id', productId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data as Product };
  }

  // Create product (Merchant only)
  async createProduct(productData: CreateProductRequest): Promise<ApiResponse<Product>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    const result = await apiClient.post<Product>('/api/products', productData, {
      Authorization: `Bearer ${token}`,
    });

    // Sync to Supabase if successful
    if (result.success && result.data) {
      const user = auth.currentUser;
      if (user) {
        // Adjust the data structure to match what firebaseSupabaseSync.syncProduct expects
        // Based on the Product interface and the provided syncProduct structure in the changes,
        // it seems imageUrl is expected, and category/merchant might be nested objects.
        // Ensure this mapping is correct.
        firebaseSupabaseSync.syncProduct({
          id: result.data.id,
          merchantId: user.uid, // Assuming user.uid is the merchantId
          name: result.data.name,
          description: result.data.description,
          price: result.data.price,
          // Ensure category and merchant structures are correctly passed if needed by syncProduct
          // Here, we are passing the category object directly as it's available in result.data.category
          category: result.data.category,
          stock: result.data.stock,
          // Assuming imageUrl is derived from result.data.images or is directly available.
          // If result.data.images is an array, you might need to pick the first one or handle it differently.
          imageUrl: result.data.images && result.data.images.length > 0 ? result.data.images[0] : '',
          isActive: result.data.isActive ?? true, // Assuming isActive is part of the sync data
          createdAt: result.data.createdAt, // Assuming createdAt is part of the sync data
          updatedAt: result.data.updatedAt, // Assuming updatedAt is part of the sync data
        }).catch(err => console.error('Failed to sync product to Supabase:', err));
      }
    }

    return result;
  }


  // Update product (Merchant only)
  async updateProduct(productId: number, data: {
    name?: string;
    description?: string;
    price?: number;
    categoryId?: number;
    stock?: number;
    images?: string[];
    isActive?: boolean;
  }): Promise<ApiResponse<Product>> {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data: updatedProduct, error } = await supabaseService.supabase
      .from('products')
      .update(data)
      .eq('id', productId)
      .eq('merchantId', user.uid)
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Sync to Supabase if successful
    if (updatedProduct) {
      firebaseSupabaseSync.syncProduct({
        id: updatedProduct.id,
        merchantId: user.uid,
        name: updatedProduct.name,
        description: updatedProduct.description,
        price: updatedProduct.price,
        category: updatedProduct.category,
        stock: updatedProduct.stock,
        imageUrl: updatedProduct.images && updatedProduct.images.length > 0 ? updatedProduct.images[0] : '',
        isActive: updatedProduct.isActive,
        createdAt: updatedProduct.createdAt,
        updatedAt: updatedProduct.updatedAt,
      }).catch(err => console.error('Failed to sync product to Supabase:', err));
    }

    return { success: true, data: updatedProduct as Product };
  }

  // Delete product (Merchant only)
  async deleteProduct(productId: number): Promise<ApiResponse<{ message: string }>> {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { error } = await supabaseService.supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('merchantId', user.uid);

    if (error) {
      return { success: false, error: error.message };
    }

    // Optionally, you might want to trigger a delete sync to Supabase here if needed
    // firebaseSupabaseSync.deleteProduct(productId).catch(err => console.error('Failed to sync delete to Supabase:', err));

    return { success: true, data: { message: 'Product deleted successfully' } };
  }

  // Get all categories
  async getCategories(): Promise<ApiResponse<Category[]>> {
    const { data, error } = await supabaseService.supabase
      .from('categories')
      .select('*')
      .returns<Category[]>();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data || [] };
  }

  // Create category (Admin only)
  async createCategory(data: {
    name: string;
    description: string;
    icon: string;
  }): Promise<ApiResponse<Category>> {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    // In a real app, you'd add a check here to ensure the user is an admin
    // For now, we'll assume any authenticated user can create a category for simplicity

    const { data: newCategory, error } = await supabaseService.supabase
      .from('categories')
      .insert({ ...data })
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: newCategory as Category };
  }
}

export const productService = new ProductService();
export type { Product, Category };