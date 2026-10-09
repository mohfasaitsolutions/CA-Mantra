import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShoppingCart, CheckCircle2, Clock, BookOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useRazorpay } from '@/hooks/use-razorpay';
import { useAuth } from '@/hooks/use-auth';
import { paymentApi } from '@/lib/api/payment';

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

interface BuySummaryProps {
  testSeries: TestSeriesData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_Rc4PnSfYRwhslI';

const BuySummary: React.FC<BuySummaryProps> = ({
  testSeries,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isLoaded: isRazorpayLoaded } = useRazorpay();
  const [isProcessing, setIsProcessing] = useState(false);

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

    setIsProcessing(true);

    try {
      // Step 1: Create order
      const orderData = await paymentApi.createOrder(testSeries._id);

      if (orderData.isFree) {
        toast({
          title: 'Enrollment Successful!',
          description: 'Free test series has been added to your courses.',
        });

        onOpenChange(false);

        if (onSuccess) {
          onSuccess();
        }

        setTimeout(() => {
          navigate('/student/courses');
        }, 1000);
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

      // Step 2: Initialize Razorpay checkout
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderData.amount * 100, // Amount in paise
        currency: orderData.currency,
        name: 'CA Mantraa',
        description: orderData.testSeriesTitle || testSeries.title,
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

            onOpenChange(false);
            
            if (onSuccess) {
              onSuccess();
            }

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
    finally {
      setIsProcessing(false);
    }
  };

  if (!testSeries) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold">Order Summary</DialogTitle>
              <DialogDescription className="mt-2">
                Review your purchase details before proceeding to payment
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Test Series Details */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {testSeries.thumbnailUrl && (
                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  <img
                    src={testSeries.thumbnailUrl}
                    alt={testSeries.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg line-clamp-2">{testSeries.title}</h3>
                {testSeries.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{testSeries.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getLevelBadgeColor(testSeries.caLevel)}>
                    {formatLevel(testSeries.caLevel)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700">
                  {testSeries.totalTests} Test{testSeries.totalTests !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700">
                  {testSeries.validity?.isUnlimited
                    ? 'Unlimited Validity'
                    : `${testSeries.validity?.days || 365} Days Access`}
                </span>
              </div>

              {testSeries.attempts && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-700">
                    {testSeries.attempts.isUnlimited
                      ? 'Unlimited Attempts'
                      : `${testSeries.attempts.count} Attempts per Test`}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Price Details */}
          <div className="space-y-3">
            <h4 className="font-semibold">Price Details</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Course Price</span>
                <span className="font-medium">₹{testSeries.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">GST (18%)</span>
                <span className="font-medium text-green-600">Included</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total Amount</span>
                <span className="text-blue-600">₹{testSeries.price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Secure Payment:</strong> Your payment information is encrypted and secure. You
              will be redirected to Razorpay's secure payment gateway.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing || !isRazorpayLoaded}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : !isRazorpayLoaded ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Proceed to Pay ₹{testSeries.price.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BuySummary;
