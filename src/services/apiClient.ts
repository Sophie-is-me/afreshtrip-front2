// src/services/apiClient.ts

/**
 * REAL API CLIENT - Production Backend Integration
 *
 * This service handles all communication with the Afreshtrip backend API.
 * It manages Firebase authentication tokens and provides typed API methods.
 * 
 * Refactored architecture: Uses composition pattern with separate service modules
 * for better maintainability and separation of concerns.
 */

import { AuthService } from './api/authService';
import { UserService } from './api/userService';
import { BlogService } from './api/blogService';
import { PaymentService } from './api/paymentService';
import type {
  LocationInfo,
  WeatherInfo,
  WeatherForecast,
  CollectedAddress,
  NationInfo,
  ApiResponse,
  ResultIPageCollectAddress,
  User,
  UserDto,
  BlogVo,
  BlogCommentVo,
  BlogDto,
  VipOrder,
  VipType,
  IPageUsers
} from '../types/api';
import { HttpClient } from './api/httpClient';

/**
 * Base URL from backend documentation - Local Docker backend
 * the backend docs is accessible at /v3/api-docs
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Main API Client that composes all service modules
 * 
 * This client provides a unified interface to all API endpoints while
 * maintaining separation of concerns through composition.
 */
export class ApiClient {
  private readonly auth: AuthService;
  private readonly user: UserService;
  private readonly blog: BlogService;
  private readonly payment: PaymentService;

  constructor(baseUrl: string = API_BASE_URL) {
    // Initialize service modules with shared base URL
    this.auth = new AuthService(baseUrl);
    this.user = new UserService(baseUrl);
    this.blog = new BlogService(baseUrl);
    this.payment = new PaymentService(baseUrl);
  }

  // ============================================================================
  // AUTHENTICATION & HEALTH CHECKS (Delegated to AuthService)
  // ============================================================================

  /**
   * Check authentication service health
   */
  getAuthHealth(): Promise<string> {
    return this.auth.getAuthHealth();
  }

  /**
   * Get detailed auth status
   */
  getAuthStatus(): Promise<{
    firebaseEnabled: boolean;
    status: string;
    description: string;
  }> {
    return this.auth.getAuthStatus();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): Promise<boolean> {
    return this.auth.isAuthenticated();
  }

  // ============================================================================
  // USER MANAGEMENT (Delegated to UserService)
  // ============================================================================

  /**
   * Get current user info
   */
  getUserInfo(): Promise<User> {
    return this.user.getUserInfo();
  }

  /**
   * Update user profile
   */
  updateUserProfile(userData: UserDto): Promise<boolean> {
    return this.user.updateUserProfile(userData);
  }

  /**
    * Get user by email
    */
  getUserByEmail(userEmail: string): Promise<User> {
    return this.user.getUserByEmail(userEmail);
  }

  /**
   * Get all users with pagination
   */
  getUsers(page?: number, size?: number): Promise<IPageUsers> {
    return this.user.getUsers(page || 0, size || 20);
  }

  /**
   * Search users
   */
  searchUsers(keyword: string): Promise<User[]> {
    return this.user.searchUsers(keyword);
  }

  /**
    * Update user status
    */
  updateUserStatus(userEmail: string, isActive: boolean): Promise<boolean> {
    return this.user.updateUserStatus(userEmail, isActive);
  }


  // ============================================================================
  // BLOG MANAGEMENT (Delegated to BlogService)
  // ============================================================================

  /**
   * Get all blogs with pagination
   */
  getBlogs(page?: number, size?: number): Promise<{
    records: BlogVo[];
    total: number;
    size: number;
    current: number;
    pages: number;
  }> {
    return this.blog.getBlogs(page, size);
  }

  /**
   * Get blog by ID
   */
  getBlogById(blId: number): Promise<BlogCommentVo> {
    return this.blog.getBlogById(blId);
  }

  /**
   * Create new blog post
   */
  createBlog(blogData: BlogDto): Promise<BlogVo> {
    return this.blog.createBlog(blogData);
  }


  /**
   * Delete blog post
   */
  deleteBlog(blId: number): Promise<boolean> {
    return this.blog.deleteBlog(blId);
  }

  /**
   * Like/unlike blog post
   */
  toggleBlogLike(blId: number): Promise<boolean> {
    return this.blog.toggleBlogLike(blId);
  }

  /**
    * Get user's blogs
    */
  getUserBlogs(page?: number, size?: number): Promise<{
    records: BlogVo[];
    total: number;
    size: number;
    current: number;
    pages: number;
  }> {
    return this.blog.getUserBlogs(page, size);
  }

  /**
   * Add comment to blog
   */
  addComment(blId: number, content: string, replyToCommentId?: number): Promise<boolean> {
    return this.blog.addComment(blId, content, replyToCommentId);
  }


  // ============================================================================
  // PAYMENT SYSTEMS (Delegated to PaymentService)
  // ============================================================================

  /**
   * Generate AliPay payment URL
   */
  generateAliPayUrl(params: {
    orderNo: string;
    amount: number;
    subject: string;
  }): Promise<ApiResponse<{
    success: boolean;
    paymentUrl: string;
    orderNo: string;
    errorMessage?: string;
    errorCode?: string;
  }>> {
    return this.payment.generateAliPayUrl(params);
  }

  /**
   * Initiate AliPay payment
   */
  initiateAliPayPayment(paymentData: {
    subject: string;
    out_trade_no: string;
    total_amount: number;
    body?: string;
    product_code?: string;
  }): Promise<ApiResponse<{
    success: boolean;
    paymentUrl: string;
    orderNo: string;
    errorMessage?: string;
    errorCode?: string;
  }>> {
    return this.payment.initiateAliPayPayment(paymentData);
  }


  /**
   * Get VIP types
   */
  getVipTypes(): Promise<VipType[]> {
    return this.payment.getVipTypes();
  }

  /**
   * Get VIP order history
   */
  getVipOrders(page?: number, size?: number): Promise<{
    records: VipOrder[];
    total: number;
    size: number;
    current: number;
    pages: number;
  }> {
    return this.payment.getVipOrders(page, size);
  }

  /**
    * Create VIP order
    */
  createVipOrder(vipTypeId: number): Promise<VipOrder> {
    return this.payment.createVipOrder(vipTypeId);
  }

  /**
   * Cancel VIP order
   */
  cancelVipOrder(orderNo: string): Promise<boolean> {
    return this.payment.cancelVipOrder(orderNo);
  }

  /**
   * Check subscription status
   */
  getSubscriptionStatus(): Promise<{
    isSubscribed: boolean;
    vipType?: VipType;
    endTime?: string;
    remainingDays?: number;
  }> {
    return this.payment.getSubscriptionStatus();
  }

  // ============================================================================
  // UTILITY & LOCATION SERVICES
  // ============================================================================

  /**
   * Get location info by coordinates
   */
  async getLocationInfo(lat: number, lng: number): Promise<LocationInfo> {
    const httpClient = new HttpClient(API_BASE_URL);
    const response = await httpClient.get<{
      code: number;
      message: string;
      data: LocationInfo;
      timestamp?: number;
    }>(`/api/v1/location?lat=${lat}&lon=${lng}`);
    return response.data;
  }

  /**
   * Get weather info for location
   */
  async getWeatherInfo(city: string): Promise<WeatherInfo> {
    const httpClient = new HttpClient(API_BASE_URL);
    const response = await httpClient.get<{
      code: number;
      message: string;
      data: WeatherInfo;
      timestamp?: number;
    }>(`/app/weather/weather/realtime?cityCode=${encodeURIComponent(city)}`);
    return response.data;
  }

  /**
   * Get weather forecast
   */
  async getWeatherForecast(city: string): Promise<WeatherForecast> {
    const httpClient = new HttpClient(API_BASE_URL);
    const response = await httpClient.get<{
      code: number;
      message: string;
      data: WeatherForecast;
      timestamp?: number;
    }>(`/app/weather/weather/forecast?cityCode=${encodeURIComponent(city)}`);
    return response.data;
  }

  // ============================================================================
  // ADDRESS & NATION MANAGEMENT
  // ============================================================================

  /**
   * Get collected addresses with pagination
   */
  async getCollectedAddresses(page: number = 1, size: number = 10): Promise<{
    records: CollectedAddress[];
    total: number;
    size: number;
    current: number;
    pages: number;
  }> {
    const httpClient = new HttpClient(API_BASE_URL);
    const response = await httpClient.get<ResultIPageCollectAddress>(
      `/app/collectAddress/getCollectAddress?page=${page}&size=${size}`
    );
    return response.data;
  }

  /**
   * Add collected address
   */
  async addCollectedAddress(address: Omit<CollectedAddress, 'id' | 'userId' | 'createdAt'>): Promise<CollectedAddress> {
    const httpClient = new HttpClient(API_BASE_URL);
    const response = await httpClient.post<{
      code: number;
      message: string;
      data: CollectedAddress;
      timestamp?: number;
    }>('/app/collectAddress/addCollectAddress', address);
    return response.data;
  }

  /**
   * Delete collected address
   */
  async deleteCollectedAddress(id: number): Promise<boolean> {
    const httpClient = new HttpClient(API_BASE_URL);
    const response = await httpClient.delete<{
      code: number;
      message: string;
      data: boolean;
      timestamp?: number;
    }>(`/app/collectAddress/deleteCollectAddress?id=${id}`);
    return response.data;
  }

  /**
   * Get nations list
   */
  async getNations(page: number = 1, size: number = 100): Promise<NationInfo[]> {
    const httpClient = new HttpClient(API_BASE_URL);
    const response = await httpClient.get<{
      code: number;
      message: string;
      data: {
        records: NationInfo[];
        total: number;
        size: number;
        current: number;
        pages: number;
      };
      timestamp?: number;
    }>(`/app/nation/getNationList?page=${page}&size=${size}`);
    return response.data.records;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================



  // ============================================================================
  // BACKWARDS COMPATIBILITY METHODS (deprecated, use service-specific methods)
  // ============================================================================

  /**
   * @deprecated Use blog.getBlogs() instead
   */
  async getBlogList(page?: number, size?: number) {
    return this.getBlogs(page, size);
  }

  /**
   * @deprecated Use blog.createBlog() instead
   */
  async createBlogPost(blogData: BlogDto) {
    return this.createBlog(blogData);
  }

  /**
   * @deprecated Use payment.getSubscriptionStatus() instead
   */
  async getSubscriptionInfo() {
    return this.getSubscriptionStatus();
  }

  /**
   * @deprecated Use payment.getVipTypes() instead
   */
  async getVipPackages() {
    return this.getVipTypes();
  }

  /**
   * @deprecated Use payment.createVipOrder() instead
   */
  async purchaseVip(vipTypeId: number) {
    return this.createVipOrder(vipTypeId);
  }

  /**
   * @deprecated Use user.getUsers() instead
   */
  async getUsersList(page?: number, size?: number) {
    return this.getUsers(page, size);
  }

  /**
   * @deprecated Use user.searchUsers() instead
   */
  async searchUsersByKeyword(keyword: string) {
    return this.searchUsers(keyword);
  }

  /**
   * @deprecated Use payment.getSubscriptionStatus() instead
   */
  async getVipEndTime(): Promise<string> {
    const status = await this.getSubscriptionStatus();
    return status.endTime || '';
  }

  /**
   * @deprecated Use payment.cancelVipOrder() instead
   */
  async deleteVipOrder(orderNo: string): Promise<boolean> {
    return this.cancelVipOrder(orderNo);
  }

  /**
   * @deprecated Free trial activation not implemented
   */
  async activateFreeVipTrial(): Promise<boolean> {
    throw new Error('Free trial activation not implemented');
  }

  /**
   * @deprecated Stripe payment not implemented
   */
  async createStripePayment(_params: {
    amount: number;
    currency: string;
    description: string;
    orderId?: string;
  }): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
    throw new Error(`Stripe payment not implemented ${JSON.stringify(_params)}`);
  }

  /**
   * @deprecated VIP Stripe payment not implemented
   */
  async createVipStripePayment(_vipTypeId: number): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
    throw new Error(`VIP Stripe payment not implemented ${JSON.stringify(_vipTypeId)}`);
  }

  /**
   * @deprecated Payment status check not implemented
   */
  async checkPaymentStatus(_orderNo: string): Promise<{ status: string; success: boolean }> {
    throw new Error(`Payment status check not implemented ${JSON.stringify(_orderNo)}`);
  }

  /**
   * @deprecated Use weather.getWeatherInfo() instead
   */
  async getRealtimeWeather(cityCode: string): Promise<WeatherInfo> {
    return this.getWeatherInfo(cityCode);
  }

  /**
   * @deprecated File upload not implemented in refactored structure
   */
  async uploadFile(_file?: File): Promise<{ code: number; data: string }> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // This is a placeholder implementation
    // File upload functionality should be implemented in a separate service
    throw new Error(`File upload not implemented in refactored API client ${JSON.stringify(_file)}`);
  }
}

// Export singleton instance for convenience
export const apiClient = new ApiClient();

// Re-export error classes for backwards compatibility
export { ApiError } from './api/errors';

// Export all types for backwards compatibility
export type {
  User,
  UserDto,
  BlogVo,
  BlogCommentVo,
  BlogDto,
  BlogPost,
  VipOrder,
  VipType,
  PaymentResponse,
  LocationInfo,
  WeatherInfo,
  WeatherForecast,
  CollectedAddress,
  NationInfo,
  UserInfo // alias for User
} from '../types/api';