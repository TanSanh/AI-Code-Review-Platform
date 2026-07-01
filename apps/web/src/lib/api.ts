// Use empty string for relative URLs — Next.js proxy rewrites /api/* to backend
// Direct URL only used for Socket.io connection (must be absolute)
const API_BASE = '';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    timestamp: string;
    path: string;
  };
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.loadToken();
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    // Reload token from localStorage on each request (handles page refresh)
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (this.token) {
      requestHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle 401 Unauthorized - clear token and redirect to login
    if (response.status === 401) {
      this.setToken(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please login again.');
    }

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }

    // Unwrap the response - backend wraps in { success: true, data: {...} }
    return data.data;
  }

  // Auth
  async register(email: string, name: string, password: string) {
    return this.request<{ user: { id: string; email: string; name: string; role: string }; accessToken: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: { email, name, password },
    });
  }

  async login(email: string, password: string) {
    return this.request<{ user: { id: string; email: string; name: string; role: string }; accessToken: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async getProfile() {
    return this.request<{ id: string; email: string; name: string; role: string }>('/api/v1/auth/me');
  }

  // Reviews
  async createReview(data: { title: string; description?: string; language: string; fileName: string; code: string }) {
    return this.request<{ id: string; title: string; status: string }>('/api/v1/reviews', {
      method: 'POST',
      body: data,
    });
  }

  async getReviews(params?: { page?: number; limit?: number; status?: string; language?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.language) searchParams.set('language', params.language);

    const query = searchParams.toString();
    return this.request<{ data: unknown[]; meta: { page: number; limit: number; total: number; totalPages: number } }>(`/api/v1/reviews${query ? `?${query}` : ''}`);
  }

  async getReview(id: string) {
    return this.request<unknown>(`/api/v1/reviews/${id}`);
  }

  async deleteReview(id: string) {
    return this.request<unknown>(`/api/v1/reviews/${id}`, { method: 'DELETE' });
  }

  async reReview(id: string) {
    return this.request<unknown>(`/api/v1/reviews/${id}/review`, { method: 'POST' });
  }

  // Issues
  async getIssues(reviewId: string) {
    return this.request<unknown[]>(`/api/v1/reviews/${reviewId}/issues`);
  }

  async toggleIssue(reviewId: string, issueId: string) {
    return this.request<unknown>(`/api/v1/reviews/${reviewId}/issues/${issueId}`, {
      method: 'PATCH',
    });
  }

  // Comments
  async getComments(reviewId: string) {
    return this.request<unknown[]>(`/api/v1/reviews/${reviewId}/comments`);
  }

  async createComment(reviewId: string, data: { content: string; lineRef?: number; parentId?: string }) {
    return this.request<unknown>(`/api/v1/reviews/${reviewId}/comments`, {
      method: 'POST',
      body: data,
    });
  }

  // Analytics
  async getAnalyticsOverview() {
    return this.request<unknown>('/api/v1/analytics/overview');
  }

  async getAnalyticsTrends() {
    return this.request<unknown[]>('/api/v1/analytics/trends');
  }

  async getAnalyticsLanguages() {
    return this.request<unknown[]>('/api/v1/analytics/languages');
  }
}

export const api = new ApiClient(API_BASE);
