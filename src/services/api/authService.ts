// src/services/api/authService.ts

import { HttpClient } from './httpClient';

/**
 * Authentication service for handling auth-related endpoints
 */
export class AuthService extends HttpClient {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  /**
   * Check authentication service health
   */
  async getAuthHealth(): Promise<string> {
    const response = await this.get<string>('/auth/health', { requiresAuth: false });
    return response;
  }

  /**
   * Get detailed auth status
   */
  async getAuthStatus(): Promise<{
    firebaseEnabled: boolean;
    status: string;
    description: string;
  }> {
    return this.get('/auth/status', { requiresAuth: false });
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const response = await this.get<{
        code: number;
        message: string;
        data: boolean;
        timestamp?: number;
      }>('/auth/check');
      return response.data;
    } catch {
      return false;
    }
  }
}