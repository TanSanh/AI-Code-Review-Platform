const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data;
  }

  // Auth
  async register(email: string, name: string, password: string) {
    return this.request('/api/v1/auth/register', {
      method: 'POST',
      body: { email, name, password },
    });
  }

  async login(email: string, password: string) {
    return this.request('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async getProfile() {
    return this.request('/api/v1/auth/me');
  }

  // Reviews
  async createReview(data: { title: string; description?: string; language: string; fileName: string; code: string }) {
    return this.request('/api/v1/reviews', {
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
    return this.request(`/api/v1/reviews${query ? `?${query}` : ''}`);
  }

  async getReview(id: string) {
    return this.request(`/api/v1/reviews/${id}`);
  }

  async deleteReview(id: string) {
    return this.request(`/api/v1/reviews/${id}`, { method: 'DELETE' });
  }

  async reReview(id: string) {
    return this.request(`/api/v1/reviews/${id}/review`, { method: 'POST' });
  }

  // Issues
  async getIssues(reviewId: string) {
    return this.request(`/api/v1/reviews/${reviewId}/issues`);
  }

  async toggleIssue(reviewId: string, issueId: string) {
    return this.request(`/api/v1/reviews/${reviewId}/issues/${issueId}`, {
      method: 'PATCH',
    });
  }

  // Comments
  async getComments(reviewId: string) {
    return this.request(`/api/v1/reviews/${reviewId}/comments`);
  }

  async createComment(reviewId: string, data: { content: string; lineRef?: number; parentId?: string }) {
    return this.request(`/api/v1/reviews/${reviewId}/comments`, {
      method: 'POST',
      body: data,
    });
  }

  // Analytics
  async getAnalyticsOverview() {
    return this.request('/api/v1/analytics/overview');
  }

  async getAnalyticsTrends() {
    return this.request('/api/v1/analytics/trends');
  }

  async getAnalyticsLanguages() {
    return this.request('/api/v1/analytics/languages');
  }
}

export const api = new ApiClient(API_BASE);
