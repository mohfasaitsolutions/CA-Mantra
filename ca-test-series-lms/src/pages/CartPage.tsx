import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Menu, Trash2, ShoppingCart, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/use-auth";

const CartPage = () => {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [clearDialogOpen, setClearDialogOpen] = useState(false);
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    const { cart, removeFromCart, clearCart, isLoading } = useCart();

    const handleCheckout = () => {
        if (cart.items.length === 0) return;
        // Navigate to checkout with cart items
        navigate("/payment/cart-checkout");
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="p-8 text-center">
                        <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Login Required</h2>
                        <p className="text-gray-500 mb-4">
                            Please login to view your cart.
                        </p>
                        <Link to="/login?redirect=/cart">
                            <Button>Login</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar role="student" />
            <MobileSidebar
                role="student"
                isOpen={isMobileSidebarOpen}
                onClose={() => setIsMobileSidebarOpen(false)}
            />

            <div className="flex-1">
                <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden mr-2"
                                onClick={() => setIsMobileSidebarOpen(true)}
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate("/test-series")}
                                className="mr-4"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Continue Shopping
                            </Button>
                            <h1 className="text-2xl font-bold text-gray-800">
                                <ShoppingCart className="inline h-6 w-6 mr-2" />
                                Your Cart
                            </h1>
                        </div>
                        {cart.items.length > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => setClearDialogOpen(true)}
                                className="text-red-500 hover:text-red-600"
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Clear Cart
                            </Button>
                        )}
                    </div>
                </header>

                <main className="p-6">
                    {isLoading && cart.items.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : cart.items.length === 0 ? (
                        <div className="text-center py-12">
                            <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                            <h2 className="text-xl font-semibold text-gray-700 mb-2">
                                Your cart is empty
                            </h2>
                            <p className="text-gray-500 mb-6">
                                Browse our test series and add some to your cart.
                            </p>
                            <Link to="/test-series">
                                <Button>Browse Test Series</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Cart Items */}
                            <div className="lg:col-span-2 space-y-4">
                                {cart.items.map((item) => (
                                    <Card key={item.testSeriesId} className="overflow-hidden">
                                        <div className="flex flex-col sm:flex-row">
                                            {item.testSeries.thumbnailUrl && (
                                                <img
                                                    src={item.testSeries.thumbnailUrl}
                                                    alt={item.testSeries.title}
                                                    className="w-full sm:w-32 h-40 sm:h-32 object-cover flex-shrink-0"
                                                />
                                            )}
                                            <div className="flex-1 p-4 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                                        <div>
                                                            <h3 className="font-semibold text-lg">
                                                                {item.testSeries.title}
                                                            </h3>
                                                            <Badge variant="outline" className="mt-1">
                                                                {item.testSeries.caLevel}
                                                            </Badge>
                                                        </div>
                                                        <span className="text-xl font-bold text-ca-primary">
                                                            ₹{item.price}
                                                        </span>
                                                    </div>
                                                    {item.testSeries.description && (
                                                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                                            {item.testSeries.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center mt-4 pt-2 border-t sm:border-t-0">
                                                    <Link to={`/test-series/${item.testSeriesId}`}>
                                                        <Button variant="link" className="p-0 h-auto">
                                                            View Details
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeFromCart(item.testSeriesId)}
                                                        className="text-red-500 hover:text-red-600"
                                                        disabled={isLoading}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <Card className="sticky top-24">
                                    <CardHeader>
                                        <CardTitle>Order Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            {cart.items.map((item) => (
                                                <div
                                                    key={item.testSeriesId}
                                                    className="flex justify-between text-sm"
                                                >
                                                    <span className="truncate max-w-[200px]">
                                                        {item.testSeries.title}
                                                    </span>
                                                    <span>₹{item.price}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <hr />
                                        <div className="flex justify-between font-semibold text-lg">
                                            <span>Total</span>
                                            <span className="text-ca-primary">
                                                ₹{cart.totalPrice}
                                            </span>
                                        </div>
                                        <Button
                                            onClick={handleCheckout}
                                            className="w-full bg-gradient-to-r from-primary to-accent"
                                            size="lg"
                                        >
                                            Proceed to Checkout
                                        </Button>
                                        <p className="text-xs text-gray-500 text-center">
                                            Secure payment via Razorpay
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </main>

                {/* Clear Cart Dialog */}
                <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Clear Cart</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to remove all items from your cart? This
                                action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    clearCart();
                                    setClearDialogOpen(false);
                                }}
                                className="bg-red-500 hover:bg-red-600"
                            >
                                Clear Cart
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
};

export default CartPage;
