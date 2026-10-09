import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ShoppingCart, CheckCircle2, Clock, BookOpen, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRazorpay } from '@/hooks/use-razorpay';
import { paymentApi } from '@/lib/api/payment';
import { testSeriesApi } from '@/lib/api/testSeries';
import { useAuth } from '@/hooks/use-auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_Rc4PnSfYRwhslI';

interface TestSeriesData {
  _id: string;
  title: string;
  description?: string;
  price: number;
  caLevel: 'FOUNDATION' | 'INTERMEDIATE' | 'FINAL';
  totalTests: number;
  validity?: {
    isUnlimited: boolean;
    days?: number;
  };
  attempts?: {
    isUnlimited: boolean;
    count?: number;
  };
  thumbnailUrl?: string;
}

const PaymentCheckout: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const testSeriesId = searchParams.get('testSeriesId');
  const { toast } = useToast();
  const { isLoaded: isRazorpayLoaded } = useRazorpay();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testSeries, setTestSeries] = useState<TestSeriesData | null>(null);

  useEffect(() => {
    if (!testSeriesId) {
      toast({
        title: 'Invalid Request',
        description: 'No test series selected',
        variant: 'destructive',
      });
      navigate('/buy-now');
      return;
    }

    fetchTestSeriesDetails();
  }, [testSeriesId]);

  const fetchTestSeriesDetails = async () => {
    try {
      setIsLoading(true);
      const response = await testSeriesApi.getById(testSeriesId!);
      const ts = response.testSeries;
      setTestSeries({
        _id: ts.id as string,
        title: ts.title,
        description: ts.description,
        price: ts.price,
        caLevel: ts.caLevel as 'FOUNDATION' | 'INTERMEDIATE' | 'FINAL',
        totalTests: Math.max(
          Number.isFinite(Number((ts as { totalTests?: number }).totalTests))
            ? Number((ts as { totalTests?: number }).totalTests)
            : 0,
          Array.isArray(ts.tests) ? ts.tests.length : 0
        ),
        validity: ts.validity,
        attempts: ts.attempts,
        thumbnailUrl: ts.thumbnailUrl,
      });
    } catch (error) {
      console.error('Failed to fetch test series:', error);
      toast({
        title: 'Error',
        description: 'Failed to load test series details',
        variant: 'destructive',
      });
      navigate('/buy-now');
    } finally {
      setIsLoading(false);
    }
  };

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
    if (!testSeries) return;

    if (!isRazorpayLoaded) {
      toast({
        title: 'Payment Gateway Loading',
        description: 'Please wait while we load the payment gateway...',
        variant: 'default',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create order
      const orderData = await paymentApi.createOrder(testSeries._id);

      // Step 2: Initialize Razorpay checkout
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderData.amount * 100, // Amount in paise
        currency: orderData.currency,
        name: 'CA Mantraa',
        description: orderData.testSeriesTitle,
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

            // Success
            toast({
              title: 'Payment Successful!',
              description: 'Test series has been added to your courses.',
            });

            // Redirect to courses page
            setTimeout(() => {
              navigate('/student/courses');
            }, 1000);
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast({
              title: 'Payment Verification Failed',
              description:
                'There was an issue verifying your payment. Please contact support if amount was deducted.',
              variant: 'destructive',
            });
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            toast({
              title: 'Payment Cancelled',
              description: 'You have cancelled the payment process.',
            });
          },
        },
        prefill: {
          name: user?.fullName || '',
          email: user?.email || '',
          contact: user?.mobile || '',
        },
        notes: {
          testSeriesId: testSeries._id,
          testSeriesTitle: testSeries.title,
        },
        theme: {
          color: '#2563eb',
        },
      };

      const razorpay = new window.Razorpay(options);
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
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!testSeries) {
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
            onClick={() => navigate('/buy-now')}
            className="mb-6"
            disabled={isProcessing}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Button>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Left Column - Test Series Details */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Order Summary</CardTitle>
                  <CardDescription>
                    Review your purchase details before proceeding to payment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Test Series Details */}
                  <div className="flex items-start gap-4">
                    {testSeries.thumbnailUrl && (
                      <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <img
                          src={testSeries.thumbnailUrl}
                          alt={testSeries.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-xl mb-2">{testSeries.title}</h3>
                      {testSeries.description && (
                        <p className="text-sm text-gray-600 mb-3">{testSeries.description}</p>
                      )}
                      <Badge className={getLevelBadgeColor(testSeries.caLevel)}>
                        {formatLevel(testSeries.caLevel)}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Features */}
                  <div>
                    <h4 className="font-semibold mb-3">What's Included</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">Total Tests</p>
                          <p className="text-xs text-gray-600">
                            {testSeries.totalTests} Test{testSeries.totalTests !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">Validity</p>
                          <p className="text-xs text-gray-600">
                            {testSeries.validity?.isUnlimited
                              ? 'Unlimited'
                              : `${testSeries.validity?.days || 365} Days`}
                          </p>
                        </div>
                      </div>

                      {testSeries.attempts && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-sm">Attempts</p>
                            <p className="text-xs text-gray-600">
                              {testSeries.attempts.isUnlimited
                                ? 'Unlimited'
                                : `${testSeries.attempts.count} per Test`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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
                        Your payment information is encrypted and secure. You will be redirected to
                        Razorpay's secure payment gateway.
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
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Course Price</span>
                      <span className="font-medium">₹{testSeries.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">GST (18%)</span>
                      <span className="font-medium text-green-600">Included</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount</span>
                      <span className="text-blue-600">₹{testSeries.price.toFixed(2)}</span>
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
                        Pay ₹{testSeries.price.toFixed(2)}
                      </>
                    )}
                  </Button>
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

export default PaymentCheckout;
