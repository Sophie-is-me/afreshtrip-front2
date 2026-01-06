// src/services/apiClient.ts

import { AuthService } from './api/authService';
import { UserService } from './api/userService';
import { BlogService } from './api/blogService';
import { PaymentService } from './api/paymentService';
import { StorageService } from './api/storageService';
import { unifiedSubscriptionService } from './subscription/UnifiedSubscriptionService';
import { FeatureService } from './api/featureService';

// Import Types
import type {
  LocationInfo,
  WeatherInfo,
  WeatherForecast,
  CollectedAddress,
  NationInfo,
  ResultIPageCollectAddress,
  User,
  UserDto,
  BlogVo,
  BlogCommentVo,
  BlogDto,
  Comment,
  VipOrder,
  IPageUsers
} from '../types/api';

import type { FeatureId } from '../types/features';
import type { SubscriptionUpdateResult, FeatureAccessResult, UpgradeSuggestion } from '../types/backend';
import type { UserSubscription } from '../types/subscription';
import type { SubscriptionPlanResponse } from '../types/api';
import { HttpClient } from './api/httpClient';

/**
 * API Base URLs for different deployment environments
 * 
 * International (GCP): Used for global users, Firebase auth
 * Chinese (Aliyun): Used for Chinese users, SMS/Email auth
 */
const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  }
  
  const isChineseVersion = import.meta.env.VITE_IS_CHINESE_VERSION === 'true';
  
  // Use different backends based on version
  return isChineseVersion 
    ? import.meta.env.VITE_ALIYUN_BACKEND_URL  // Chinese backend
    : import.meta.env.VITE_GCP_BACKEND_URL; // International backend
};

const API_BASE_URL = getApiBaseUrl();

console.log('Initializing API Client with base URL:', API_BASE_URL);
console.log('Environment DEV:', import.meta.env.DEV);
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('VITE_IS_CHINESE_VERSION:', import.meta.env.VITE_IS_CHINESE_VERSION);

/**
 * Main API Client that composes all service modules
 */
export class ApiClient {
  private readonly auth: AuthService;
  private readonly user: UserService;
  private readonly blog: BlogService;
  private readonly payment: PaymentService;
  private readonly storage: StorageService;
  // Removed subscription service - now using unified service directly
  private readonly feature: FeatureService;

  constructor(baseUrl: string = API_BASE_URL) {
    this.auth = new AuthService(baseUrl);
    this.user = new UserService(baseUrl);
    this.blog = new BlogService(baseUrl);
    this.payment = new PaymentService(baseUrl);
    this.storage = new StorageService(baseUrl);
    // Removed subscription service - now using unified service directly
    this.feature = new FeatureService(baseUrl);
  }

  // ============================================================================
  // AUTHENTICATION & HEALTH CHECKS
  // ============================================================================

  getAuthHealth(): Promise<string> {
    return this.auth.getAuthHealth();
  }

  getAuthStatus(): Promise<{
    firebaseEnabled: boolean;
    status: string;
    description: string;
  }> {
    return this.auth.getAuthStatus();
  }

  isAuthenticated(): Promise<boolean> {
    return this.auth.isAuthenticated();
  }

  // ============================================================================
  // SMS AUTHENTICATION (CHINESE MARKET)
  // ============================================================================

  sendSmsCode(phone: string): Promise<{
    code: number;
    message: string;
    data: null;
    timestamp?: number;
  }> {
    return this.auth.sendSmsCode(phone);
  }

  verifySmsCode(phone: string, code: string): Promise<{
    code: number;
    message: string;
    data: {
      token: string;
      userId: number;
      nickname: string;
      phone: string;
    };
    timestamp?: number;
  }> {
    return this.auth.verifySmsCode(phone, code);
  }

  // ============================================================================
  // EMAIL AUTHENTICATION (CHINESE MARKET)
  // ============================================================================

  sendEmailCode(email: string): Promise<{
    code: number;
    message: string;
    data: null;
    timestamp?: number;
  }> {
    return this.auth.sendEmailCode(email);
  }

  verifyEmailCode(email: string, code: string): Promise<{
    code: number;
    message: string;
    data: {
      token: string;
      userId: number;
      nickname: string;
      email: string;
    };
    timestamp?: number;
  }> {
    return this.auth.verifyEmailCode(email, code);
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  getUserInfo(): Promise<User> {
    return this.user.getUserInfo();
  }

  updateUserProfile(userData: UserDto): Promise<boolean> {
    return this.user.updateUserProfile(userData);
  }

  getUserByEmail(userEmail: string): Promise<User> {
    return this.user.getUserByEmail(userEmail);
  }

  getUsers(page?: number, size?: number): Promise<IPageUsers> {
    return this.user.getUsers(page || 0, size || 20);
  }

  searchUsers(keyword: string): Promise<User[]> {
    return this.user.searchUsers(keyword);
  }

  updateUserStatus(userEmail: string, isActive: boolean): Promise<boolean> {
    return this.user.updateUserStatus(userEmail, isActive);
  }

  // ============================================================================
  // BLOG MANAGEMENT
  // ============================================================================

  getBlogs(page?: number, size?: number): Promise<{
    records: BlogVo[];
    total: number;
    size: number;
    current: number;
    pages: number;
  }> {
    return this.blog.getBlogs(page, size);
  }

  getBlogById(blId: number): Promise<BlogCommentVo> {
    return this.blog.getBlogById(blId);
  }

  createBlog(blogData: BlogDto): Promise<boolean> {
    return this.blog.createBlog(blogData);
  }

  updateBlog(blId: number, blogData: BlogDto): Promise<boolean> {
    return this.blog.updateBlog(blId, blogData);
  }

  patchBlog(blId: number, updates: Partial<BlogDto>): Promise<boolean> {
    return this.blog.patchBlog(blId, updates);
  }

  deleteBlog(blId: number): Promise<boolean> {
    return this.blog.deleteBlog(blId);
  }

  toggleBlogLike(blId: number): Promise<boolean> {
    return this.blog.toggleBlogLike(blId);
  }

  getUserBlogs(page?: number, size?: number): Promise<{
    records: BlogVo[];
    total: number;
    size: number;
    current: number;
    pages: number;
  }> {
    return this.blog.getUserBlogs(page, size);
  }

  addComment(blId: number, content: string, replyToCommentId?: number): Promise<Comment> {
    return this.blog.addComment(blId, content, replyToCommentId);
  }

  toggleCommentLike(commentId: number): Promise<boolean> {
    return this.blog.toggleCommentLike(commentId);
  }

  // ============================================================================
  // PAYMENT SYSTEMS (UPDATED FLOW)
  // ============================================================================

  /**
   * Unified payment initiation (NEW)
   * @param vipType - VIP_WEEK | VIP_MONTH | VIP_QUARTER | VIP_YEAR
   * @param paymentMethod - ALIPAY | STRIPE
   */
  initiatePayment(vipType: 'VIP_WEEK' | 'VIP_MONTH' | 'VIP_QUARTER' | 'VIP_YEAR', paymentMethod: 'ALIPAY' | 'STRIPE'): Promise<{
    success: boolean;
    orderNo: string;
    paymentMethod: 'ALIPAY' | 'STRIPE';
    paymentHtml?: string;
    clientSecret?: string;
    errorMessage?: string;
    errorCode?: string;
  }> {
    return this.payment.initiatePayment(vipType, paymentMethod);
  }

  /**
   * Check payment status (UPDATED)
   * @param orderNo - Order number to check
   */
  checkPaymentStatus(orderNo: string): Promise<{
    success: boolean;
    isPaid: boolean;
    status: string;
    orderNo: string;
    message?: string;
  }> {
    return this.payment.checkPaymentStatus(orderNo);
  }

  /**
   * Get subscription information (UPDATED)
   */
  getSubscriptionInfo(): Promise<{
    success: boolean;
    status?: 'active' | 'expired';
    planId?: string;
    vipTypeId?: string;
    expiresAt?: string;
    autoRenew?: boolean;
    message?: string;
  }> {
    return this.payment.getSubscription();
  }

  /**
   * Activate free trial (NEW)
   */
  activateFreeTrial(): Promise<{
    success: boolean;
    message?: string;
    errorMessage?: string;
  }> {
    return this.payment.activateFreeTrial();
  }

  /**
   * Get order history (UPDATED)
   */
  getOrders(page?: number, size?: number): Promise<{
    success: boolean;
    data?: {
      records: VipOrder[];
      total: number;
      size: number;
      current: number;
      pages: number;
    };
    message?: string;
  }> {
    return this.payment.getOrders(page, size);
  }

  /**
   * Delete/cancel order (UPDATED)
   */
  deleteOrder(orderNo: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    return this.payment.deleteOrder(orderNo);
  }

  // ============================================================================
  // STORAGE & MEDIA SERVICES
  // ============================================================================

  uploadFile(file: File): Promise<string> {
    return this.storage.uploadFile(file);
  }

  getUserMedia(page: number = 1, size: number = 20): Promise<{
    images: string[];
    total: number;
    hasMore: boolean;
  }> {
    return this.storage.getUserMedia(page, size);
  }

  // ============================================================================
  // SUBSCRIPTION SERVICES
  // ============================================================================

  getSubscription(userId: string): Promise<UserSubscription | null> {
    return unifiedSubscriptionService.getUserSubscription(userId);
  }

  async updateSubscription(userId: string, request: { planId: string; paymentMethodId?: string }): Promise<SubscriptionUpdateResult> {
    // Map to unified service method
    const result = await unifiedSubscriptionService.purchaseVip(
      userId, 
      request.planId, 
      request.paymentMethodId === 'stripe' ? 'stripe' : 'alipay'
    );
    return {
      success: result.success,
      subscription: result.success ? {
        id: result.orderNo || `sub_${Date.now()}`,
        userId,
        planId: request.planId,
        status: 'active' as const,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
        autoRenew: true,
        paymentMethodId: request.paymentMethodId || 'alipay'
      } : {} as UserSubscription,
      error: result.error
    };
  }

  cancelSubscription(userId: string, reason?: string): Promise<void> {
    return unifiedSubscriptionService.cancelSubscription(userId, reason);
  }

  // ============================================================================
  // FEATURE SERVICES
  // ============================================================================

  checkFeatureAccess(userId: string, featureId: FeatureId): Promise<FeatureAccessResult> {
    return this.feature.checkFeatureAccess(userId, featureId);
  }

  getAccessibleFeatures(userId: string): Promise<FeatureId[]> {
    return this.feature.getUserAccessibleFeatures(userId);
  }

  getUpgradeSuggestions(userId: string, featureIds: FeatureId[]): Promise<Partial<Record<FeatureId, UpgradeSuggestion>>> {
    return this.feature.getUpgradeSuggestions(userId, featureIds);
  }

  getSubscriptionPlans(): Promise<SubscriptionPlanResponse[]> {
    return this.feature.getSubscriptionPlans();
  }

  // ============================================================================
  // UTILITY & LOCATION SERVICES
  // ============================================================================

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
}

// Export singleton instance
export const apiClient = new ApiClient();

// Re-export error classes
export { ApiError, SubscriptionRequiredError } from './api/errors';

// Export all types
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
  UserInfo
} from '../types/api';

// Export trip API service
export { tripApiService } from './api/tripApiService';