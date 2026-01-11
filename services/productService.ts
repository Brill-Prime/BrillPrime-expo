
import { apiClient, ApiResponse } from './api';

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
    let endpoint = '/api/products';
    const queryParams = new URLSearchParams();

    if (filters) {
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.categoryId) queryParams.append('categoryId', filters.categoryId.toString());
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice.toString());
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    return apiClient.get(endpoint);
  }

  // Get product by ID
  async getProductById(productId: number): Promise<ApiResponse<Product>> {
    return apiClient.get<Product>(`/api/products/${productId}`);
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
    return apiClient.post<Product>('/api/products', data);
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
    return apiClient.put<Product>(`/api/products/${productId}`, data);
  }

  // Delete product (Merchant only)
  async deleteProduct(productId: number): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/api/products/${productId}`);
  }

  // Get all categories
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>('/api/categories');
  }

  // Create category (Admin only)
  async createCategory(data: {
    name: string;
    description: string;
    icon: string;
  }): Promise<ApiResponse<Category>> {
    return apiClient.post<Category>('/api/categories', data);
  }
}

export const productService = new ProductService();
export type { Product, Category };
