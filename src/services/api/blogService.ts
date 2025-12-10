// src/services/api/blogService.ts

import { HttpClient } from './httpClient';
import type {
  BlogVo,
  BlogCommentVo,
  BlogDto,
  ResultIPageBlogVo,
  ResultBlogCommentVo,
  Comment,
  ResultCommentVo
} from '../../types/api';

/**
 * Blog service for handling blog-related endpoints
 */
export class BlogService extends HttpClient {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  /**
   * Get all blogs with pagination
   */
  async getBlogs(page: number = 1, size: number = 10): Promise<{
    records: BlogVo[];
    total: number;
    size: number;
    current: number;
    pages: number;
  }> {
    const response = await this.get<ResultIPageBlogVo>(
      `/api/v1/blogs?current=${page}&size=${size}`,
      { requiresAuth: false }
    );
    return response.data;
  }

  /**
   * Get blog by ID
   */
  async getBlogById(blId: number): Promise<BlogCommentVo> {
    const response = await this.get<ResultBlogCommentVo>(`/api/v1/blogs/${blId}`, {
      requiresAuth: false
    });
    return response.data;
  }

  /**
   * Create new blog post
   */
  async createBlog(blogData: BlogDto): Promise<BlogVo> {
    const response = await this.post<{
      code: number;
      message: string;
      data: BlogVo;
      timestamp?: number;
    }>('/api/v1/blogs', blogData);
    return response.data;
  }

  /**
   * Delete blog post
   */
  async deleteBlog(blId: number): Promise<boolean> {
    const response = await this.delete<{
      code: number;
      message: string;
      data: boolean;
      timestamp?: number;
    }>(`/api/v1/blogs/${blId}`);
    return response.data;
  }

  /**
   * Like/unlike blog post
   */
  async toggleBlogLike(blId: number): Promise<boolean> {
    const response = await this.post<{
      code: number;
      message: string;
      data: boolean;
      timestamp?: number;
    }>(`/api/v1/blogs/${blId}/like`);
    return response.data;
  }
  
  /**
   * Full update of existing blog post (Replaces all fields)
   * Endpoint: PUT /api/v1/blogs/{id}
   */
  async updateBlog(blId: number, blogData: BlogDto): Promise<boolean> {
    const response = await this.put<{
      code: number;
      message: string;
      data: boolean;
      timestamp?: number;
    }>(`/api/v1/blogs/${blId}`, blogData);
    return response.data;
  }

  /**
   * Partial update of existing blog post
   * Only updates fields provided in the `updates` object.
   * Endpoint: PATCH /api/v1/blogs/{id}
   */
  async patchBlog(blId: number, updates: Partial<BlogDto>): Promise<boolean> {
    const response = await this.patch<{
      code: number;
      message: string;
      data: boolean;
      timestamp?: number;
    }>(`/api/v1/blogs/${blId}`, updates);
    return response.data;
  }

  /**
   * Get user's blogs
   */
  async getUserBlogs(page: number = 1, size: number = 10): Promise<{
    records: BlogVo[];
    total: number;
    size: number;
    current: number;
    pages: number;
  }> {
    const response = await this.get<ResultIPageBlogVo>(
      `/api/v1/blogs/my?current=${page}&size=${size}`
    );
    return response.data;
  }

  /**
   * Add comment to blog
   */
  async addComment(blId: number, content: string, replyToCommentId?: number): Promise<Comment> {
    const params = new URLSearchParams({ content });
    if (replyToCommentId !== undefined) {
      params.append('replyToCommentId', replyToCommentId.toString());
    }
    const response = await this.post<ResultCommentVo>(`/api/v1/blogs/${blId}/comments?${params}`, {});
    return response.data;
  }

  /**
   * Toggle like on comment
   */
  async toggleCommentLike(commentId: number): Promise<boolean> {
    const response = await this.post<{
      code: number;
      message: string;
      data: boolean;
      timestamp?: number;
    }>(`/api/v1/blogs/comments/${commentId}/like`);
    return response.data;
  }
}