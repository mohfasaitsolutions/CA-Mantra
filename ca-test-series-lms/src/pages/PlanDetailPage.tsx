import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Menu, ShoppingCart, Check, Clock, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/use-auth";
import { plansApi, Plan, TestSeriesItem } from "@/lib/api/plans";

const PlanDetailPage = () => {
    const { planId } = useParams<{ planId: string }>();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [plan, setPlan] = useState<Plan | null>(null);
    const [loadingPlan, setLoadingPlan] = useState(true);
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    const { cart, addToCart, isLoading: cartLoading } = useCart();

    // Fetch plan details with test series
    useEffect(() => {
        const loadPlan = async () => {
            if (!planId) return;
            setLoadingPlan(true);
            try {
                const response = await plansApi.getById(planId);
                setPlan(response.plan);
            } catch (error) {
                console.error("Failed to load plan:", error);
                navigate("/test-series");
            } finally {
                setLoadingPlan(false);
            }
        };
        loadPlan();
    }, [planId, navigate]);

    // Get active test series items
    const testSeriesItems = (plan?.testSeriesItems || []).filter(
        (item) => item.testSeries && item.testSeries.isActive
    );

    const isInCart = (testSeriesId: string) => {
        return cart.items.some((item) => item.testSeriesId === testSeriesId);
    };

    const getTotalTests = (series: { totalTests?: number; tests?: unknown[] }) => {
        const fromTotal = Number.isFinite(Number(series.totalTests)) ? Number(series.totalTests) : 0;
        const fromTestsArray = Array.isArray(series.tests) ? series.tests.length : 0;
        return Math.max(fromTotal, fromTestsArray);
    };

    const handleAddToCart = async (testSeriesId: string) => {
        if (!isLoggedIn) {
            navigate(`/login?redirect=${encodeURIComponent(`/plans/${planId}`)}`);
            return;
        }
        await addToCart(testSeriesId, planId);
    };

    if (loadingPlan) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                                Back
                            </Button>
                            <h1 className="text-2xl font-bold text-gray-800">{plan?.name}</h1>
                        </div>
                        <Link to="/cart">
                            <Button variant="outline" className="relative">
                                <ShoppingCart className="h-5 w-5 mr-2" />
                                Cart
                                {cart.itemCount > 0 && (
                                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                                        {cart.itemCount}
                                    </Badge>
                                )}
                            </Button>
                        </Link>
                    </div>
                </header>

                <main className="p-6">
                    {plan?.thumbnailUrl && (
                        <div className="mb-6 rounded-xl overflow-hidden shadow-md max-w-4xl max-h-80 border">
                            <img
                                src={plan.thumbnailUrl}
                                alt={plan.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {plan?.description && (
                        <p className="text-gray-600 mb-6 max-w-3xl">{plan.description}</p>
                    )}

                    <div className="mb-4 flex items-center gap-4">
                        <Badge variant="secondary" className="text-sm">
                            {testSeriesItems.length} Test Series
                        </Badge>
                        {cart.itemCount > 0 && (
                            <Link to="/cart">
                                <Badge variant="default" className="text-sm cursor-pointer">
                                    {cart.itemCount} in cart - ₹{cart.totalPrice}
                                </Badge>
                            </Link>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {testSeriesItems.map((item: TestSeriesItem) => {
                            const ts = item.testSeries!;
                            const tsId = item.testSeriesId || ts._id;

                            return (
                                <Card
                                    key={tsId}
                                    className="overflow-hidden flex flex-col h-full border transition-all hover:border-ca-primary hover:shadow-lg"
                                >
                                    <div className="flex-shrink-0">
                                        {ts.thumbnailUrl && (
                                            <img
                                                src={ts.thumbnailUrl}
                                                alt={ts.title}
                                                className="w-full h-40 object-cover"
                                            />
                                        )}
                                    </div>
                                    <CardHeader className="flex-shrink-0 pb-2">
                                        <CardTitle className="text-lg font-semibold line-clamp-2">
                                            {ts.title}
                                        </CardTitle>
                                        {ts.description && (
                                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                                {ts.description}
                                            </p>
                                        )}
                                    </CardHeader>
                                    <CardContent className="pt-0 flex flex-col flex-grow">
                                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                            <Badge variant="outline">{ts.caLevel}</Badge>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                <span>{getTotalTests(ts) || "—"} Tests</span>
                                            </div>
                                        </div>
                                        <div className="mt-auto pt-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-2xl font-bold text-ca-primary">
                                                        ₹{item.price}
                                                    </span>
                                                    {item.price < ts.price && (
                                                        <span className="ml-2 text-sm text-gray-400 line-through">
                                                            ₹{ts.price}
                                                        </span>
                                                    )}
                                                </div>
                                                {item.price < ts.price && (
                                                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                        {Math.round(((ts.price - item.price) / ts.price) * 100)}% OFF
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-2 w-full">
                                                <Link to={`/test-series/${tsId}`} className="flex-1">
                                                    <Button variant="outline" className="w-full">
                                                        Details
                                                    </Button>
                                                </Link>
                                                {isInCart(tsId) ? (
                                                    <Button variant="secondary" className="flex-1 w-full" disabled>
                                                        <Check className="w-4 h-4 mr-1" />
                                                        In Cart
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleAddToCart(tsId)}
                                                        className="flex-1 w-full bg-gradient-to-r from-primary to-accent"
                                                        disabled={cartLoading}
                                                    >
                                                        <ShoppingCart className="w-4 h-4 mr-1" />
                                                        Add to Cart
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {testSeriesItems.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">
                                No test series available in this plan.
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default PlanDetailPage;
