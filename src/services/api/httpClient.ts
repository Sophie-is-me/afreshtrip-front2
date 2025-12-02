// src/services/api/httpClient.ts

import { auth } from '../../../lib/firebase/client';
import {
  AuthenticationError,
  NetworkError,
  TimeoutError,
  isApiError,
  createErrorFromResponse,
  createErrorFromApiResponse
} from './errors';

/**
 * Request configuration interface
 */
export interface RequestConfig extends RequestInit {
  requiresAuth?: boolean;
  timeout?: number;
}

/**
 * Base HTTP Client for API communication
 */
export class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get Firebase ID token for authenticated requests
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      return await user.getIdToken();
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Make HTTP request with automatic auth token handling
   */
  protected async request<T = unknown>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      requiresAuth = true,
      timeout = 30000,
      headers = {},
      ...restConfig
    } = config;

    // Build headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Merge additional headers
    if (headers) {
      Object.assign(requestHeaders, headers);
    }

    // Add auth token if required
    if (requiresAuth) {
      const token = await this.getAuthToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      } else if (requiresAuth) {
        throw new AuthenticationError();
      }
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...restConfig,
        headers: requestHeaders,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-2xx responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw createErrorFromResponse(response, errorData);
      }

      const data = await response.json();

      // Handle API-level errors (non-200 codes)
      if (data.code && data.code !== 200) {
        throw createErrorFromApiResponse(data);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (isApiError(error)) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new TimeoutError();
        }
        throw new NetworkError(error.message);
      }

      throw new NetworkError('Unknown error occurred');
    }
  }

  /**
   * GET request
   */
  async get<T = unknown>(
    endpoint: string,
    config: Omit<RequestConfig, 'method'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    config: Omit<RequestConfig, 'method'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    config: Omit<RequestConfig, 'method'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    endpoint: string,
    config: Omit<RequestConfig, 'method'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    config: Omit<RequestConfig, 'method'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}