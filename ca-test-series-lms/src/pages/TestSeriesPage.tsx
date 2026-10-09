import { useEffect, useMemo, useState } from "react";
import { Menu, Search, Clock, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { Link, useNavigate } from "react-router-dom";
import { useTestSeries } from "@/hooks/use-test-series";
import { usePlans } from "@/hooks/use-plans";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/contexts/CartContext";
import { toast } from "react-hot-toast";

const TestSeriesPage = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<
    "all" | "FOUNDATION" | "INTERMEDIATE" | "FINAL"
  >("all");
  const [selectedPlan, setSelectedPlan] = useState<string>("all");
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { testSeries, fetchTestSeries, isLoading } = useTestSeries();
  const { plans, fetchPlans } = usePlans();
  const { cart, addToCart, removeFromCart, isLoading: cartLoading } = useCart();

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    fetchTestSeries({
      page: 1,
      limit: 24,
      caLevel: selectedLevel !== "all" ? selectedLevel : undefined,
      planId: selectedPlan !== "all" ? selectedPlan : undefined,
      isActive: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevel, selectedPlan]);

  const list = useMemo(() => {
    const lower = searchTerm.trim().toLowerCase();
    return testSeries.filter((ts) => {
      const matchesSearch =
        !lower ||
        ts.title?.toLowerCase().includes(lower) ||
        (ts.description || "").toLowerCase().includes(lower);
      const matchesLevel =
        selectedLevel === "all" || ts.caLevel === selectedLevel;
      return matchesSearch && matchesLevel;
    });
  }, [testSeries, searchTerm, selectedLevel]);

  const cartItemIds = useMemo(
    () => new Set(cart.items.map((item) => String(item.testSeriesId || item.testSeries?._id))),
    [cart.items]
  );

  const getTotalTests = (series: unknown) => {
    const s = series as { totalTests?: number; tests?: unknown[] };
    const fromTotal = Number.isFinite(Number(s.totalTests)) ? Number(s.totalTests) : 0;
    const fromTestsArray = Array.isArray(s.tests) ? s.tests.length : 0;
    return Math.max(fromTotal, fromTestsArray);
  };

  const buyNow = (seriesId: string) => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent("/test-series")}`);
      return;
    }

    // Redirect to payment checkout page
    navigate(`/payment/checkout?testSeriesId=${seriesId}`);
  };

  const handleAddToCart = async (seriesId: string) => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent("/test-series")}`);
      return;
    }
    const added = await addToCart(seriesId);
    if (added) {
      toast.success("Added to cart");
    }
  };

  const handleRemoveFromCart = async (seriesId: string) => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent("/test-series")}`);
      return;
    }
    const removed = await removeFromCart(seriesId);
    if (removed) {
      toast.success("Removed from cart");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role="student" />
      <MobileSidebar
        role="student"
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1">
        <header className="bg-white p-4 shadow-sm sticky top-0 z-10 text-center flex justify-between items-center">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">Marketplace</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/cart" className="relative">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Cart ({cart.itemCount})</span>
                {cart.itemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                    {cart.itemCount}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </header>

        <main className="p-6">
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search test series..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                value={selectedLevel}
                onValueChange={(
                  v: "all" | "FOUNDATION" | "INTERMEDIATE" | "FINAL"
                ) => setSelectedLevel(v)}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="FOUNDATION">Foundation</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="FINAL">Final</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={selectedPlan}
                onValueChange={(v) => setSelectedPlan(v)}
              >
                <SelectTrigger className="w-full md:w-56">
                  <SelectValue placeholder="Select Combo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Combos</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Browse Plans Section */}
            {plans.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Browse by Combo</h2>
                <div className="flex flex-wrap gap-2">
                  {plans.map((plan) => (
                    <Link key={plan.id} to={`/plans/${plan.id}`}>
                      <Badge
                        variant="outline"
                        className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-white transition-colors"
                      >
                        {plan.name}
                        {plan.testSeriesCount ? ` (${plan.testSeriesCount})` : ""}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={`skeleton-${i}`} className="h-72 animate-pulse" />
              ))}
            {!isLoading &&
              list.map((ts) => (
                <Card
                  key={ts.id}
                  className="overflow-hidden flex flex-col h-full group border transition-all hover:border-ca-primary hover:shadow-lg min-h-[450px]"
                >
                  <div className="flex-shrink-0">
                    {ts.thumbnailUrl && (
                      <img
                        src={ts.thumbnailUrl}
                        alt={ts.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>
                  <CardHeader className="flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold">
                        {ts.title}
                      </CardTitle>
                      <Badge variant="secondary">{ts.caLevel}</Badge>
                    </div>
                    {ts.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                        {ts.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col flex-grow">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Multiple tests</span>
                      </div>
                      <Badge variant="outline">
                        {getTotalTests(ts) || "—"}{" "}
                        Tests
                      </Badge>
                    </div>
                    <div className="mt-auto pt-2 space-y-3">
                      <div className="text-center">
                        <span className="text-2xl font-bold text-ca-primary">
                          ₹{ts.price}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 w-full">
                        {cartItemIds.has(String(ts.id || ts._id)) ? (
                          <Button
                            onClick={() => handleRemoveFromCart(String(ts.id || ts._id))}
                            variant="destructive"
                            className="flex-1 text-xs px-2"
                            disabled={cartLoading}
                          >
                            <ShoppingCart className="w-3 h-3 mr-1" /> Remove
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleAddToCart(String(ts.id || ts._id))}
                            variant="outline"
                            className="flex-1 text-xs px-2 border-ca-primary text-ca-primary hover:bg-ca-primary hover:text-white"
                            disabled={cartLoading}
                          >
                            <ShoppingCart className="w-3 h-3 mr-1" /> Add to Cart
                          </Button>
                        )}
                        <Button
                          onClick={() => buyNow(String(ts.id || ts._id))}
                          className="flex-1 bg-gradient-to-r from-primary to-accent text-xs px-2"
                        >
                          Buy Now
                        </Button>
                      </div>
                      <Link to={`/test-series/${ts.id || ts._id}`} className="block">
                        <Button variant="ghost" size="sm" className="w-full text-xs text-gray-500 hover:text-ca-primary">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {!isLoading && list.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No test series found matching your criteria.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TestSeriesPage;
