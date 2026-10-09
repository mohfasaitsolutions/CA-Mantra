import apiClient from './client';

export interface CartItem {
    testSeriesId: string;
    testSeries: {
        _id: string;
        title: string;
        description?: string;
        price: number;
        thumbnailUrl?: string;
        caLevel: string;
        planId?: string;
    };
    price: number;
    addedAt: string;
}

export interface Cart {
    items: CartItem[];
    totalPrice: number;
    itemCount: number;
}

export interface CartResponse {
    cart: Cart;
}

export interface CartActionResponse {
    message: string;
    cart: {
        itemCount: number;
        totalPrice: number;
    };
}

export const cartApi = {
    // Get current cart
    getCart: async (): Promise<CartResponse> => {
        const response = await apiClient.get('/cart');
        return response.data;
    },

    // Get cart count for header badge
    getCount: async (): Promise<{ count: number }> => {
        const response = await apiClient.get('/cart/count');
        return response.data;
    },

    // Add item to cart (planId optional - uses plan-discounted price when provided)
    addToCart: async (testSeriesId: string, planId?: string): Promise<CartActionResponse> => {
        const response = await apiClient.post('/cart/add', { testSeriesId, ...(planId ? { planId } : {}) });
        return response.data;
    },

    // Remove item from cart
    removeFromCart: async (testSeriesId: string): Promise<CartActionResponse> => {
        const response = await apiClient.delete(`/cart/${testSeriesId}`);
        return response.data;
    },

    // Clear entire cart
    clearCart: async (): Promise<{ message: string }> => {
        const response = await apiClient.delete('/cart');
        return response.data;
    },
};
