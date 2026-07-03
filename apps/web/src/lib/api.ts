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

    const requestHeaders: Record<string, string> = { ...headers };

    // Only set Content-Type for methods with a body
    if (body) {
      requestHeaders['Content-Type'] = 'application/json';
    }

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
    return this.request<{
      id: string;
      email: string;
      name: string;
      bio: string | null;
      avatarUrl: string | null;
      role: string;
      createdAt: string;
      _count: { reviews: number; comments: number };
    }>('/api/v1/auth/me');
  }

  async updateProfile(name: string, bio?: string, avatarUrl?: string | null) {
    return this.request<{
      id: string;
      email: string;
      name: string;
      bio: string | null;
      avatarUrl: string | null;
      role: string;
      createdAt: string;
      _count: { reviews: number; comments: number };
    }>('/api/v1/auth/me', {
      method: 'PATCH',
      body: { name, bio, avatarUrl },
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/api/v1/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    });
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

  async updateReviewPrivacy(id: string, isPublic: boolean) {
    return this.request<{ id: string; isPublic: boolean }>(`/api/v1/reviews/${id}/privacy`, {
      method: 'PATCH',
      body: { isPublic },
    });
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

  // Community
  async getCommunityPosts(params?: {
    page?: number; limit?: number; language?: string;
    search?: string; sort?: 'latest' | 'popular'; authorId?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.language) searchParams.set('language', params.language);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.authorId) searchParams.set('authorId', params.authorId);

    const query = searchParams.toString();
    return this.request<{
      data: unknown[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/v1/community${query ? `?${query}` : ''}`);
  }

  async getCommunityPost(id: string) {
    return this.request<unknown>(`/api/v1/community/${id}`);
  }

  async createCommunityPost(data: {
    title: string; content: string; language?: string;
    tags?: string; reviewId?: string; imageUrl?: string;
  }) {
    return this.request<unknown>('/api/v1/community', {
      method: 'POST',
      body: data,
    });
  }

  async deleteCommunityPost(id: string) {
    return this.request<unknown>(`/api/v1/community/${id}`, { method: 'DELETE' });
  }

  async updateCommunityPost(id: string, data: {
    title: string; content: string; language?: string;
    tags?: string; imageUrl?: string; reviewId?: string;
  }) {
    return this.request<unknown>(`/api/v1/community/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async toggleCommunityLike(id: string) {
    return this.request<{ isLiked: boolean }>(`/api/v1/community/${id}/like`, {
      method: 'POST',
    });
  }

  async getCommunityComments(postId: string) {
    return this.request<unknown[]>(`/api/v1/community/${postId}/comments`);
  }

  async createCommunityComment(postId: string, data: { content: string; parentId?: string }) {
    return this.request<unknown>(`/api/v1/community/${postId}/comments`, {
      method: 'POST',
      body: data,
    });
  }

  async deleteCommunityComment(postId: string, commentId: string) {
    return this.request<unknown>(`/api/v1/community/${postId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async getNotifications(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    return this.request<{
      notifications: Array<{
        id: string;
        type: string;
        title: string;
        message: string;
        link: string | null;
        isRead: boolean;
        actor: { id: string; name: string; avatarUrl: string | null } | null;
        createdAt: string;
      }>;
      total: number;
      page: number;
      totalPages: number;
    }>(`/api/v1/notifications${query ? `?${query}` : ''}`);
  }

  async getUnreadNotificationCount() {
    return this.request<{ count: number }>('/api/v1/notifications/unread-count');
  }

  async markNotificationAsRead(id: string) {
    return this.request<unknown>(`/api/v1/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<unknown>('/api/v1/notifications/read-all', {
      method: 'PATCH',
    });
  }

  async deleteNotification(id: string) {
    return this.request<unknown>(`/api/v1/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  async getNotificationPreferences() {
    return this.request<{
      browserPush: boolean;
      email: boolean;
      sound: boolean;
      postComment: boolean;
      commentReply: boolean;
      postLike: boolean;
      reviewCompleted: boolean;
      reviewComment: boolean;
    }>('/api/v1/notifications/preferences');
  }

  async updateNotificationPreferences(data: Partial<{
    browserPush: boolean;
    email: boolean;
    sound: boolean;
    postComment: boolean;
    commentReply: boolean;
    postLike: boolean;
    reviewCompleted: boolean;
    reviewComment: boolean;
  }>) {
    return this.request<unknown>('/api/v1/notifications/preferences', {
      method: 'PATCH',
      body: data,
    });
  }

  // Public User Profile
  async getUserProfile(userId: string) {
    return this.request<{
      id: string;
      name: string;
      bio: string | null;
      avatarUrl: string | null;
      createdAt: string;
      totalLikes: number;
      _count: {
        reviews: number;
        comments: number;
        communityPosts: number;
        communityComments: number;
      };
    }>(`/api/v1/users/${userId}`);
  }

  async getUserPosts(userId: string, params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    return this.request<{
      data: unknown[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/v1/users/${userId}/posts${query ? `?${query}` : ''}`);
  }
}

export const api = new ApiClient(API_BASE);
