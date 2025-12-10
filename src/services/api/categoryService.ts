// src/services/api/categoryService.ts

import { HttpClient } from './httpClient';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  blogCount?: number;
}

/**
 * Category service for handling blog categories
 */
export class CategoryService extends HttpClient {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  /**
   * Get all active categories
   * @returns Promise<Category[]> - Array of categories
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response = await this.get<{
        code: number;
        message: string;
        data: Category[];
        timestamp?: number;
      }>('/api/v1/categories', { requiresAuth: false });
      return response.data;
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      // Return default categories as fallback
      return [
        { id: 1, name: 'Travel', slug: 'travel', color: '#3B82F6', icon: 'plane' },
        { id: 2, name: 'Food', slug: 'food', color: '#EF4444', icon: 'utensils' },
        { id: 3, name: 'Culture', slug: 'culture', color: '#8B5CF6', icon: 'landmark' },
        { id: 4, name: 'Adventure', slug: 'adventure', color: '#F59E0B', icon: 'mountain' },
        { id: 5, name: 'Nature', slug: 'nature', color: '#10B981', icon: 'tree' },
        { id: 6, name: 'City Guide', slug: 'city-guide', color: '#6B7280', icon: 'building' },
        { id: 7, name: 'Tips & Tricks', slug: 'tips-tricks', color: '#EC4899', icon: 'lightbulb' },
        { id: 8, name: 'Photography', slug: 'photography', color: '#6366F1', icon: 'camera' },
      ];
    }
  }

  /**
   * Get category by slug
   * @param slug - Category slug
   * @returns Promise<Category> - Category details
   */
  async getCategoryBySlug(slug: string): Promise<Category> {
    const response = await this.get<{
      code: number;
      message: string;
      data: Category;
      timestamp?: number;
    }>(`/api/v1/categories/${slug}`);
    return response.data;
  }

  /**
   * Get all categories (including inactive) for admin
   * @returns Promise<Category[]> - All categories
   */
  async getAllCategories(): Promise<Category[]> {
    const response = await this.get<{
      code: number;
      message: string;
      data: Category[];
      timestamp?: number;
    }>('/api/v1/categories/admin/all');
    return response.data;
  }

  /**
   * Create new category (admin only)
   * @param category - Category data
   * @returns Promise<Category> - Created category
   */
  async createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const response = await this.post<{
      code: number;
      message: string;
      data: Category;
      timestamp?: number;
    }>('/api/v1/categories/admin', category);
    return response.data;
  }

  /**
   * Update category (admin only)
   * @param id - Category ID
   * @param category - Updated category data
   * @returns Promise<Category> - Updated category
   */
  async updateCategory(id: number, category: Partial<Category>): Promise<Category> {
    const response = await this.put<{
      code: number;
      message: string;
      data: Category;
      timestamp?: number;
    }>(`/api/v1/categories/admin/${id}`, category);
    return response.data;
  }

  /**
   * Delete category (admin only)
   * @param id - Category ID
   * @returns Promise<boolean> - Success status
   */
  async deleteCategory(id: number): Promise<boolean> {
    const response = await this.delete<{
      code: number;
      message: string;
      data: boolean;
      timestamp?: number;
    }>(`/api/v1/categories/admin/${id}`);
    return response.data;
  }
}