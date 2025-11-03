import { ApiResponse } from './api';
import { authService } from './authService';
import { supabaseService } from './supabaseService';
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
  async createProduct(data: {
    name: string;
    description: string;
    price: number;
    categoryId: number;
    stock: number;
    images: string[];
    isActive?: boolean;
  }): Promise<ApiResponse<Product>> {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data: newProduct, error } = await supabaseService.supabase
      .from('products')
      .insert({ ...data, merchantId: user.uid, isActive: data.isActive ?? true })
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: newProduct as Product };
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