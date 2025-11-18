const API_BASE_URL = 'http://localhost:8000/api';
export const API_ORIGIN = 'http://localhost:8000';

export interface LoginRequest {
  phone_number: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: {
    id: number;
    name: string;
    phone_number: string;
    role: string;
  };
  token: string;
}

export interface Tipster {
  id: number;
  name: string;
  phone_number: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  admin_notes?: string;
  commission_config_id?: number | null;
  commission_config?: CommissionConfig | null;
  weekly_subscription_amount?: number | null;
  monthly_subscription_amount?: number | null;
  tipster_rating?: {
    win_rate: number;
    total_predictions: number;
    star_rating: number;
    rating_tier: string;
    subscribers_count: number;
  };
  created_at: string;
}

export interface Booker {
  id: number;
  name: string;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Prediction {
  id: number;
  tipster_id: number;
  booker_id?: number | null;
  title: string;
  description?: string;
  image_url: string;
  winning_slip_url?: string;
  betting_slip_url?: string | null;
  booking_codes?: any[];
  odds_total?: number;
  kickoff_at?: string;
  kickend_at?: string;
  confidence_level?: number;
  is_premium: boolean;
  status: 'draft' | 'published' | 'expired';
  result_status: 'pending' | 'won' | 'lost' | 'void' | 'refunded';
  result_notes?: string;
  result_updated_at?: string;
  result_updated_by?: string;
  publish_at?: string;
  lock_at?: string;
  created_at: string;
  tipster?: {
    id: number;
    name: string;
    phone_number: string;
  };
  booker?: Booker | null;
}

export interface Customer {
  id: number;
  name: string;
  phone_number: string;
  role: string;
  created_at: string;
  subscriptions?: Subscription[];
}

export interface Subscription {
  id: number;
  user_id: number;
  tipster_id: number;
  plan_type: 'daily' | 'weekly' | 'monthly';
  price: number;
  currency: string;
  start_at: string;
  end_at: string;
  status: 'active' | 'expired' | 'cancelled';
  commission_rate: number;
  commission_amount: number;
  tipster_earnings: number;
  commission_config_id?: number;
  created_at: string;
  tipster?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    name: string;
  };
  commission_config?: CommissionConfig;
}

export interface DashboardStats {
  total_tipsters: number;
  active_customers: number;
  predictions_today: number;
  success_rate: number;
  weekly_predictions: any[];
  subscription_trends: any[];
}

export interface AdminUser {
  id: number;
  name: string;
  phone_number: string;
  email?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface CommissionConfig {
  id: number;
  name: string;
  commission_rate: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalRequest {
  id: number;
  tipster: {
    id: number;
    name: string;
    phone_number: string;
  };
  amount: number;
  status: 'pending' | 'paid' | 'rejected' | 'cancelled';
  requested_at: string;
  paid_at?: string;
  admin?: {
    id: number;
    name: string;
  };
  notes?: string;
  created_at: string;
}

export interface WithdrawalSummary {
  total_pending: number;
  total_paid: number;
  total_rejected: number;
  total_amount_pending: number;
  total_amount_paid: number;
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Authentication
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<LoginResponse>(response);
  }

  async logout(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse(response);
  }

  async getProfile(): Promise<{ user: any }> {
    const response = await fetch(`${API_BASE_URL}/me`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ user: any }>(response);
  }

  // Tipsters
  async getTipsters(params?: { page?: number; search?: string; status?: string }): Promise<{ data: Tipster[]; pagination: any }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status) searchParams.append('status', params.status);

    const response = await fetch(`${API_BASE_URL}/admin/tipsters?${searchParams}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ data: Tipster[]; pagination: any }>(response);
  }

  async approveTipster(tipsterId: number, adminNotes?: string): Promise<{ message: string; tipster: any }> {
    const response = await fetch(`${API_BASE_URL}/admin/tipsters/${tipsterId}/approve`, {
      method: 'PATCH',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ admin_notes: adminNotes }),
    });
    return this.handleResponse<{ message: string; tipster: any }>(response);
  }

  async rejectTipster(tipsterId: number, adminNotes: string): Promise<{ message: string; tipster: any }> {
    const response = await fetch(`${API_BASE_URL}/admin/tipsters/${tipsterId}/reject`, {
      method: 'PATCH',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ admin_notes: adminNotes }),
    });
    return this.handleResponse<{ message: string; tipster: any }>(response);
  }

  async updateTipster(tipsterId: number, data: { name: string; phone_number: string; commission_config_id?: number | null; weekly_subscription_amount?: number | null; monthly_subscription_amount?: number | null }): Promise<{ message: string; tipster: any }> {
    const response = await fetch(`${API_BASE_URL}/admin/tipsters/${tipsterId}`, {
      method: 'PATCH',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<{ message: string; tipster: any }>(response);
  }

  // Predictions
  async getPredictions(params?: { 
    page?: number; 
    tipster_id?: number; 
    status?: string; 
    result_status?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<{ data: Prediction[]; pagination: any }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.tipster_id) searchParams.append('tipster_id', params.tipster_id.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.result_status) searchParams.append('result_status', params.result_status);
    if (params?.date_from) searchParams.append('date_from', params.date_from);
    if (params?.date_to) searchParams.append('date_to', params.date_to);

    const response = await fetch(`${API_BASE_URL}/admin/predictions?${searchParams}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ data: Prediction[]; pagination: any }>(response);
  }

  async createPrediction(data: {
    tipster_id: number;
    booker_id: number;
    title: string;
    description?: string;
    odds_total: number;
    kickoff_at: string;
    confidence_level: number;
    is_premium?: boolean;
    status?: 'draft' | 'published';
    result_status?: 'pending' | 'won' | 'lost' | 'void';
    booking_codes?: string[];
    betting_slip?: File;
  }): Promise<{ message: string; prediction: Prediction }> {
    const formData = new FormData();
    formData.append('tipster_id', data.tipster_id.toString());
    formData.append('booker_id', data.booker_id.toString());
    formData.append('title', data.title);
    if (data.description !== undefined && data.description !== null) {
      formData.append('description', data.description);
    }
    formData.append('odds_total', data.odds_total.toString());
    formData.append('kickoff_at', data.kickoff_at);
    formData.append('confidence_level', data.confidence_level.toString());
    formData.append('is_premium', data.is_premium ? '1' : '0');
    formData.append('status', data.status ?? 'draft');
    formData.append('result_status', data.result_status ?? 'pending');
    if (data.booking_codes && data.booking_codes.length > 0) {
      data.booking_codes.forEach((code, index) => {
        formData.append(`booking_codes[${index}]`, code);
      });
    }
    if (data.betting_slip) {
      formData.append('betting_slip', data.betting_slip);
    }

    const headers = { ...this.getAuthHeaders() } as Record<string, string>;
    if (headers['Content-Type']) {
      delete headers['Content-Type'];
    }

    const response = await fetch(`${API_BASE_URL}/admin/predictions`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return this.handleResponse<{ message: string; prediction: Prediction }>(response);
  }

  async getPredictionsNeedingResults(): Promise<{ predictions: Prediction[] }> {
    const response = await fetch(`${API_BASE_URL}/predictions/needing-results`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ predictions: Prediction[] }>(response);
  }

  async updatePredictionResult(predictionId: number, data: {
    result_status: 'won' | 'lost' | 'void' | 'refunded';
    result_notes?: string;
    winning_slip?: File;
  }): Promise<{ message: string; prediction: Prediction }> {
    const formData = new FormData();
    formData.append('result_status', data.result_status);
    if (data.result_notes) {
      formData.append('result_notes', data.result_notes);
    }
    if (data.winning_slip) {
      formData.append('winning_slip', data.winning_slip);
    }

    const response = await fetch(`${API_BASE_URL}/predictions/${predictionId}/update-result`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        // Remove Content-Type to let browser set it with boundary for FormData
      },
      body: formData,
    });
    return this.handleResponse<{ message: string; prediction: Prediction }>(response);
  }

  async uploadWinningSlip(file: File): Promise<{ message: string; winning_slip_url: string }> {
    const formData = new FormData();
    formData.append('winning_slip', file);

    const response = await fetch(`${API_BASE_URL}/predictions/upload-winning-slip`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        // Remove Content-Type to let browser set it with boundary for FormData
      },
      body: formData,
    });
    return this.handleResponse<{ message: string; winning_slip_url: string }>(response);
  }

  async updatePrediction(predictionId: number, data: Partial<Prediction> | FormData): Promise<{ message: string; prediction: Prediction }> {
    const isFormData = data instanceof FormData;
    
    const headers = this.getAuthHeaders();
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    // For FormData with file uploads, use POST with _method=PATCH
    if (isFormData) {
      (data as FormData).append('_method', 'PATCH');
      const response = await fetch(`${API_BASE_URL}/admin/predictions/${predictionId}`, {
        method: 'POST',
        headers: headers as HeadersInit,
        body: data as FormData,
      });
      return this.handleResponse<{ message: string; prediction: Prediction }>(response);
    }

    const response = await fetch(`${API_BASE_URL}/admin/predictions/${predictionId}`, {
      method: 'PATCH',
      headers: headers as HeadersInit,
      body: JSON.stringify(data),
    });
    return this.handleResponse<{ message: string; prediction: Prediction }>(response);
  }

  async deletePrediction(predictionId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/predictions/${predictionId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse(response);
  }

  // Bookers
  async getBookers(params?: { page?: number; search?: string; status?: string; simple?: boolean; per_page?: number }): Promise<{ data: Booker[]; pagination?: any }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.simple) searchParams.append('simple', '1');

    const response = await fetch(`${API_BASE_URL}/admin/bookers?${searchParams}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ data: Booker[]; pagination?: any }>(response);
  }

  async createBooker(data: { name: string; notes?: string; is_active?: boolean }): Promise<{ message: string; booker: Booker }> {
    const response = await fetch(`${API_BASE_URL}/admin/bookers`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<{ message: string; booker: Booker }>(response);
  }

  async updateBooker(bookerId: number, data: { name: string; notes?: string; is_active?: boolean }): Promise<{ message: string; booker: Booker }> {
    const response = await fetch(`${API_BASE_URL}/admin/bookers/${bookerId}`, {
      method: 'PATCH',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<{ message: string; booker: Booker }>(response);
  }

  async deleteBooker(bookerId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/bookers/${bookerId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse(response);
  }

  // Customers
  async getCustomers(params?: { page?: number; search?: string; status?: string }): Promise<{ data: Customer[]; pagination: any }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status) searchParams.append('status', params.status);

    const response = await fetch(`${API_BASE_URL}/admin/customers?${searchParams}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ data: Customer[]; pagination: any }>(response);
  }

  // Subscriptions
  async getSubscriptions(params?: { page?: number; tipster_id?: number; status?: string; search?: string }): Promise<{ data: Subscription[]; pagination: any }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.tipster_id) searchParams.append('tipster_id', params.tipster_id.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);

    const response = await fetch(`${API_BASE_URL}/admin/subscriptions?${searchParams}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ data: Subscription[]; pagination: any }>(response);
  }

  async createSubscriptionForCustomer(data: { user_id: number; tipster_id: number; plan_type: 'weekly' | 'monthly'; commission_config_id?: number | null }): Promise<{ message: string; subscription: Subscription }> {
    const response = await fetch(`${API_BASE_URL}/admin/subscriptions`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<{ message: string; subscription: Subscription }>(response);
  }

  async updateSubscriptionStatus(subscriptionId: number, status: string): Promise<{ message: string; subscription: Subscription }> {
    const response = await fetch(`${API_BASE_URL}/admin/subscriptions/${subscriptionId}/status`, {
      method: 'PATCH',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    return this.handleResponse<{ message: string; subscription: Subscription }>(response);
  }

  async registerUser(data: { 
    name: string; 
    phone_number: string; 
    password: string; 
    role: 'customer' | 'tipster';
    id_document?: string;
    commission_config_id?: number | null;
    weekly_subscription_amount?: number | null;
    monthly_subscription_amount?: number | null;
  }): Promise<{ message: string; user: any }> {
    const response = await fetch(`${API_BASE_URL}/admin/register-user`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<{ message: string; user: any }>(response);
  }

  async getTipsterIdDocument(tipsterId: number): Promise<{ id_document: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/tipsters/${tipsterId}/id-document`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ id_document: string }>(response);
  }

  // Notifications
  async sendNotification(data: { 
    type: 'tipster' | 'customer' | 'all';
    user_ids?: number[];
    title: string;
    message: string;
  }): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    await this.handleResponse(response);
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<DashboardStats>(response);
  }

  // Admin Users Management
  async getAdminUsers(params?: { page?: number; search?: string; status?: string }): Promise<{ data: AdminUser[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);

    const response = await fetch(`${API_BASE_URL}/admin/users?${queryParams}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ data: AdminUser[]; pagination: any }>(response);
  }

  async createAdmin(data: { name: string; phone_number: string; password: string; email?: string }): Promise<{ message: string; admin: AdminUser }> {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<{ message: string; admin: AdminUser }>(response);
  }

  async updateAdmin(adminId: number, data: Partial<AdminUser>): Promise<{ message: string; admin: AdminUser }> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${adminId}`, {
      method: 'PATCH',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<{ message: string; admin: AdminUser }>(response);
  }

  async deleteAdmin(adminId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${adminId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<void>(response);
  }

  async toggleAdminStatus(adminId: number): Promise<{ message: string; admin: AdminUser }> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${adminId}/toggle-status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ message: string; admin: AdminUser }>(response);
  }

  // Commission Management
  async getCommissionConfigs(params?: { page?: number; search?: string; status?: string }): Promise<{ data: CommissionConfig[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);

    const response = await fetch(`${API_BASE_URL}/admin/commission-configs?${queryParams}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ data: CommissionConfig[]; pagination: any }>(response);
  }

  async createCommissionConfig(data: { name: string; commission_rate: number; description?: string; is_active?: boolean }): Promise<{ message: string; config: CommissionConfig }> {
    const response = await fetch(`${API_BASE_URL}/admin/commission-configs`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<{ message: string; config: CommissionConfig }>(response);
  }

  async updateCommissionConfig(configId: number, data: Partial<CommissionConfig>): Promise<{ message: string; config: CommissionConfig }> {
    const response = await fetch(`${API_BASE_URL}/admin/commission-configs/${configId}`, {
      method: 'PATCH',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<{ message: string; config: CommissionConfig }>(response);
  }

  async deleteCommissionConfig(configId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/commission-configs/${configId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<void>(response);
  }

  async getCommissionStats(): Promise<{
    total_commission: number;
    active_configs_count: number;
    default_config: CommissionConfig;
    top_earning_tipsters: Array<{
      id: number;
      name: string;
      phone_number: string;
      total_earnings: number;
    }>;
  }> {
    const response = await fetch(`${API_BASE_URL}/admin/commission-stats`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Withdrawal Management Methods
  async getWithdrawals(params: string): Promise<{
    data: WithdrawalRequest[];
    summary: WithdrawalSummary;
    pagination: any;
    earnings_summary?: {
      total_earnings: number;
      available_balance: number;
      min_withdrawal_limit: number;
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/admin/withdrawals?${params}`, {
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{
      success: boolean;
      data: {
        data: WithdrawalRequest[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
      };
      summary: WithdrawalSummary;
      earnings_summary?: {
        total_earnings: number;
        available_balance: number;
        min_withdrawal_limit: number;
      };
    }>(response);
    return {
      data: data.data.data,
      summary: data.summary,
      pagination: {
        current_page: data.data.current_page,
        last_page: data.data.last_page,
        per_page: data.data.per_page,
        total: data.data.total,
      },
      earnings_summary: data.earnings_summary,
    };
  }

  async createWithdrawalRequest(data: { amount: number }): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/withdrawals`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async markWithdrawalPaid(withdrawalId: number, notes?: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/withdrawals/${withdrawalId}/mark-paid`, {
      method: 'PATCH',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes }),
    });
    return this.handleResponse(response);
  }

  async rejectWithdrawal(withdrawalId: number, notes: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/withdrawals/${withdrawalId}/reject`, {
      method: 'PATCH',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes }),
    });
    return this.handleResponse(response);
  }

  async getWithdrawalStats(): Promise<{
    stats: {
      total_requests: number;
      pending_requests: number;
      paid_requests: number;
      rejected_requests: number;
      cancelled_requests: number;
      total_amount_requested: number;
      total_amount_paid: number;
      total_amount_pending: number;
    };
    monthly_trends: any[];
    top_tipsters: any[];
  }> {
    const response = await fetch(`${API_BASE_URL}/admin/withdrawal-stats`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }
}

export const apiService = new ApiService(); 