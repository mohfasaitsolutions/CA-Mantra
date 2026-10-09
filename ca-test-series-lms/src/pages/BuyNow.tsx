import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Clock, ShoppingCart, Package, BookOpen, ArrowRight } from "lucide-react";
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
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTestSeries } from "@/hooks/use-test-series";
import { usePlans } from "@/hooks/use-plans";
import { useAuth } from "@/hooks/use-auth";
import { Plan } from "@/lib/api/plans";
import { useCart } from "@/contexts/CartContext";
import { toast } from "react-hot-toast";

type ItemType = "all" | "plans" | "test-series";

interface MixedItem {
  type: "plan" | "test-series";
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  caLevel?: string;
  thumbnailUrl?: string;
  testSeriesCount?: number;
  plan?: Plan;
}

const BuyNow: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, user } = useAuth();
  const { cart, addToCart, removeFromCart, isLoading: cartLoading } = useCart();
  const { testSeries, fetchTestSeries, isLoading: testSeriesLoading } = useTestSeries();
  const { plans, fetchPlans, isLoading: plansLoading } = usePlans();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<
    "all" | "FOUNDATION" | "INTERMEDIATE" | "FINAL"
  >((searchParams.get("level") as "FOUNDATION" | "INTERMEDIATE" | "FINAL") || "all");
  const [selectedType, setSelectedType] = useState<ItemType>("all");

  useEffect(() => {
    // Fetch active plans
    fetchPlans(false);
    // Fetch only active test series for public marketplace
    fetchTestSeries({
      page: 1,
      limit: 50,
      search: searchTerm || undefined,
      caLevel: selectedLevel !== "all" ? selectedLevel : undefined,
      isActive: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevel]);

  // Calculate total price for a plan
  const getPlanTotalPrice = (plan: Plan) => {
    if (!plan.testSeriesItems || plan.testSeriesItems.length === 0) return 0;
    return plan.testSeriesItems.reduce((sum, item) => sum + (item.price || 0), 0);
  };

  // Get original price (sum of individual test series prices)
  const getPlanOriginalPrice = (plan: Plan) => {
    if (!plan.testSeriesItems || plan.testSeriesItems.length === 0) return 0;
    return plan.testSeriesItems.reduce((sum, item) => {
      const originalPrice = item.testSeries?.price || item.price || 0;
      return sum + originalPrice;
    }, 0);
  };

  // Create mixed items from plans and test series
  const mixedItems = useMemo(() => {
    const items: MixedItem[] = [];

    // Add plans
    plans.filter(p => p.isActive).forEach((plan) => {
      items.push({
        type: "plan",
        id: plan.id || plan._id || "",
        name: plan.name || "",
        description: plan.description,
        price: getPlanTotalPrice(plan),
        originalPrice: getPlanOriginalPrice(plan),
        testSeriesCount: plan.testSeriesCount || plan.testSeriesItems?.length || 0,
        plan: plan,
      });
    });

    // Add test series
    testSeries.forEach((ts) => {
      items.push({
        type: "test-series",
        id: String(ts.id),
        name: ts.title || "",
        description: ts.description,
        price: ts.price,
        originalPrice: ts.originalPrice || ts.price,
        caLevel: ts.caLevel,
        thumbnailUrl: ts.thumbnailUrl,
      });
    });

    return items;
  }, [plans, testSeries]);

  // Filter items based on search, type, and level
  const filteredItems = useMemo(() => {
    const lower = searchTerm.trim().toLowerCase();
    return mixedItems.filter((item) => {
      // Filter by type
      if (selectedType === "plans" && item.type !== "plan") return false;
      if (selectedType === "test-series" && item.type !== "test-series") return false;

      // Filter by search
      const matchesSearch =
        !lower ||
        item.name?.toLowerCase().includes(lower) ||
        (item.description || "").toLowerCase().includes(lower);

      // Filter by level (only for test series)
      const matchesLevel =
        selectedLevel === "all" ||
        item.type === "plan" ||
        item.caLevel === selectedLevel;

      return matchesSearch && matchesLevel;
    });
  }, [mixedItems, searchTerm, selectedType, selectedLevel]);

  const cartItemIds = useMemo(
    () => new Set(cart.items.map((item) => String(item.testSeriesId || item.testSeries?._id))),
    [cart.items]
  );

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const viewPlan = (planId: string) => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(`/plans/${planId}`)}`);
      return;
    }
    navigate(`/plans/${planId}`);
  };

  const buyNow = (seriesId: string) => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent("/buy-now")}`);
      return;
    }
    navigate(`/payment/checkout?testSeriesId=${seriesId}`);
  };

  const handleAddToCart = async (seriesId: string) => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent("/buy-now")}`);
      return;
    }
    const isStudentRole = user?.role === "STUDENTS" || user?.role === "STUDENT";
    if (!isStudentRole) {
      toast.error("Only students can add test series to cart.");
      return;
    }
    const added = await addToCart(seriesId);
    if (added) {
      toast.success("Added to cart. You can keep shopping or view your cart.");
    }
  };

  const handleRemoveFromCart = async (seriesId: string) => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent("/buy-now")}`);
      return;
    }
    const removed = await removeFromCart(seriesId);
    if (removed) {
      toast.success("Removed from cart.");
    }
  };

  const isLoading = plansLoading || testSeriesLoading;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Test Series Marketplace</h1>
          <p className="text-gray-600">
            Browse available plans and test series to start practicing today.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search plans and test series..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={selectedType}
            onValueChange={(v: ItemType) => setSelectedType(v)}
          >
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="plans">Plans</SelectItem>
              <SelectItem value="test-series">Test Series</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={selectedLevel}
            onValueChange={(
              v: "all" | "FOUNDATION" | "INTERMEDIATE" | "FINAL"
            ) => setSelectedLevel(v)}
          >
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="FOUNDATION">Foundation</SelectItem>
              <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
              <SelectItem value="FINAL">Final</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredItems.length} results
            {selectedType !== "all" && (
              <span> ({selectedType === "plans" ? "Plans" : "Test Series"})</span>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <span>
                Cart: <span className="font-semibold">{cart.itemCount}</span>{" "}
                {cart.itemCount === 1 ? "item" : "items"}
              </span>
              {cart.itemCount > 0 && (
                <span className="font-semibold text-primary">
                  ₹{cart.totalPrice}
                </span>
              )}
            </div>
            <Button
              type="button"
              variant={cart.itemCount > 0 ? "default" : "outline"}
              onClick={() => navigate("/cart")}
              className="whitespace-nowrap"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              View Cart
            </Button>
          </div>
        </div>

        {/* Mixed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={`skeleton-${i}`} className="h-72 animate-pulse bg-gray-200" />
            ))}

          {!isLoading &&
            filteredItems.map((item) => {
              if (item.type === "plan") {
                const hasDiscount = item.originalPrice && item.price < item.originalPrice;
                const discountPercent = hasDiscount
                  ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100)
                  : 0;

                return (
                  <Card
                    key={`plan-${item.id}`}
                    className="overflow-hidden flex flex-col h-full border-2 border-transparent hover:border-primary transition-all hover:shadow-lg cursor-pointer group"
                    onClick={() => viewPlan(item.id)}
                  >
                    <div className="bg-gradient-to-r from-primary to-accent p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-6 w-6" />
                          <Badge variant="secondary" className="bg-white/20 text-white border-0">
                            PLAN
                          </Badge>
                        </div>
                        {hasDiscount && (
                          <Badge className="bg-green-500 text-white">
                            {discountPercent}% OFF
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardHeader className="flex-shrink-0 pb-2">
                      <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                        {item.name}
                      </CardTitle>
                      {item.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 flex-1 p-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BookOpen className="h-4 w-4" />
                        <span className="font-medium">
                          {item.testSeriesCount} Test Series Included
                        </span>
                      </div>

                      <div className="mt-auto pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-bold text-primary">
                              ₹{item.price.toLocaleString()}
                            </span>
                            {hasDiscount && (
                              <span className="ml-2 text-sm text-gray-400 line-through">
                                ₹{item.originalPrice!.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button className="w-full bg-gradient-to-r from-primary to-accent group-hover:shadow-md transition-all">
                          View Plan <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              } else {
                // Test Series Card
                const hasDiscount = item.originalPrice && item.price < item.originalPrice;
                const discountPercent = hasDiscount
                  ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100)
                  : 0;
                const isInCart = cartItemIds.has(String(item.id));
                return (
                  <Card
                    key={`ts-${item.id}`}
                    className="overflow-hidden flex flex-col h-full border-2 border-transparent hover:border-primary transition-all hover:shadow-lg group"
                  >
                    <div className="flex-shrink-0 relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors z-10" />
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.name}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="flex-shrink-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">TEST SERIES</Badge>
                        {item.caLevel && <Badge>{item.caLevel}</Badge>}
                        {hasDiscount && <Badge className="bg-green-500 text-white">{discountPercent}% OFF</Badge>}
                      </div>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      {item.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 flex-1 p-6">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>Multiple tests</span>
                      </div>
                      <div className="mt-auto space-y-3">
                        <div className="text-center">
                          <span className="text-2xl font-bold text-primary">
                            ₹{item.price}
                          </span>
                          {hasDiscount && (
                            <span className="ml-2 text-sm text-gray-400 line-through">
                              ₹{item.originalPrice}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Button
                            onClick={() =>
                              isInCart
                                ? handleRemoveFromCart(item.id)
                                : handleAddToCart(item.id)
                            }
                            variant={isInCart ? "destructive" : "outline"}
                            disabled={cartLoading}
                            className="w-full"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {isInCart ? "Remove" : "Add to Cart"}
                          </Button>
                          <Button
                            onClick={() => buyNow(item.id)}
                            className="w-full bg-gradient-to-r from-primary to-accent"
                          >
                            <ArrowRight className="w-4 h-4 mr-2" /> Buy Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
            })}
        </div>

        {!isLoading && filteredItems.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">No items found.</p>
            <p className="text-sm mt-2">Try adjusting your search or filters.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BuyNow;
