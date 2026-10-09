import apiClient from './client';

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  testSeriesId?: string;
  testSeriesIds?: string[];
  testSeriesTitle?: string;
  testSeriesTitles?: string;
  paymentId: string;
  enrollmentId?: string;
  isFree?: boolean;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  enrollmentId: string;
  paymentId: string;
}

export interface PaymentDetails {
  _id: string;
  studentId: string;
  testSeriesId: {
    _id: string;
    title: string;
    price: number;
    caLevel: string;
  };
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: 'CREATED' | 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  paymentMethod?: string;
  isVerified: boolean;
  verifiedAt?: string;
  enrollmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentHistoryResponse {
  payments: PaymentDetails[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const paymentApi = {
  /**
   * Create a Razorpay order for test series purchase
   */
  createOrder: async (testSeriesId: string): Promise<CreateOrderResponse> => {
    const response = await apiClient.post('/payments/create-order', { testSeriesId });
    return response.data;
  },

  /**
   * Create a Razorpay order for all items in current cart
   */
  createCartOrder: async (): Promise<CreateOrderResponse> => {
    const response = await apiClient.post('/payments/create-cart-order');
    return response.data;
  },

  /**
   * Verify Razorpay payment after checkout
   */
  verifyPayment: async (data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> => {
    const response = await apiClient.post('/payments/verify', data);
    return response.data;
  },

  /**
   * Get payment details by ID
   */
  getPaymentDetails: async (paymentId: string): Promise<PaymentDetails> => {
    const response = await apiClient.get(`/payments/${paymentId}`);
    return response.data;
  },

  /**
   * Get payment history for logged-in student
   */
  getPaymentHistory: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaymentHistoryResponse> => {
    const response = await apiClient.get('/payments/history', { params });
    return response.data;
  }
};
