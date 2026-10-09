import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cartApi, Cart } from '@/lib/api/cart';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface CartContextValue {
    cart: Cart;
    isLoading: boolean;
    addToCart: (testSeriesId: string, planId?: string) => Promise<boolean>;
    removeFromCart: (testSeriesId: string) => Promise<boolean>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
}

const defaultCart: Cart = { items: [], totalPrice: 0, itemCount: 0 };

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<Cart>(defaultCart);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { isLoggedIn, user } = useAuth();

    const refreshCart = useCallback(async () => {
        if (!isLoggedIn || user?.role !== 'STUDENTS') {
            setCart(defaultCart);
            return;
        }

        setIsLoading(true);
        try {
            const response = await cartApi.getCart();
            setCart(response.cart);
        } catch (error) {
            console.error('Failed to fetch cart:', error);
            setCart(defaultCart);
        } finally {
            setIsLoading(false);
        }
    }, [isLoggedIn, user?.role]);

    // Fetch cart on mount and when login state changes
    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    const addToCart = useCallback(async (testSeriesId: string, planId?: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            const response = await cartApi.addToCart(testSeriesId, planId);
            toast({
                title: 'Added to Cart',
                description: response.message,
            });
            await refreshCart();
            return true;
        } catch (error: any) {
            const message = error.response?.data?.error || 'Failed to add to cart';
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [toast, refreshCart]);

    const removeFromCart = useCallback(async (testSeriesId: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            const response = await cartApi.removeFromCart(testSeriesId);
            toast({
                title: 'Removed',
                description: response.message,
            });
            await refreshCart();
            return true;
        } catch (error: any) {
            const message = error.response?.data?.error || 'Failed to remove from cart';
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [toast, refreshCart]);

    const clearCartFn = useCallback(async () => {
        setIsLoading(true);
        try {
            await cartApi.clearCart();
            setCart(defaultCart);
            toast({
                title: 'Cart Cleared',
                description: 'All items removed from cart',
            });
        } catch (error: any) {
            const message = error.response?.data?.error || 'Failed to clear cart';
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    return (
        <CartContext.Provider
            value={{
                cart,
                isLoading,
                addToCart,
                removeFromCart,
                clearCart: clearCartFn,
                refreshCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
