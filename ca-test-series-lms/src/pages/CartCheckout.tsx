import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShoppingCart, CheckCircle2, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRazorpay } from '@/hooks/use-razorpay';
import { paymentApi } from '@/lib/api/payment';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/contexts/CartContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_Rc4PnSfYRwhslI';

const CartCheckout: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { isLoaded: isRazorpayLoaded } = useRazorpay();
    const { user } = useAuth();
    const { cart, clearCart } = useCart();
    const [isProcessing, setIsProcessing] = useState(false);
    const [completedItems, setCompletedItems] = useState<string[]>([]);

    useEffect(() => {
        if (cart.items.length === 0 && completedItems.length === 0) {
            toast({
                title: 'Empty Cart',
                description: 'Your cart is empty. Please add items before checkout.',
                variant: 'destructive',
            });
            navigate('/cart');
        }
    }, []);

    const getLevelBadgeColor = (level: string) => {
        switch (level) {
            case 'FOUNDATION':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'INTERMEDIATE':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'FINAL':
                return 'bg-purple-100 text-purple-800 border-purple-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const formatLevel = (level: string) => {
        return level.charAt(0) + level.slice(1).toLowerCase();
    };

    const handlePayment = async () => {
        if (cart.items.length === 0) return;

        setIsProcessing(true);

        try {
            // Step 1: Create bulk cart order
            const orderData = await paymentApi.createCartOrder();
            const titles = cart.items.map(item => item.testSeries.title).join(', ');

            if (orderData.isFree) {
                toast({
                    title: 'Enrollment Successful!',
                    description: `All ${cart.items.length} free items have been added to your courses.`,
                });

                setCompletedItems(cart.items.map(item => item.testSeriesId));
                clearCart();

                setTimeout(() => {
                    navigate('/student/courses');
                }, 1500);
                return;
            }

            if (!isRazorpayLoaded) {
                toast({
                    title: 'Payment Gateway Loading',
                    description: 'Please wait while we load the payment gateway...',
                    variant: 'default',
                });
                return;
            }

            // Step 2: Initialize Razorpay checkout for the entire cart
            const options = {
                key: RAZORPAY_KEY_ID,
                amount: orderData.amount * 100, // Amount in paise
                currency: orderData.currency,
                name: 'CA Mantraa',
                description: titles.length > 250 ? titles.substring(0, 247) + '...' : titles,
                order_id: orderData.orderId,
                handler: async function (response: {
                    razorpay_order_id: string;
                    razorpay_payment_id: string;
                    razorpay_signature: string;
                }) {
                    try {
                        // Step 3: Verify payment
                        await paymentApi.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        toast({
                            title: 'Payment Successful!',
                            description: `All ${cart.items.length} items have been added to your courses.`,
                        });

                        setCompletedItems(cart.items.map(item => item.testSeriesId));
                        clearCart();

                        setTimeout(() => {
                            navigate('/student/courses');
                        }, 1500);
                    } catch (error) {
                        console.error('Payment verification failed:', error);
                        toast({
                            title: 'Payment Verification Failed',
                            description: 'Verification failed. Please contact support if amount was deducted.',
                            variant: 'destructive',
                        });
                    } finally {
                        setIsProcessing(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        toast({
                            title: 'Payment Cancelled',
                            description: 'Payment process was cancelled. No items were purchased.',
                        });
                        setIsProcessing(false);
                    },
                },
                prefill: {
                    name: user?.fullName || '',
                    email: user?.email || '',
                    contact: user?.mobile || '',
                },
                theme: {
                    color: '#2563eb',
                },
            };

            const razorpay = new (window as any).Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error('Payment initiation failed:', error);
            const errorMessage =
                (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
                (error as Error).message ||
                'Failed to initiate payment';

            toast({
                title: 'Payment Failed',
                description: errorMessage,
                variant: 'destructive',
            });
        }
        finally {
            setIsProcessing(false);
        }
    };

    if (cart.items.length === 0 && completedItems.length === 0) {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/cart')}
                        className="mb-6"
                        disabled={isProcessing}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Cart
                    </Button>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Left Column - Cart Items */}
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-2xl">Order Summary</CardTitle>
                                    <CardDescription>
                                        Review your cart items before proceeding to payment
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {cart.items.map((item, index) => (
                                        <div key={item.testSeriesId}>
                                            <div className="flex items-start gap-4">
                                                {item.testSeries.thumbnailUrl && (
                                                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                                        <img
                                                            src={item.testSeries.thumbnailUrl}
                                                            alt={item.testSeries.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h3 className="font-semibold text-base">{item.testSeries.title}</h3>
                                                            <Badge className={`mt-1 ${getLevelBadgeColor(item.testSeries.caLevel)}`}>
                                                                {formatLevel(item.testSeries.caLevel)}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {completedItems.includes(item.testSeriesId) && (
                                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                            )}
                                                            <span className="font-bold text-lg">₹{item.price}</span>
                                                        </div>
                                                    </div>
                                                    {item.testSeries.description && (
                                                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                                            {item.testSeries.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {index < cart.items.length - 1 && <Separator className="mt-4" />}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Security Notice */}
                            <Card className="bg-blue-50 border-blue-200">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3">
                                        <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-blue-900 mb-1">Secure Payment</h4>
                                            <p className="text-sm text-blue-800">
                                                Your payment information is encrypted and secure. Your transaction will be
                                                processed through Razorpay's secure payment gateway.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Price Summary & Payment */}
                        <div className="md:col-span-1">
                            <Card className="sticky top-6">
                                <CardHeader>
                                    <CardTitle>Price Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        {cart.items.map((item) => (
                                            <div key={item.testSeriesId} className="flex justify-between text-sm">
                                                <span className="text-gray-600 truncate max-w-[160px]">
                                                    {item.testSeries.title}
                                                </span>
                                                <span className="font-medium">₹{item.price}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">GST (18%)</span>
                                            <span className="font-medium text-green-600">Included</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Total ({cart.items.length} items)</span>
                                            <span className="text-blue-600">₹{cart.totalPrice}</span>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* User Details */}
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-sm">Billing Details</h4>
                                        <div className="space-y-1 text-sm text-gray-600">
                                            <p><span className="font-medium">Name:</span> {user?.fullName}</p>
                                            <p><span className="font-medium">Email:</span> {user?.email}</p>
                                            {user?.mobile && (
                                                <p><span className="font-medium">Phone:</span> {user?.mobile}</p>
                                            )}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Payment Button */}
                                    <Button
                                        onClick={handlePayment}
                                        disabled={isProcessing || !isRazorpayLoaded}
                                        className="w-full h-12 text-base"
                                        size="lg"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : !isRazorpayLoaded ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Loading Gateway...
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart className="mr-2 h-5 w-5" />
                                                Pay ₹{cart.totalPrice}
                                            </>
                                        )}
                                    </Button>

                                    <p className="text-xs text-gray-500 text-center">
                                        Secure payment via Razorpay
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default CartCheckout;
